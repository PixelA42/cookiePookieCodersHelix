from fastapi import APIRouter

from app.schemas import CalculateScoreRequest, CalculateScoreResponse
from app.services.ml_adapter import calculate_compatibility_score

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