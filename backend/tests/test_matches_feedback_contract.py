import os

from fastapi.testclient import TestClient
from sqlalchemy import delete
from sqlalchemy.orm import Session

os.environ.setdefault("APP_NAME", "HeatREco API")
os.environ.setdefault("API_V1_PREFIX", "/api/v1")
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_match_feedback.db")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
os.environ.setdefault("OTP_EXPIRE_MINUTES", "10")
os.environ.setdefault("OTP_MAX_ATTEMPTS", "3")
os.environ.setdefault("OTP_RESEND_COOLDOWN_SECONDS", "90")
os.environ.setdefault("SMTP_HOST", "smtp.example.com")
os.environ.setdefault("SMTP_PORT", "587")
os.environ.setdefault("SMTP_USERNAME", "user")
os.environ.setdefault("SMTP_PASSWORD", "pass")
os.environ.setdefault("SMTP_FROM_EMAIL", "no-reply@example.com")
os.environ.setdefault("SMTP_USE_TLS", "true")

from app.core.security import get_verified_current_user  # noqa: E402
from app.db import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models import (  # noqa: E402
    ConsumerProfile,
    FeedbackLabel,
    Match,
    MatchFeedback,
    OtpVerification,
    ProducerProfile,
    User,
    UserRole,
)


def _reset_db() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        db.execute(delete(MatchFeedback))
        db.execute(delete(Match))
        db.execute(delete(ProducerProfile))
        db.execute(delete(ConsumerProfile))
        db.execute(delete(OtpVerification))
        db.execute(delete(User))
        db.commit()


