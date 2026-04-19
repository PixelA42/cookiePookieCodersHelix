from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_verified_current_user
from app.db import get_db
from app.models import User, UserRole
from app.schemas import (
    ConsumerProfileCreateRequest,
    ConsumerProfileResponse,
    ConsumerProfileUpdateRequest,
    ProducerProfileCreateRequest,
    ProducerProfileResponse,
    ProducerProfileUpdateRequest,
    UnifiedProfileResponse,
    UnifiedProfileUpsertRequest,
)
from app.services.profile_service import (
    create_consumer_profile,
    create_producer_profile,
    get_consumer_profile_by_user,
    get_producer_profile_by_user,
    update_consumer_profile,
    update_producer_profile,
)

router = APIRouter(prefix="/profiles", tags=["profiles"])


def _enforce_role(user: User, required_role: UserRole) -> None:
    if user.role != required_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Only {required_role.value} users can access this endpoint",
        )


def _as_unified_profile(db: Session, current_user: User) -> UnifiedProfileResponse | None:
    producer = get_producer_profile_by_user(db, current_user.id)
    if producer:
        return UnifiedProfileResponse(
            role=UserRole.producer,
            facility_name=producer.facility_name,
            latitude=producer.latitude,
            longitude=producer.longitude,
            schedule_description=producer.schedule_description,
            supply_temperature_c=producer.supply_temperature_c,
            heat_output_kw=producer.heat_output_kw,
        )

    consumer = get_consumer_profile_by_user(db, current_user.id)
    if consumer:
        return UnifiedProfileResponse(
            role=UserRole.consumer,
            facility_name=consumer.facility_name,
            latitude=consumer.latitude,
            longitude=consumer.longitude,
            schedule_description=consumer.schedule_description,
            demand_temperature_c=consumer.demand_temperature_c,
            flow_rate_lph=consumer.flow_rate_lph,
        )
    return None


@router.post("", response_model=UnifiedProfileResponse)
def upsert_profile(
    payload: UnifiedProfileUpsertRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_current_user),
):
    if payload.role != current_user.role:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Profile role must match account role")

    if current_user.role == UserRole.producer:
        existing = get_producer_profile_by_user(db, current_user.id)
        if existing:
            update_producer_profile(
                db,
                existing,
                ProducerProfileUpdateRequest(
                    facility_name=payload.facility_name,
                    latitude=payload.latitude,
                    longitude=payload.longitude,
                    supply_temperature_c=payload.supply_temperature_c,
                    heat_output_kw=payload.heat_output_kw,
                    schedule_description=payload.schedule_description,
                ),
            )
        else:
            create_producer_profile(
                db,
                current_user.id,
                ProducerProfileCreateRequest(
                    facility_name=payload.facility_name,
                    latitude=payload.latitude,
                    longitude=payload.longitude,
                    supply_temperature_c=payload.supply_temperature_c,
                    heat_output_kw=payload.heat_output_kw,
                    schedule_description=payload.schedule_description,
                ),
            )
    else:
        existing = get_consumer_profile_by_user(db, current_user.id)
        if existing:
            update_consumer_profile(
                db,
                existing,
                ConsumerProfileUpdateRequest(
                    facility_name=payload.facility_name,
                    latitude=payload.latitude,
                    longitude=payload.longitude,
                    demand_temperature_c=payload.demand_temperature_c,
                    flow_rate_lph=payload.flow_rate_lph,
                    schedule_description=payload.schedule_description,
                ),
            )
        else:
            create_consumer_profile(
                db,
                current_user.id,
                ConsumerProfileCreateRequest(
                    facility_name=payload.facility_name,
                    latitude=payload.latitude,
                    longitude=payload.longitude,
                    demand_temperature_c=payload.demand_temperature_c,
                    flow_rate_lph=payload.flow_rate_lph,
                    schedule_description=payload.schedule_description,
                ),
            )

    profile = _as_unified_profile(db, current_user)
    if not profile:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to save profile")
    return profile


@router.get("/me", response_model=UnifiedProfileResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_current_user),
):
    profile = _as_unified_profile(db, current_user)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile


@router.post("/producer", response_model=ProducerProfileResponse, status_code=status.HTTP_201_CREATED)
def create_producer(
    payload: ProducerProfileCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_current_user),
):
    _enforce_role(current_user, UserRole.producer)
    existing = get_producer_profile_by_user(db, current_user.id)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Producer profile already exists")
    return create_producer_profile(db, current_user.id, payload)


@router.get("/producer", response_model=ProducerProfileResponse)
def get_producer(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_current_user),
):
    _enforce_role(current_user, UserRole.producer)
    profile = get_producer_profile_by_user(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producer profile not found")
    return profile


@router.put("/producer", response_model=ProducerProfileResponse)
def put_producer(
    payload: ProducerProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_current_user),
):
    _enforce_role(current_user, UserRole.producer)
    profile = get_producer_profile_by_user(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producer profile not found")
    return update_producer_profile(db, profile, payload)


@router.post("/consumer", response_model=ConsumerProfileResponse, status_code=status.HTTP_201_CREATED)
def create_consumer(
    payload: ConsumerProfileCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_current_user),
):
    _enforce_role(current_user, UserRole.consumer)
    existing = get_consumer_profile_by_user(db, current_user.id)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Consumer profile already exists")
    return create_consumer_profile(db, current_user.id, payload)


@router.get("/consumer", response_model=ConsumerProfileResponse)
def get_consumer(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_current_user),
):
    _enforce_role(current_user, UserRole.consumer)
    profile = get_consumer_profile_by_user(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consumer profile not found")
    return profile


@router.put("/consumer", response_model=ConsumerProfileResponse)
def put_consumer(
    payload: ConsumerProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_current_user),
):
    _enforce_role(current_user, UserRole.consumer)
    profile = get_consumer_profile_by_user(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consumer profile not found")
    return update_consumer_profile(db, profile, payload)
