# Data Requirements: Industrial Heat Waste Recovery Optimizer (IHWRO)

## Introduction

This document defines every data point the IHWRO platform must collect, store, or derive to operate correctly. It covers user and identity data, facility location data, thermal and thermodynamic data, temporal and schedule data, scoring and derived data, configuration data, and reference/seed data. Each section identifies the source (user-submitted, system-derived, or seeded), the storage type, validation rules, and the requirement(s) it satisfies.

---

## 1. User and Identity Data

Collected during registration. Stored in the `users` table.

| Field | Type | Source | Validation Rules | Required | Requirement |
|---|---|---|---|---|---|
| `id` | UUID | System-generated | Auto-assigned (`gen_random_uuid()`) | Yes | 1.1 |
| `org_name` | String | User-submitted | Non-empty, max 255 chars | Yes | 1.1 |
| `email` | String | User-submitted | Valid email format, globally unique | Yes | 1.1, 1.3 |
| `password` | String (hashed) | User-submitted | ≥ 12 characters; stored as bcrypt hash (cost ≥ 12) | Yes | 1.1, 1.2 |
| `role` | Enum | User-submitted | One of: `producer`, `consumer`, `admin` | Yes | 1.1, 1.4, 1.5 |
| `email_verified` | Boolean | System-set | Defaults `false`; set `true` on token confirmation | Yes | 1.2, 1.6 |
| `email_verification_token` | String | System-generated | Cryptographically random; expires after 24 hours | No (transient) | 1.2 |
| `created_at` | Timestamp (UTC) | System-generated | Auto-set on insert | Yes | — |
| `updated_at` | Timestamp (UTC) | System-generated | Auto-updated on any row change | Yes | — |

---

## 2. Location Data

Collected as part of Heat Profile and Demand Profile submission. Stored in `heat_profiles.location` and `demand_profiles.location` as PostGIS `GEOGRAPHY(POINT, 4326)`.

| Field | Type | Source | Validation Rules | Required | Requirement |
|---|---|---|---|---|---|
| `latitude` | Float | User-submitted | Range: −90.0 to 90.0 (WGS84) | Yes | 2.4, 11.3 |
| `longitude` | Float | User-submitted | Range: −180.0 to 180.0 (WGS84) | Yes | 2.4, 11.3 |
| `street_address` | String | User-submitted | Non-empty, human-readable; used for display only | Yes | 2.1, 3.1 |
| `location` (PostGIS) | `GEOGRAPHY(POINT, 4326)` | System-derived | Constructed from latitude/longitude; GIST-indexed | Yes | 11.1, 11.2 |
| `pipe_distance_km` | Float | System-derived | Computed via `ST_DistanceSphere` / 1000; never stored on profile, stored on score record | Derived | 4.2, 7.2 |

### Storage Notes

- Coordinates are validated at the application layer **before** being passed to PostGIS.
- The `location` column uses `GEOGRAPHY` (not `GEOMETRY`) to ensure `ST_DistanceSphere` returns metres on a spherical earth model.
- A GIST spatial index is mandatory on both `heat_profiles.location` and `demand_profiles.location` for proximity query performance.

---

## 3. Thermal and Thermodynamic Data

### 3.1 Producer Heat Profile (`heat_profiles` table)

| Field | Type | Source | Validation Rules | Required | Requirement |
|---|---|---|---|---|---|
| `facility_name` | String | User-submitted | Non-empty, max 255 chars | Yes | 2.1 |
| `supply_temp_c` | Float | User-submitted | Must be strictly greater than `return_temp_c`; no absolute min/max enforced beyond this | Yes | 2.1, 2.3 |
| `return_temp_c` | Float | User-submitted | Must be strictly less than `supply_temp_c` | Yes | 2.1, 2.3 |
| `peak_output_kw` | Float | User-submitted | > 0 | Yes | 2.1 |
| `heat_transfer_medium` | Enum | User-submitted | One of: `water`, `steam`, `glycol-water mixture`, `thermal oil` | Yes | 2.1, 2.7 |
| `seasonal_multipliers` | Float[12] | User-submitted | Array of exactly 12 values; each in range [0.0, 2.0]; one per calendar month (Jan–Dec) | No (optional) | 2.5 |

**Derived value used in scoring:**