def _create_user(db: Session, email: str, role: UserRole) -> User:
    user = User(
        organization_name=f"Org-{role.value}",
        email=email,
        password_hash="hash",
        role=role,
        is_email_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_matches_auth_required() -> None:
    _reset_db()
    client = TestClient(app)
    response = client.get("/api/v1/matches")
    assert response.status_code == 401


def test_matches_returns_model_unavailable_when_no_rows() -> None:
    _reset_db()
    with SessionLocal() as db:
        user = _create_user(db, "producer@test.com", UserRole.producer)

    app.dependency_overrides[get_verified_current_user] = lambda: user
    client = TestClient(app)
    response = client.get("/api/v1/matches")
    app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["integration_state"] == "model_unavailable"
    assert payload["items"] == []


def test_feedback_upsert_updates_existing_row() -> None:
    _reset_db()
    with SessionLocal() as db:
        producer = _create_user(db, "producer1@test.com", UserRole.producer)
        consumer = _create_user(db, "consumer1@test.com", UserRole.consumer)
        match = Match(
            producer_user_id=producer.id,
            consumer_user_id=consumer.id,
            compatibility_score=None,
            integration_state="model_unavailable",
            model_version=None,
            generated_at=None,
        )
        db.add(match)
        db.commit()
        db.refresh(match)
        match_id = match.id

    app.dependency_overrides[get_verified_current_user] = lambda: producer
    client = TestClient(app)

    first = client.post(f"/api/v1/matches/{match_id}/feedback", json={"feedback_label": "useful"})
    second = client.post(f"/api/v1/matches/{match_id}/feedback", json={"feedback_label": "not_useful"})
    app.dependency_overrides.clear()

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["id"] == second.json()["id"]
    assert second.json()["feedback_label"] == FeedbackLabel.not_useful.value


def test_match_detail_enforces_ownership() -> None:
    _reset_db()
    with SessionLocal() as db:
        producer = _create_user(db, "producer-own@test.com", UserRole.producer)
        consumer = _create_user(db, "consumer-own@test.com", UserRole.consumer)
        outsider = _create_user(db, "outsider@test.com", UserRole.producer)
        match = Match(
            producer_user_id=producer.id,
            consumer_user_id=consumer.id,
            compatibility_score=77.5,
            integration_state="ready",
            model_version="v0",
        )
        db.add(match)
        db.commit()
        db.refresh(match)
        match_id = match.id

    app.dependency_overrides[get_verified_current_user] = lambda: outsider
    client = TestClient(app)
    response = client.get(f"/api/v1/matches/{match_id}")
    app.dependency_overrides.clear()

    assert response.status_code == 404


def test_generation_returns_model_unavailable_when_ml_not_connected() -> None:
    _reset_db()
    with SessionLocal() as db:
        producer = _create_user(db, "producer-gen@test.com", UserRole.producer)
        consumer = _create_user(db, "consumer-gen@test.com", UserRole.consumer)
        db.add(
            ProducerProfile(
                user_id=producer.id,
                facility_name="P1",
                latitude=10,
                longitude=20,
                supply_temperature_c=80,
                heat_output_kw=100,
                schedule_description="always",
            )
        )
        db.add(
            ConsumerProfile(
                user_id=consumer.id,
                facility_name="C1",
                latitude=11,
                longitude=21,
                demand_temperature_c=60,
                flow_rate_lph=500,
                schedule_description="always",
            )
        )
        db.commit()

    app.dependency_overrides[get_verified_current_user] = lambda: producer
    client = TestClient(app)
    response = client.post("/api/v1/matches/generate", json={"max_candidates": 20})
    app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["integration_state"] == "model_unavailable"
    assert payload["generated_count"] == 0
    assert payload["updated_count"] == 0


def test_generation_success_and_upsert_no_duplicates() -> None:
    _reset_db()
    producer_id = 0
    consumer_id = 0
    with SessionLocal() as db:
        producer = _create_user(db, "producer-upsert@test.com", UserRole.producer)
        consumer = _create_user(db, "consumer-upsert@test.com", UserRole.consumer)
        producer_id = producer.id
        consumer_id = consumer.id
        db.add(
            ProducerProfile(
                user_id=producer_id,
                facility_name="P2",
                latitude=10,
                longitude=20,
                supply_temperature_c=90,
                heat_output_kw=200,
                schedule_description="day",
            )
        )
        db.add(
            ConsumerProfile(
                user_id=consumer_id,
                facility_name="C2",
                latitude=12,
                longitude=22,
                demand_temperature_c=55,
                flow_rate_lph=450,
                schedule_description="day",
            )
        )
        db.commit()

    import app.services.match_service as match_service_module

    original = match_service_module.score_match_candidates

    def fake_scores(_candidates):
        return {
            "integration_state": "ready",
            "model_version": "ml-v1",
            "scores": [
                {
                        "producer_user_id": producer_id,
                        "consumer_user_id": consumer_id,
                    "compatibility_score": 81.0,
                }
            ],
        }

    match_service_module.score_match_candidates = fake_scores

    try:
        app.dependency_overrides[get_verified_current_user] = lambda: producer
        client = TestClient(app)

        first = client.post("/api/v1/matches/generate", json={"max_candidates": 20})
        assert first.status_code == 200
        assert first.json()["generated_count"] == 1
        assert first.json()["updated_count"] == 0

        def fake_scores_update(_candidates):
            return {
                "integration_state": "ready",
                "model_version": "ml-v2",
                "scores": [
                    {
                        "producer_user_id": producer_id,
                        "consumer_user_id": consumer_id,
                        "compatibility_score": 88.0,
                    }
                ],
            }

        match_service_module.score_match_candidates = fake_scores_update
        second = client.post("/api/v1/matches/generate", json={"max_candidates": 20})
        assert second.status_code == 200
        assert second.json()["generated_count"] == 0
        assert second.json()["updated_count"] == 1

        with SessionLocal() as db:
            rows = db.query(Match).filter_by(producer_user_id=producer_id, consumer_user_id=consumer_id).all()
            assert len(rows) == 1
            assert rows[0].compatibility_score == 88.0
            assert rows[0].model_version == "ml-v2"
    finally:
        app.dependency_overrides.clear()
        match_service_module.score_match_candidates = original
