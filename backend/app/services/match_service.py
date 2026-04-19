from datetime import datetime

from sqlalchemy import and_, or_, select
from sqlalchemy.inspection import inspect
from sqlalchemy.orm import Session, joinedload

from app.models import ConsumerProfile, Match, MatchFeedback, ProducerProfile, User, UserRole
from app.schemas import (
    GenerateMatchesResponse,
    MatchCardResponse,
    MatchDetailResponse,
    MatchListResponse,
    ProfileSummaryResponse,
)
from app.services.ml_adapter import fetch_recommendations_for_user, score_match_candidates
from app.services.geo_utils import haversine_km

MAX_PIPE_DISTANCE_KM = 10.0


def _user_id(user: User) -> int:
    identity = inspect(user).identity
    return int(identity[0]) if identity else int(user.id)


def list_matches_for_user(db: Session, user: User) -> MatchListResponse:
    user_id = _user_id(user)
    candidates = _build_candidates_for_user(db, user, max_candidates=1000)
    local_scores = _score_candidates_locally(candidates)
    if local_scores:
        _upsert_match_scores(
            db,
            scores=local_scores,
            model_version="local-haversine-v1",
            integration_state="local_rules",
        )

    stmt = (
        select(Match)
        .where(or_(Match.producer_user_id == user_id, Match.consumer_user_id == user_id))
        .options(joinedload(Match.producer_user), joinedload(Match.consumer_user))
        .order_by(Match.compatibility_score.desc().nullslast(), Match.generated_at.desc().nullslast(), Match.id.desc())
    )
    matches = db.execute(stmt).scalars().all()

    if not matches:
        fallback = fetch_recommendations_for_user(user)
        return MatchListResponse(integration_state=fallback["integration_state"], items=[])

    cards: list[MatchCardResponse] = []
    for match in matches:
        counterpart = match.consumer_user if user_id == match.producer_user_id else match.producer_user
        counterpart_role = UserRole.consumer if user_id == match.producer_user_id else UserRole.producer
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
    user_id = _user_id(user)
    stmt = (
        select(Match)
        .where(
            Match.id == match_id,
            or_(Match.producer_user_id == user_id, Match.consumer_user_id == user_id),
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
    user_id = _user_id(user)
    candidates = _build_candidates_for_user(db, user, max_candidates=max_candidates)
    if not candidates:
        if not _has_profile_for_user(db, user_id):
            return GenerateMatchesResponse(
                integration_state="profile_incomplete",
                model_version=None,
                generated_count=0,
                updated_count=0,
            )
        return GenerateMatchesResponse(
            integration_state="no_candidates",
            model_version=None,
            generated_count=0,
            updated_count=0,
        )

    adapter_result = score_match_candidates(
        candidates,
        feedback_context=_feedback_context_for_candidates(db, candidates),
        requester_user_id=user_id,
    )

    if adapter_result["integration_state"] != "ready":
        local_scores = _score_candidates_locally(candidates)
        generated_count, updated_count = _upsert_match_scores(
            db,
            scores=local_scores,
            model_version="local-haversine-v1",
            integration_state="local_rules",
        )
        return GenerateMatchesResponse(
            integration_state="ready" if local_scores else "model_unavailable",
            model_version="local-haversine-v1" if local_scores else adapter_result.get("model_version"),
            generated_count=generated_count,
            updated_count=updated_count,
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
    user_id = _user_id(user)
    user_role = db.execute(select(User.role).where(User.id == user_id)).scalars().first() or user.role
    candidates: list[dict] = []
    if user_role == UserRole.producer:
        producer_profile = db.execute(
            select(ProducerProfile).where(ProducerProfile.user_id == user_id)
        ).scalars().first()
        if not producer_profile:
            return []
        stmt = (
            select(ConsumerProfile)
            .join(User, ConsumerProfile.user_id == User.id)
            .where(User.is_email_verified.is_(True), ConsumerProfile.user_id != user_id)
            .limit(max_candidates)
        )
        consumers = db.execute(stmt).scalars().all()
        for consumer in consumers:
            candidates.append(
                {
                    "producer_user_id": user_id,
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
        select(ConsumerProfile).where(ConsumerProfile.user_id == user_id)
    ).scalars().first()
    if not consumer_profile:
        return []

    stmt = (
        select(ProducerProfile)
        .join(User, ProducerProfile.user_id == User.id)
        .where(User.is_email_verified.is_(True), ProducerProfile.user_id != user_id)
        .limit(max_candidates)
    )
    producers = db.execute(stmt).scalars().all()
    for producer in producers:
        candidates.append(
            {
                "producer_user_id": producer.user_id,
                "consumer_user_id": user_id,
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


def _has_profile_for_user(db: Session, user_id: int) -> bool:
    producer_exists = db.execute(
        select(ProducerProfile.id).where(ProducerProfile.user_id == user_id)
    ).scalars().first()
    if producer_exists is not None:
        return True

    consumer_exists = db.execute(
        select(ConsumerProfile.id).where(ConsumerProfile.user_id == user_id)
    ).scalars().first()
    return consumer_exists is not None


def _feedback_context_for_candidates(db: Session, candidates: list[dict]) -> list[dict]:
    pairs = {
        (int(item["producer_user_id"]), int(item["consumer_user_id"]))
        for item in candidates
    }
    if not pairs:
        return []

    conditions = [
        and_(
            Match.producer_user_id == producer_id,
            Match.consumer_user_id == consumer_id,
        )
        for producer_id, consumer_id in pairs
    ]
    stmt = (
        select(MatchFeedback, Match)
        .join(Match, Match.id == MatchFeedback.match_id)
        .where(or_(*conditions))
    )
    rows = db.execute(stmt).all()

    context: list[dict] = []
    for feedback, match in rows:
        context.append(
            {
                "producer_user_id": match.producer_user_id,
                "consumer_user_id": match.consumer_user_id,
                "feedback_user_id": feedback.user_id,
                "feedback_label": feedback.feedback_label.value,
                "updated_at": feedback.updated_at.isoformat(),
            }
        )
    return context


def _score_candidates_locally(candidates: list[dict]) -> list[dict]:
    scored: list[dict] = []
    for item in candidates:
        producer = item["producer"]
        consumer = item["consumer"]

        distance_km = haversine_km(
            float(producer["latitude"]),
            float(producer["longitude"]),
            float(consumer["latitude"]),
            float(consumer["longitude"]),
        )

        # Stage 1: hard filter by physical feasibility and temperature compatibility.
        if distance_km > MAX_PIPE_DISTANCE_KM:
            continue
        if float(producer["supply_temperature_c"]) < float(consumer["demand_temperature_c"]):
            continue

        distance_score = max(0.0, 100.0 * (1.0 - (distance_km / MAX_PIPE_DISTANCE_KM)))

        producer_schedule = str(producer.get("schedule_description") or "").strip().lower()
        consumer_schedule = str(consumer.get("schedule_description") or "").strip().lower()
        schedule_score = 100.0 if producer_schedule and producer_schedule == consumer_schedule else 60.0

        heat_output_kw = max(float(producer.get("heat_output_kw") or 0.0), 0.0001)
        thermal_demand = max(float(consumer.get("flow_rate_lph") or 0.0), 0.0001)
        volume_match_score = (min(heat_output_kw, thermal_demand) / max(heat_output_kw, thermal_demand)) * 100.0

        compatibility_score = round(
            (0.45 * distance_score) + (0.35 * schedule_score) + (0.20 * volume_match_score),
            2,
        )

        scored.append(
            {
                "producer_user_id": item["producer_user_id"],
                "consumer_user_id": item["consumer_user_id"],
                "compatibility_score": compatibility_score,
            }
        )

    scored.sort(key=lambda row: row["compatibility_score"], reverse=True)
    return scored


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
        supply_temperature_c=profile.supply_temperature_c,
        heat_output_kw=profile.heat_output_kw,
    )


def _consumer_summary(profile: ConsumerProfile | None) -> ProfileSummaryResponse | None:
    if not profile:
        return None
    return ProfileSummaryResponse(
        facility_name=profile.facility_name,
        latitude=profile.latitude,
        longitude=profile.longitude,
        schedule_description=profile.schedule_description,
        demand_temperature_c=profile.demand_temperature_c,
        flow_rate_lph=profile.flow_rate_lph,
    )
