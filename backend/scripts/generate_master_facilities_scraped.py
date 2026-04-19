from __future__ import annotations

import random
import time
import uuid
from pathlib import Path

import pandas as pd
import requests


OVERPASS_URL = "http://overpass-api.de/api/interpreter"

BOUNDING_BOXES = {
    "Haryana & Delhi NCR": "27.6000,75.0000,30.2000,77.6000",
    "Ludhiana, Punjab": "30.8000,75.7500,31.0000,76.0000",
    "Baddi, Himachal Pradesh": "30.9000,76.7000,31.0500,76.9000",
}


def build_query(bbox: str) -> str:
    return f"""
[out:json][timeout:60];
(
  way["landuse"="industrial"]({bbox});
  node["industrial"]({bbox});
  way["building"="greenhouse"]({bbox});
  way["landuse"="farmland"]({bbox});
);
out center;
""".strip()


def get_role(tags: dict) -> str:
    if tags.get("building") == "greenhouse" or tags.get("landuse") == "farmland":
        return "CONSUMER"
    return "PRODUCER"


def build_row(element: dict, region_name: str) -> dict | None:
    lat = element.get("center", {}).get("lat") or element.get("lat")
    lon = element.get("center", {}).get("lon") or element.get("lon")
    if lat is None or lon is None:
        return None

    tags = element.get("tags", {})
    role = get_role(tags)

    if role == "PRODUCER":
        operating_temp_c = round(random.uniform(80, 400), 1)
        flow_capacity_kw = round(random.uniform(1000, 20000), 1)
    else:
        operating_temp_c = round(random.uniform(25, 90), 1)
        flow_capacity_kw = round(random.uniform(500, 4000), 1)

    return {
        "facility_id": str(uuid.uuid4()),
        "role": role,
        "latitude": round(float(lat), 6),
        "longitude": round(float(lon), 6),
        "city_zone": region_name,
        "industry_type": tags.get("industrial") or tags.get("landuse") or tags.get("building") or "unknown",
        "operating_temp_c": operating_temp_c,
        "flow_capacity_kw": flow_capacity_kw,
        "schedule_start_utc": "06:00:00",
        "schedule_end_utc": "18:00:00",
        "operational_days": "Mon-Fri",
        "current_status": "ACTIVE",
    }


def fetch_elements_for_bbox(region_name: str, bbox: str) -> list[dict]:
    query = build_query(bbox)
    print(f"Scraping {region_name}...")
    last_error: Exception | None = None
    for attempt in range(1, 5):
        try:
            response = requests.post(OVERPASS_URL, data={"data": query}, timeout=120)
            response.raise_for_status()
            payload = response.json()
            elements = payload.get("elements", [])
            print(f"Found {len(elements)} locations in {region_name}.")
            return elements
        except requests.RequestException as exc:
            last_error = exc
            wait_seconds = 2 * attempt
            print(f"Attempt {attempt} failed for {region_name}: {exc}. Retrying in {wait_seconds}s...")
            time.sleep(wait_seconds)

    raise requests.RequestException(f"Failed after retries for {region_name}") from last_error


def main() -> None:
    print("Starting multi-region Overpass scrape...")
    all_rows: list[dict] = []

    for idx, (region_name, bbox) in enumerate(BOUNDING_BOXES.items()):
        try:
            elements = fetch_elements_for_bbox(region_name, bbox)
            for element in elements:
                row = build_row(element, region_name)
                if row is not None:
                    all_rows.append(row)
        except requests.RequestException as exc:
            print(f"API request failed for {region_name}: {exc}")

        if idx < len(BOUNDING_BOXES) - 1:
            time.sleep(2)

    df = pd.DataFrame(all_rows)

    output_path = Path("backend") / "data" / "real" / "master_facilities_scraped.csv"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)

    print(f"Saved merged dataset to {output_path}")
    print(f"Total facilities exported: {len(df)}")


if __name__ == "__main__":
    main()
