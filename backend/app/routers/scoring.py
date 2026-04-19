from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_verified_current_user
from app.db import get_db
from app.models import User, UserRole
from app.schemas import CalculateScoreNearestResponse, CalculateScoreRequest, CalculateScoreResponse
from app.services.ml_adapter import calculate_compatibility_score
from app.services.profile_service import get_consumer_profile_by_user, get_producer_profile_by_user
from app.services.scoring_context_service import build_scoring_payload_from_context, select_nearest_counterpart

router = APIRouter(tags=["scoring"])


@router.post("/calculate-score", response_model=CalculateScoreResponse)
def calculate_score(payload: CalculateScoreRequest):
    scores = calculate_compatibility_score(
        distance_km=payload.distance_km,
        producer_temp_c=payload.producer_temp_c,
        consumer_min_temp_c=payload.consumer_min_temp_c,
        volume_match_ratio=payload.volume_match_ratio,
        schedule_overlap_ratio=payload.schedule_overlap_ratio,
    )
    return CalculateScoreResponse(status="success", **scores)


@router.get("/calculate-score/nearest-context", response_model=CalculateScoreNearestResponse)
def calculate_score_from_nearest_context(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_current_user),
):
    if current_user.role == UserRole.producer:
        profile = get_producer_profile_by_user(db, current_user.id)
        if not profile:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producer profile not found")
        latitude = profile.latitude
        longitude = profile.longitude
        profile_data = {
            "supply_temperature_c": profile.supply_temperature_c,
            "heat_output_kw": profile.heat_output_kw,
            "schedule_description": profile.schedule_description,
        }
    else:
        profile = get_consumer_profile_by_user(db, current_user.id)
        if not profile:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consumer profile not found")
        latitude = profile.latitude
        longitude = profile.longitude
        profile_data = {
            "demand_temperature_c": profile.demand_temperature_c,
            "flow_rate_lph": profile.flow_rate_lph,
            "schedule_description": profile.schedule_description,
        }

    counterpart = select_nearest_counterpart(
        user_role=current_user.role,
        latitude=latitude,
        longitude=longitude,
    )
    if not counterpart:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No nearest counterpart found in real dataset",
        )

    payload = build_scoring_payload_from_context(
        user_role=current_user.role,
        user_profile=profile_data,
        counterpart=counterpart,
    )

    scores = calculate_compatibility_score(**payload)
    counterpart_role = UserRole.consumer if counterpart.get("role") == "CONSUMER" else UserRole.producer

    return CalculateScoreNearestResponse(
        status="success",
        comparison_source="real_dataset_nearest",
        counterpart_role=counterpart_role,
        counterpart_label=f"{counterpart.get('industry_type', 'facility')} ({counterpart.get('facility_id', 'unknown')})",
        counterpart_city_zone=str(counterpart.get("city_zone") or "Unknown"),
        distance_km=round(float(counterpart.get("distance_km") or 0), 2),
        **scores,
    )