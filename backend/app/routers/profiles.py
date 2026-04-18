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
