from __future__ import annotations

import csv
from functools import lru_cache
from pathlib import Path

from app.models import UserRole
from app.services.geo_utils import haversine_km

DATASET_PATH = Path(__file__).resolve().parents[2] / "data" / "real" / "master_facilities_scraped.csv"


def _tokenize_schedule(value: str) -> set[str]:
    raw = (value or "").strip().lower()
    if not raw:
        return set()
    return {token for token in raw.replace("-", " ").replace(",", " ").split() if token}


def estimate_schedule_overlap_ratio(lhs: str, rhs: str) -> float:
    left = _tokenize_schedule(lhs)
    right = _tokenize_schedule(rhs)
    if not left or not right:
        return 0.5
    overlap = len(left.intersection(right))
    union = len(left.union(right))
    if union == 0:
        return 0.5
    return max(0.0, min(1.0, overlap / union))


@lru_cache(maxsize=1)
def load_real_facilities() -> list[dict]:
    if not DATASET_PATH.exists():
        return []

    rows: list[dict] = []
    with DATASET_PATH.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            try:
                rows.append(
                    {
                        "facility_id": str(row.get("facility_id") or ""),
                        "role": str(row.get("role") or "").upper(),
                        "latitude": float(row.get("latitude") or 0),
                        "longitude": float(row.get("longitude") or 0),
                        "city_zone": str(row.get("city_zone") or "Unknown"),
                        "industry_type": str(row.get("industry_type") or "facility"),
                        "operating_temp_c": float(row.get("operating_temp_c") or 0),
                        "flow_capacity_kw": float(row.get("flow_capacity_kw") or 0),
                        "operational_days": str(row.get("operational_days") or ""),
                    }
                )
            except (TypeError, ValueError):
                continue
    return rows


def select_nearest_counterpart(*, user_role: UserRole, latitude: float, longitude: float) -> dict | None:
    facilities = load_real_facilities()
    if not facilities:
        return None

    target_role = "CONSUMER" if user_role == UserRole.producer else "PRODUCER"
    candidates = [item for item in facilities if item.get("role") == target_role]
    if not candidates:
        return None

    nearest: dict | None = None
    nearest_distance: float | None = None

    for candidate in candidates:
        distance = haversine_km(latitude, longitude, candidate["latitude"], candidate["longitude"])
        if nearest is None or nearest_distance is None or distance < nearest_distance:
            nearest = candidate
            nearest_distance = distance

    if nearest is None or nearest_distance is None:
        return None

    return {**nearest, "distance_km": nearest_distance}


def build_scoring_payload_from_context(
    *,
    user_role: UserRole,
    user_profile: dict,
    counterpart: dict,
) -> dict:
    if user_role == UserRole.producer:
        producer_temp_c = float(user_profile.get("supply_temperature_c") or 0)
        consumer_min_temp_c = float(counterpart.get("operating_temp_c") or 0)
        producer_volume = float(user_profile.get("heat_output_kw") or 0)
        consumer_volume = float(counterpart.get("flow_capacity_kw") or 0)
        producer_schedule = str(user_profile.get("schedule_description") or "")
        consumer_schedule = str(counterpart.get("operational_days") or "")
    else:
        producer_temp_c = float(counterpart.get("operating_temp_c") or 0)
        consumer_min_temp_c = float(user_profile.get("demand_temperature_c") or 0)
        producer_volume = float(counterpart.get("flow_capacity_kw") or 0)
        consumer_volume = float(user_profile.get("flow_rate_lph") or 0)
        producer_schedule = str(counterpart.get("operational_days") or "")
        consumer_schedule = str(user_profile.get("schedule_description") or "")

    min_volume = min(producer_volume, consumer_volume)
    max_volume = max(producer_volume, consumer_volume)
    volume_match_ratio = (min_volume / max_volume) if max_volume > 0 else 0.0

    schedule_overlap_ratio = estimate_schedule_overlap_ratio(producer_schedule, consumer_schedule)

    return {
        "distance_km": float(counterpart.get("distance_km") or 0),
        "producer_temp_c": producer_temp_c,
        "consumer_min_temp_c": consumer_min_temp_c,
        "volume_match_ratio": max(0.0, min(1.0, volume_match_ratio)),
        "schedule_overlap_ratio": max(0.0, min(1.0, schedule_overlap_ratio)),
    }