| Derived Field | Formula | Used In |
|---|---|---|
| `delta_t_c` | `supply_temp_c − consumer.min_inlet_temp_c` | Temperature sub-score computation |

### 3.2 Consumer Demand Profile (`demand_profiles` table)

| Field | Type | Source | Validation Rules | Required | Requirement |
|---|---|---|---|---|---|
| `facility_name` | String | User-submitted | Non-empty, max 255 chars | Yes | 3.1 |
| `min_inlet_temp_c` | Float | User-submitted | Must be strictly less than `max_inlet_temp_c` | Yes | 3.1, 3.3 |
| `max_inlet_temp_c` | Float | User-submitted | Must be strictly greater than `min_inlet_temp_c` | Yes | 3.1, 3.3 |
| `required_flow_rate_m3h` | Float | User-submitted | > 0; units: cubic metres per hour (m³/h) | Yes | 3.1 |
| `heat_transfer_medium_pref` | Enum | User-submitted | One of: `water`, `steam`, `glycol-water mixture`, `thermal oil`, `any` | Yes | 3.1 |
| `seasonal_multipliers` | Float[12] | User-submitted | Array of exactly 12 values; each in range [0.0, 2.0] | No (optional) | 3.4 |

### 3.3 Heat Transfer Medium Compatibility Matrix

Used by `isMediumIncompatible()` in the Scoring Engine to apply the −20 penalty.

| Producer Medium | Consumer Preference | Compatible? |
|---|---|---|
| Any | `any` | Yes |
| `water` | `water` | Yes |
| `steam` | `steam` | Yes |
| `glycol-water mixture` | `glycol-water mixture` | Yes |
| `thermal oil` | `thermal oil` | Yes |
| `water` | `steam` | Yes (standard heat exchanger feasible) |
| `steam` | `water` | Yes (standard heat exchanger feasible) |
| `water` | `glycol-water mixture` | Yes (standard heat exchanger feasible) |
| `glycol-water mixture` | `water` | Yes (standard heat exchanger feasible) |
| `thermal oil` | `water` | No (−20 penalty) |
| `thermal oil` | `steam` | No (−20 penalty) |
| `thermal oil` | `glycol-water mixture` | No (−20 penalty) |
| `steam` | `glycol-water mixture` | No (−20 penalty) |
| `glycol-water mixture` | `steam` | No (−20 penalty) |

---

## 4. Temporal and Schedule Data

### 4.1 Weekly Operating Schedule

Stored as `BOOLEAN[168]` on both `heat_profiles` and `demand_profiles`.

| Field | Type | Source | Validation Rules | Required | Requirement |
|---|---|---|---|---|---|
| `weekly_schedule` | Boolean[168] | User-submitted via `ScheduleGrid` | Exactly 168 elements; each `true` (active) or `false` (inactive) | Yes | 2.1, 3.1, 6.1 |

**Slot indexing convention:**

```
Index = (day_index × 24) + hour_index
  day_index:  0 = Monday, 1 = Tuesday, ..., 6 = Sunday
  hour_index: 0 = 00:00–01:00, 1 = 01:00–02:00, ..., 23 = 23:00–00:00
```

Examples:
- Monday 09:00–10:00 → index `(0 × 24) + 9 = 9`
- Friday 14:00–15:00 → index `(4 × 24) + 14 = 110`
- Sunday 23:00–00:00 → index `(6 × 24) + 23 = 167`

### 4.2 Seasonal Multipliers

Stored as `FLOAT[12]` on both profile tables. Index 0 = January, index 11 = December.

| Index | Month | Data Center Baseline | Greenhouse Baseline |
|---|---|---|---|
| 0 | January | 0.85 | 1.60 |
| 1 | February | 0.85 | 1.50 |
| 2 | March | 0.90 | 1.30 |
| 3 | April | 0.95 | 1.00 |
| 4 | May | 1.00 | 0.70 |
| 5 | June | 1.05 | 0.40 |
| 6 | July | 1.15 | 0.40 |
| 7 | August | 1.15 | 0.50 |
| 8 | September | 1.10 | 0.80 |
| 9 | October | 1.05 | 1.10 |
| 10 | November | 0.95 | 1.40 |
| 11 | December | 0.90 | 1.55 |

