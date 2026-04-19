from collections.abc import Sequence

import httpx

from app.core.config import get_settings
from app.models import User


def calculate_compatibility_score(
    *,
    distance_km: float,
    producer_temp_c: float,
    consumer_min_temp_c: float,
    volume_match_ratio: float,
    schedule_overlap_ratio: float,
) -> dict:
    """Lightweight deterministic scoring model for dashboard experimentation.

    Returns overall and component scores in range 0..100.
    """
    # Distance score: full credit at 0km, decays to 0 at 50km.
    distance_norm = max(0.0, min(1.0, 1.0 - (distance_km / 50.0)))

    # Temperature score: producer must meet consumer minimum.
    if producer_temp_c >= consumer_min_temp_c:
        temp_norm = 1.0
    else:
        gap = consumer_min_temp_c - producer_temp_c
        temp_norm = max(0.0, 1.0 - (gap / 50.0))

    # Ratio features can go above 1 in raw data; cap to 1 for normalized contribution.
    volume_norm = max(0.0, min(1.0, volume_match_ratio))
    schedule_norm = max(0.0, min(1.0, schedule_overlap_ratio))

    proximity_score = round(distance_norm * 100.0, 1)
    temperature_fit_score = round(temp_norm * 100.0, 1)
    volume_fit_score = round(volume_norm * 100.0, 1)
    schedule_fit_score = round(schedule_norm * 100.0, 1)

    # Weighted blend.
    weighted = (
        0.30 * distance_norm
        + 0.30 * temp_norm
        + 0.20 * volume_norm
        + 0.20 * schedule_norm
    )
    compatibility_score = round(max(0.0, min(100.0, weighted * 100.0)), 1)

    return {
        "compatibility_score": compatibility_score,
        "proximity_score": proximity_score,
        "temperature_fit_score": temperature_fit_score,
        "volume_fit_score": volume_fit_score,
        "schedule_fit_score": schedule_fit_score,
    }


def fetch_recommendations_for_user(_user: User) -> dict:
    # Deterministic placeholder for list endpoint when no persisted matches exist.
    return {
        "integration_state": "model_unavailable",
        "model_version": None,
        "items": [],
    }


def score_match_candidates(
    candidates: Sequence[dict],
    *,
    feedback_context: Sequence[dict] | None = None,
    requester_user_id: int | None = None,
) -> dict:
    """Calls ML scoring service and returns contract-safe output.

    Expected ML response JSON shape:
    {
      "integration_state": "ready",
      "model_version": "v1",
      "scores": [
        {
          "producer_user_id": 1,
          "consumer_user_id": 2,
          "compatibility_score": 82.5
        }
      ]
    }
    """
    settings = get_settings()
    if not settings.ml_service_url:
        return {
            "integration_state": "model_unavailable",
            "model_version": None,
            "scores": [],
        }

    payload = {
        "pairs": list(candidates),
        "feedback_events": list(feedback_context or []),
        "requesting_user_id": requester_user_id,
    }

    try:
        with httpx.Client(timeout=settings.ml_service_timeout_seconds) as client:
            response = client.post(settings.ml_service_url, json=payload)
            response.raise_for_status()
            data = response.json()

        integration_state = data.get("integration_state")
        model_version = data.get("model_version")
        scores = data.get("scores")

        if integration_state != "ready" or not isinstance(scores, list):
            return {
                "integration_state": "model_unavailable",
                "model_version": model_version,
                "scores": [],
            }

        normalized_scores: list[dict] = []
        for item in scores:
            if not isinstance(item, dict):
                continue
            try:
                normalized_scores.append(
                    {
                        "producer_user_id": int(item["producer_user_id"]),
                        "consumer_user_id": int(item["consumer_user_id"]),
                        "compatibility_score": float(item["compatibility_score"]),
                    }
                )
            except (KeyError, TypeError, ValueError):
                continue

        return {
            "integration_state": "ready",
            "model_version": model_version,
            "scores": normalized_scores,
        }
    except Exception:
        return {
            "integration_state": "model_unavailable",
            "model_version": None,
            "scores": [],
        }
