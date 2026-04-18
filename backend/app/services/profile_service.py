from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import ConsumerProfile, ProducerProfile
from app.schemas import (
    ConsumerProfileCreateRequest,
    ConsumerProfileUpdateRequest,
    ProducerProfileCreateRequest,
    ProducerProfileUpdateRequest,
)


def get_producer_profile_by_user(db: Session, user_id: int) -> ProducerProfile | None:
    stmt = select(ProducerProfile).where(ProducerProfile.user_id == user_id)
    return db.execute(stmt).scalars().first()


def create_producer_profile(db: Session, user_id: int, payload: ProducerProfileCreateRequest) -> ProducerProfile:
    profile = ProducerProfile(user_id=user_id, **payload.model_dump())
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def update_producer_profile(db: Session, profile: ProducerProfile, payload: ProducerProfileUpdateRequest) -> ProducerProfile:
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return profile


def get_consumer_profile_by_user(db: Session, user_id: int) -> ConsumerProfile | None:
    stmt = select(ConsumerProfile).where(ConsumerProfile.user_id == user_id)
    return db.execute(stmt).scalars().first()


def create_consumer_profile(db: Session, user_id: int, payload: ConsumerProfileCreateRequest) -> ConsumerProfile:
    profile = ConsumerProfile(user_id=user_id, **payload.model_dump())
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def update_consumer_profile(db: Session, profile: ConsumerProfile, payload: ConsumerProfileUpdateRequest) -> ConsumerProfile:
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return profile