**Interpretation:** A multiplier of `1.15` means the facility operates at 115% of its baseline thermal output/demand for that month. The Scoring Engine reads `currentMonth()` (0-indexed) and applies the corresponding multiplier when computing effective active hours for schedule overlap.

---

## 5. Scoring and Derived Data

Stored in the `compatibility_scores` table. All fields are system-derived — never user-submitted.

| Field | Type | Formula / Source | Requirement |
|---|---|---|---|
| `heat_profile_id` | UUID (FK) | References `heat_profiles.id` | 7.5 |
| `demand_profile_id` | UUID (FK) | References `demand_profiles.id` | 7.5 |
| `pipe_distance_km` | Float | `ST_DistanceSphere(hp.location, dp.location) / 1000.0` | 4.2, 7.2 |
| `delta_t_c` | Float | `hp.supply_temp_c − dp.min_inlet_temp_c` | 5.1 |
| `schedule_overlap_pct` | Float | `(both_active_slots / consumer_active_slots) × 100` with seasonal scaling | 6.2 |
| `distance_sub_score` | Float [0–100] | `100 × (1 − pipe_distance_km / max_distance_km)`, rounded to 2 dp; 0 if distance exceeds threshold | 7.2 |
| `temperature_sub_score` | Float [0–100] | Linear interpolation on ΔT; 0 if ΔT < 10°C; −20 penalty for medium incompatibility | 5.2, 5.3, 5.4, 5.5 |
| `schedule_sub_score` | Float [0–100] | `((overlap_pct − 30) / 70) × 100`; 0 if overlap < 30% | 6.3, 6.4 |
| `overall_score` | Float [0–100] | `(0.35 × dist) + (0.40 × temp) + (0.25 × sched)`; 0 if any sub-score is 0 | 7.1, 7.3 |
| `computed_at` | Timestamp (UTC) | System-set at time of computation | 7.5 |

### Hard Exclusion Rules (score forced to 0)

| Condition | Sub-score zeroed | Overall score |
|---|---|---|
| `pipe_distance_km > max_distance_km` | `distance_sub_score = 0` | 0 (pair excluded) |
| `delta_t_c < 10°C` | `temperature_sub_score = 0` | 0 (pair excluded) |
| `schedule_overlap_pct < 30%` | `schedule_sub_score = 0` | 0 (pair excluded) |

Pairs with `overall_score = 0` are persisted but **excluded from match results** returned to users.

---

## 6. Scoring Configuration Data

Stored in the `scoring_config` table. Managed by admin users only.

| Field | Type | Default | Validation Rules | Requirement |
|---|---|---|---|---|
| `weight_distance` | Float | 0.35 | Must satisfy: `|weight_distance + weight_temperature + weight_schedule − 1.0| < 0.0001` | 7.1, 7.4 |
| `weight_temperature` | Float | 0.40 | Same sum constraint | 7.1, 7.4 |
| `weight_schedule` | Float | 0.25 | Same sum constraint | 7.1, 7.4 |
| `max_distance_km` | Integer | 25 | Range: 1–100 (whole kilometres) | 4.1, 4.3 |
| `updated_by` | UUID (FK) | — | References `users.id`; must have `role = admin` | 7.4 |
| `updated_at` | Timestamp (UTC) | — | Auto-set on update | — |

A `RECOMPUTE_ALL` job is enqueued whenever any field in this table is updated, ensuring all `compatibility_scores` rows are refreshed within 60 seconds.

---

## 7. Baseline Reference / Seed Data

Two canonical facility archetypes are seeded into the database and exposed via `GET /api/v1/reference/baseline/:role`. They serve as pre-fill templates for new users and as integration test fixtures.

### 7.1 Data Center — Producer Baseline

| Field | Value |
|---|---|
| `facility_name` | `"Example Data Center (Baseline)"` |
| `street_address` | `"1 Data Center Way, Example City"` |
| `latitude` | `51.5074` (London, UK — placeholder) |
| `longitude` | `−0.1278` |
| `supply_temp_c` | `45` |
| `return_temp_c` | `35` |
| `peak_output_kw` | `2500` |
| `heat_transfer_medium` | `water` |
| `weekly_schedule` | All 168 slots `true` (24 hours/day, 7 days/week) |
| `seasonal_multipliers` | `[0.85, 0.85, 0.90, 0.95, 1.00, 1.05, 1.15, 1.15, 1.10, 1.05, 0.95, 0.90]` |

