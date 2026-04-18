from datetime import datetime

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, joinedload

from app.models import ConsumerProfile, Match, ProducerProfile, User, UserRole
from app.schemas import (
    GenerateMatchesResponse,
    MatchCardResponse,
    MatchDetailResponse,
    MatchListResponse,
    ProfileSummaryResponse,
)
from app.services.ml_adapter import fetch_recommendations_for_user, score_match_candidates


def list_matches_for_user(db: Session, user: User) -> MatchListResponse:
    stmt = (
        select(Match)
        .where(or_(Match.producer_user_id == user.id, Match.consumer_user_id == user.id))
        .options(joinedload(Match.producer_user), joinedload(Match.consumer_user))
        .order_by(Match.generated_at.desc().nullslast(), Match.id.desc())
    )
    matches = db.execute(stmt).scalars().all()

    if not matches:
        fallback = fetch_recommendations_for_user(user)
        return MatchListResponse(integration_state=fallback["integration_state"], items=[])

    cards: list[MatchCardResponse] = []
    for match in matches:
        counterpart = match.consumer_user if user.id == match.producer_user_id else match.producer_user
        counterpart_role = UserRole.consumer if user.id == match.producer_user_id else UserRole.producer
        cards.append(
            MatchCardResponse(
                match_id=match.id,
                counterpart_user_id=counterpart.id,
                counterpart_organization_name=counterpart.organization_name,
                counterpart_role=counterpart_role,
                compatibility_score=match.compatibility_score,
                integration_state=match.integration_state,
                model_version=match.model_version,
            )
        )

    return MatchListResponse(integration_state="ready", items=cards)


def get_match_detail_for_user(db: Session, user: User, match_id: int) -> MatchDetailResponse | None:
    stmt = (
        select(Match)
        .where(
            Match.id == match_id,
            or_(Match.producer_user_id == user.id, Match.consumer_user_id == user.id),
        )
        .options(
            joinedload(Match.producer_user).joinedload(User.producer_profile),
            joinedload(Match.consumer_user).joinedload(User.consumer_profile),
        )
    )
    match = db.execute(stmt).scalars().first()
    if not match:
        return None

    producer_profile = _producer_summary(match.producer_user.producer_profile)
    consumer_profile = _consumer_summary(match.consumer_user.consumer_profile)

    return MatchDetailResponse(
        match_id=match.id,
        producer_user_id=match.producer_user_id,
        consumer_user_id=match.consumer_user_id,
        compatibility_score=match.compatibility_score,
        integration_state=match.integration_state,
        model_version=match.model_version,
        producer_profile=producer_profile,
        consumer_profile=consumer_profile,
    )


def generate_matches_for_user(db: Session, user: User, max_candidates: int) -> GenerateMatchesResponse:
    candidates = _build_candidates_for_user(db, user, max_candidates=max_candidates)
    adapter_result = score_match_candidates(candidates)

    if adapter_result["integration_state"] != "ready":
        return GenerateMatchesResponse(
            integration_state="model_unavailable",
            model_version=adapter_result.get("model_version"),
            generated_count=0,
            updated_count=0,
        )

    generated_count, updated_count = _upsert_match_scores(
        db,
        scores=adapter_result["scores"],
        model_version=adapter_result.get("model_version"),
        integration_state="ready",
    )
    return GenerateMatchesResponse(
        integration_state="ready",
        model_version=adapter_result.get("model_version"),
        generated_count=generated_count,
        updated_count=updated_count,
    )


def _build_candidates_for_user(db: Session, user: User, max_candidates: int) -> list[dict]:
    candidates: list[dict] = []
    if user.role == UserRole.producer:
        producer_profile = db.execute(
            select(ProducerProfile).where(ProducerProfile.user_id == user.id)
        ).scalars().first()
        if not producer_profile:
            return []
        stmt = (
            select(ConsumerProfile)
            .join(User, ConsumerProfile.user_id == User.id)
            .where(User.is_email_verified.is_(True), ConsumerProfile.user_id != user.id)
            .limit(max_candidates)
        )
        consumers = db.execute(stmt).scalars().all()
        for consumer in consumers:
            candidates.append(
                {
                    "producer_user_id": user.id,
                    "consumer_user_id": consumer.user_id,
                    "producer": {
                        "latitude": producer_profile.latitude,
                        "longitude": producer_profile.longitude,
                        "supply_temperature_c": producer_profile.supply_temperature_c,
                        "heat_output_kw": producer_profile.heat_output_kw,
                        "schedule_description": producer_profile.schedule_description,
                    },
                    "consumer": {
                        "latitude": consumer.latitude,
                        "longitude": consumer.longitude,
                        "demand_temperature_c": consumer.demand_temperature_c,
                        "flow_rate_lph": consumer.flow_rate_lph,
                        "schedule_description": consumer.schedule_description,
                    },
                }
            )
        return candidates

    consumer_profile = db.execute(
        select(ConsumerProfile).where(ConsumerProfile.user_id == user.id)
    ).scalars().first()
    if not consumer_profile:
        return []

    stmt = (
        select(ProducerProfile)
        .join(User, ProducerProfile.user_id == User.id)
        .where(User.is_email_verified.is_(True), ProducerProfile.user_id != user.id)
        .limit(max_candidates)
    )
    producers = db.execute(stmt).scalars().all()
    for producer in producers:
        candidates.append(
            {
                "producer_user_id": producer.user_id,
                "consumer_user_id": user.id,
                "producer": {
                    "latitude": producer.latitude,
                    "longitude": producer.longitude,
                    "supply_temperature_c": producer.supply_temperature_c,
                    "heat_output_kw": producer.heat_output_kw,
                    "schedule_description": producer.schedule_description,
                },
                "consumer": {
                    "latitude": consumer_profile.latitude,
                    "longitude": consumer_profile.longitude,
                    "demand_temperature_c": consumer_profile.demand_temperature_c,
                    "flow_rate_lph": consumer_profile.flow_rate_lph,
                    "schedule_description": consumer_profile.schedule_description,
                },
            }
        )
    return candidates


def _upsert_match_scores(db: Session, scores: list[dict], model_version: str | None, integration_state: str) -> tuple[int, int]:
    generated_count = 0
    updated_count = 0
    now = datetime.utcnow()

    for score in scores:
        stmt = select(Match).where(
            Match.producer_user_id == score["producer_user_id"],
            Match.consumer_user_id == score["consumer_user_id"],
        )
        existing = db.execute(stmt).scalars().first()
        if existing:
            existing.compatibility_score = score["compatibility_score"]
            existing.integration_state = integration_state
            existing.model_version = model_version
            existing.generated_at = now
            updated_count += 1
            continue

        db.add(
            Match(
                producer_user_id=score["producer_user_id"],
                consumer_user_id=score["consumer_user_id"],
                compatibility_score=score["compatibility_score"],
                integration_state=integration_state,
                model_version=model_version,
                generated_at=now,
            )
        )
        generated_count += 1

    db.commit()
    return generated_count, updated_count


def _producer_summary(profile: ProducerProfile | None) -> ProfileSummaryResponse | None:
    if not profile:
        return None
    return ProfileSummaryResponse(
        facility_name=profile.facility_name,
        latitude=profile.latitude,
        longitude=profile.longitude,
        schedule_description=profile.schedule_description,
    )


def _consumer_summary(profile: ConsumerProfile | None) -> ProfileSummaryResponse | None:
    if not profile:
        return None
    return ProfileSummaryResponse(
        facility_name=profile.facility_name,
        latitude=profile.latitude,
        longitude=profile.longitude,
        schedule_description=profile.schedule_description,
    )
