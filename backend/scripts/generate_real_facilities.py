from __future__ import annotations

import argparse
import random
import uuid
from pathlib import Path

import pandas as pd
import requests


DEFAULT_BBOX = "30.1000,76.1000,31.0000,77.0000"
OVERPASS_URL = "https://overpass-api.de/api/interpreter"


def build_query(bbox: str) -> str:
    return f"""
[out:json][timeout:40];
(
  way["landuse"="industrial"]({bbox});
  node["industrial"]({bbox});
  way["building"="greenhouse"]({bbox});
  way["landuse"="farmland"]({bbox});
);
out center;
""".strip()


def fetch_overpass_elements(query: str, overpass_url: str) -> list[dict]:
    response = requests.post(overpass_url, data={"data": query}, timeout=90)
    response.raise_for_status()
    payload = response.json()
    return payload.get("elements", [])


def classify_facility(tags: dict) -> tuple[str, tuple[str, int, int, int, int]]:
    producer_profiles = [
        ("Heavy Manufacturing", 150, 400, 5000, 20000),
        ("Chemical Plant", 80, 150, 2000, 10000),
        ("Textile Mill", 90, 140, 1000, 5000),
    ]
    consumer_profiles = [
        ("Commercial Greenhouse", 25, 40, 500, 2000),
        ("Agricultural Drying", 60, 90, 1000, 4000),
    ]

    if tags.get("building") == "greenhouse" or tags.get("landuse") == "farmland":
        return "CONSUMER", random.choice(consumer_profiles)
    return "PRODUCER", random.choice(producer_profiles)


def to_dataframe(elements: list[dict]) -> pd.DataFrame:
    facilities = []

    for el in elements:
        lat = el.get("center", {}).get("lat") or el.get("lat")
        lon = el.get("center", {}).get("lon") or el.get("lon")

        if lat is None or lon is None:
            continue

        tags = el.get("tags", {})
        role, profile = classify_facility(tags)
        industry, min_t, max_t, min_kw, max_kw = profile

        facilities.append(
            {
                "facility_id": str(uuid.uuid4()),
                "role": role,
                "latitude": round(float(lat), 6),
                "longitude": round(float(lon), 6),
                "city_zone": "Punjab Region",
                "industry_type": industry,
                "operating_temp_c": round(random.uniform(min_t, max_t), 1),
                "flow_capacity_kw": round(random.uniform(min_kw, max_kw), 1),
                "schedule_start_utc": "06:00:00",
                "schedule_end_utc": "18:00:00",
                "operational_days": "Mon-Fri",
                "current_status": "ACTIVE",
            }
        )

    return pd.DataFrame(facilities)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate real-location facilities from OpenStreetMap Overpass API.")
    parser.add_argument("--bbox", default=DEFAULT_BBOX, help="Bounding box in 'south,west,north,east' format.")
    parser.add_argument("--out-file", type=Path, default=Path("backend") / "data" / "real" / "real_facilities_scraped.csv")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--overpass-url", default=OVERPASS_URL)
    args = parser.parse_args()

    random.seed(args.seed)

    print("Reaching out to OpenStreetMap Overpass API...")
    query = build_query(args.bbox)

    try:
        elements = fetch_overpass_elements(query, args.overpass_url)
    except requests.RequestException as exc:
        print(f"API request failed: {exc}")
        raise SystemExit(1)

    print(f"Found {len(elements)} real locations. Building facility dataset...")
    df = to_dataframe(elements)

    args.out_file.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(args.out_file, index=False)

    print(f"Success: saved {len(df)} facilities to {args.out_file}")
    print("Ready to import into PostgreSQL.")


if __name__ == "__main__":
    main()