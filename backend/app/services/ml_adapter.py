from collections.abc import Sequence

import httpx

from app.core.config import get_settings
from app.models import User


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