**Rationale:** Data centers run continuously. Cooling load (and thus waste heat output) peaks in summer (higher ambient temperatures increase cooling demand) and dips slightly in winter.

### 7.2 Greenhouse — Consumer Baseline

| Field | Value |
|---|---|
| `facility_name` | `"Example Greenhouse (Baseline)"` |
| `street_address` | `"2 Greenhouse Lane, Example City"` |
| `latitude` | `51.5200` (≈5 km from producer baseline) |
| `longitude` | `−0.1000` |
| `min_inlet_temp_c` | `35` |
| `max_inlet_temp_c` | `60` |
| `required_flow_rate_m3h` | `120` |
| `heat_transfer_medium_pref` | `water` |
| `weekly_schedule` | Slots 6–21 active each day (06:00–22:00, Mon–Sun) = 112 of 168 slots `true` |
| `seasonal_multipliers` | `[1.60, 1.50, 1.30, 1.00, 0.70, 0.40, 0.40, 0.50, 0.80, 1.10, 1.40, 1.55]` |

**Rationale:** Greenhouses need heating primarily in winter and shoulder seasons. Summer demand drops sharply. Operating hours are daytime-only (plants don't need heating overnight in most climates).

### 7.3 Expected Score for Baseline Pair at 5 km Distance

This is the canonical integration test fixture (Requirement 37.3 in tasks.md):

| Metric | Value | Calculation |
|---|---|---|
| `pipe_distance_km` | 5.0 km | `ST_DistanceSphere` result |
| `distance_sub_score` | 80.00 | `100 × (1 − 5/25) = 80.00` |
| `delta_t_c` | 10°C | `45 − 35 = 10` |
| `temperature_sub_score` | 50.00 | `50 + ((10 − 10) / 20) × 50 = 50.00` |
| `schedule_overlap_pct` | 66.67% | `112 overlap / 112 consumer active × 100` (data center is 24/7, so all 112 consumer slots overlap) |
| `schedule_sub_score` | 52.38 | `((66.67 − 30) / 70) × 100 = 52.38` |
| `overall_score` | **54.10** | `(0.35 × 80) + (0.40 × 50) + (0.25 × 52.38) = 28 + 20 + 13.10 = 61.10` |

> Note: The exact overall score will vary slightly based on the precise geodesic distance between the two seed coordinate pairs. The values above assume exactly 5.0 km. Use these as the expected values in integration tests by placing the seed facilities at a known 5 km separation.

---

## 8. API Data Shapes

### 8.1 Heat Profile Request Body (`POST /api/v1/profiles/heat`)

```json
{
  "facility_name": "Northgate Data Center",
  "street_address": "10 Server Farm Road, Manchester, UK",
  "latitude": 53.4808,
  "longitude": -2.2426,
  "supply_temp_c": 48.5,
  "return_temp_c": 36.0,
  "peak_output_kw": 3200,
  "heat_transfer_medium": "water",
  "weekly_schedule": [true, true, true, ...],
  "seasonal_multipliers": [0.85, 0.85, 0.90, 0.95, 1.00, 1.05, 1.15, 1.15, 1.10, 1.05, 0.95, 0.90]
}
```

### 8.2 Demand Profile Request Body (`POST /api/v1/profiles/demand`)

```json
{
  "facility_name": "Salford Urban Greenhouse",
  "street_address": "5 Growing Lane, Salford, UK",
  "latitude": 53.4900,
  "longitude": -2.2700,
  "min_inlet_temp_c": 38.0,
  "max_inlet_temp_c": 65.0,
  "required_flow_rate_m3h": 95.0,
  "heat_transfer_medium_pref": "water",
  "weekly_schedule": [false, false, false, false, false, false, true, true, ...],
  "seasonal_multipliers": [1.60, 1.50, 1.30, 1.00, 0.70, 0.40, 0.40, 0.50, 0.80, 1.10, 1.40, 1.55]
}
```

### 8.3 Match List Response (`GET /api/v1/matches`)

```json
{
  "data": [
    {
      "match_id": "a1b2c3d4-...",
      "counterpart_facility_name": "Salford Urban Greenhouse",
      "overall_score": 72.45,
      "pipe_distance_km": 3.2,
      "delta_t_c": 13.5,
      "schedule_overlap_pct": 78.6,
      "seasonal_adjustment_active": true,
      "current_month_multiplier_producer": 1.05,
      "current_month_multiplier_consumer": 0.70
    }
  ],
  "pagination": {
    "total": 8,
    "page": 1,
    "pageSize": 20,
    "nextCursor": null
  }
}
```

### 8.4 Match Detail Response (`GET /api/v1/matches/:matchId`)

```json
{
  "match_id": "a1b2c3d4-...",
  "heat_profile": {
    "id": "...",
    "facility_name": "Northgate Data Center",
    "latitude": 53.4808,
    "longitude": -2.2426
  },
  "demand_profile": {
    "id": "...",
    "facility_name": "Salford Urban Greenhouse",
    "latitude": 53.4900,
    "longitude": -2.2700
  },
  "overall_score": 72.45,
  "distance_sub_score": 87.20,
  "temperature_sub_score": 67.50,
  "schedule_sub_score": 55.14,
  "pipe_distance_km": 3.2,
  "delta_t_c": 13.5,
  "schedule_overlap_pct": 78.6,
  "computed_at": "2026-04-19T10:32:00Z"
}
```

### 8.5 Standard Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Supply temperature must exceed return temperature.",
    "field": "supply_temp_c"
  }
}
```

---

## 9. Data Validation Summary

| Rule | Applies To | Error Code |
|---|---|---|
| `supply_temp_c > return_temp_c` | Heat Profile | `INVALID_TEMP_ORDER` |
| `min_inlet_temp_c < max_inlet_temp_c` | Demand Profile | `INVALID_INLET_TEMP_ORDER` |
| Latitude in [−90, 90] | Both profiles | `INVALID_COORDINATE` |
| Longitude in [−180, 180] | Both profiles | `INVALID_COORDINATE` |
| `heat_transfer_medium` in allowed enum | Heat Profile | `INVALID_MEDIUM` |
| `heat_transfer_medium_pref` in allowed enum | Demand Profile | `INVALID_MEDIUM_PREF` |
| `seasonal_multipliers` length = 12 | Both profiles (if provided) | `INVALID_SEASONAL_MULTIPLIERS` |
| Each seasonal multiplier in [0.0, 2.0] | Both profiles (if provided) | `INVALID_SEASONAL_MULTIPLIER_VALUE` |
| `weekly_schedule` length = 168 | Both profiles | `INVALID_SCHEDULE_LENGTH` |
| Password ≥ 12 characters | Registration | `WEAK_PASSWORD` |
| Email format valid | Registration | `INVALID_EMAIL` |
| Email unique | Registration | `EMAIL_ALREADY_EXISTS` |
| Role in {producer, consumer} | Registration | `INVALID_ROLE` |
| `weight_distance + weight_temperature + weight_schedule = 1.0 ± 0.0001` | Admin config | `INVALID_WEIGHTS_SUM` |
| `max_distance_km` in [1, 100] | Admin config | `INVALID_DISTANCE_THRESHOLD` |

---

## 10. Data Lifecycle and Recompute Triggers

| Event | Trigger | Action | SLA |
|---|---|---|---|
| `POST /profiles/heat` | New heat profile created | Enqueue `RECOMPUTE_FOR_HEAT_PROFILE` | Scores available within 5 seconds |
| `PUT /profiles/heat/:id` | Heat profile updated | Enqueue `RECOMPUTE_FOR_HEAT_PROFILE` | All affected scores recomputed within 60 seconds |
| `DELETE /profiles/heat/:id` | Heat profile deleted | Cascade-delete all associated `compatibility_scores` rows | Immediate (FK cascade) |
| `POST /profiles/demand` | New demand profile created | Enqueue `RECOMPUTE_FOR_DEMAND_PROFILE` | Scores available within 5 seconds |
| `PUT /profiles/demand/:id` | Demand profile updated | Enqueue `RECOMPUTE_FOR_DEMAND_PROFILE` | All affected scores recomputed within 60 seconds |
| `DELETE /profiles/demand/:id` | Demand profile deleted | Cascade-delete all associated `compatibility_scores` rows | Immediate (FK cascade) |
| `PUT /admin/config` | Scoring weights or distance threshold changed | Enqueue `RECOMPUTE_ALL` | All scores recomputed within 60 seconds |
