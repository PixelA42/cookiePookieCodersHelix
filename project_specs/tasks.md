# Implementation Plan: Industrial Heat Waste Recovery Optimizer (IHWRO)

## Overview

Implementation is organized into five sequential milestones that mirror the phased engineering plan in Requirement 12. Milestones 3 and 4 contain parallel frontend and backend tracks — the frontend track uses mock data so both teams can progress simultaneously. Each task references the specific requirements it satisfies.

---

## Milestone 1 — API Contract, Scaffolding, and Shared Types

- [ ] 1. Author the OpenAPI 3.1 specification
  - Create `openapi.yaml` at the repository root describing all `/api/v1/` endpoints
  - Define request/response schemas for: auth (register, login, verify-email, refresh), heat profiles CRUD, demand profiles CRUD, matches list + detail, admin config GET/PUT, reference baseline GET
  - Define the standard error shape `{ error: { code, message, field } }` as a reusable component
  - Define the paginated list shape `{ data, pagination: { total, page, pageSize, nextCursor } }` as a reusable component
  - Include all HTTP status codes and error codes for each endpoint
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 2. Scaffold the backend service
  - [ ] 2.1 Initialize the Python/FastAPI backend project
    - Create `backend/` directory with `requirements.txt` (pinned), `pyproject.toml`, and `.flake8` / `ruff` config
    - Install FastAPI, Uvicorn, `asyncpg`, `psycopg2-binary`, `python-jose[cryptography]`, `passlib[bcrypt]`, `arq`, `pydantic[email]`, `pydantic-settings`, and dev dependencies (`pytest`, `pytest-asyncio`, `httpx`, `hypothesis`)
    - Set up folder structure: `app/routers/`, `app/services/`, `app/repositories/`, `app/models/`, `app/db/`, `app/queue/`, `app/middleware/`
    - Add `.env.example` with all required environment variables (DATABASE_URL, REDIS_URL, JWT_SECRET, SMTP_*, PORT)
    - _Requirements: 10.1, 12.1_

  - [ ] 2.2 Implement FastAPI app entry point and middleware stack
    - Create `backend/main.py` — instantiate FastAPI app, register all routers under `/api/v1/`, add CORS middleware, request logging middleware, and global exception handler
    - Return `{ "error": { "code": ..., "message": ..., "field": ... } }` shape from the global exception handler using a custom `HTTPException` handler
    - _Requirements: 10.3, 12.1_

- [ ] 3. Scaffold the Next.js frontend shell
  - [ ] 3.1 Configure the existing Next.js 16 App Router project
    - Install `openapi-fetch` or `openapi-typescript-codegen` as a dev dependency for generating a typed API client from the OpenAPI spec
    - Create `src/lib/api.js` — a fetch client wrapping the generated types
    - Create `src/types/` directory for shared domain types
    - Add Tailwind CSS 4 configuration and global styles baseline
    - _Requirements: 10.1, 12.1_

  - [ ] 3.2 Create the authenticated layout shell
    - Implement `src/app/(dashboard)/layout.js` with navigation sidebar/header and auth guard
    - Implement `src/app/(auth)/layout.js` as a minimal centered card layout
    - Add route constants file `src/lib/routes.js`
    - _Requirements: 1.6, 12.1_

- [ ] 4. Generate and publish shared JS types from the OpenAPI spec
  - Run the chosen codegen tool against `openapi.yaml` to produce `src/types/api.generated.js` (or JSDoc-annotated JS)
  - Export domain-level type aliases from `src/types/index.js` (HeatProfile, DemandProfile, CompatibilityScore, etc.)
  - Verify the generated client works correctly against the mock server
  - _Requirements: 10.2, 10.5, 12.1_

- [ ] 5. Checkpoint — Milestone 1 complete
  - Confirm `openapi.yaml` is committed and passes `swagger-cli validate`
  - Confirm backend starts with `uvicorn main:app --reload` without errors
  - Confirm frontend starts with `next dev` without errors
  - Ensure all tests pass, ask the user if questions arise.

---

## Milestone 2 — Database Schema, Data Models, and Seed Data

- [ ] 6. Enable PostGIS and create the database schema
  - [ ] 6.1 Write the initial database migration
    - Create `backend/app/db/migrations/001_initial_schema.sql`
    - Include `CREATE EXTENSION IF NOT EXISTS postgis`
    - Create all five tables: `users`, `heat_profiles`, `demand_profiles`, `compatibility_scores`, `scoring_config` with all columns, constraints, and CHECK constraints exactly as specified in the DDL
    - Create GIST spatial indexes on `heat_profiles.location` and `demand_profiles.location`
    - Create B-tree indexes on `compatibility_scores(heat_profile_id)`, `(demand_profile_id)`, and `(overall_score DESC)`
    - _Requirements: 11.1, 11.2, 7.5_

  - [ ] 6.2 Implement the database migration runner
    - Create `backend/app/db/migrate.py` that applies pending `.sql` migration files in order using `asyncpg`
    - Add `python -m app.db.migrate` as the migration command; document in README
    - _Requirements: 11.1, 12.2_

- [ ] 7. Implement data access layer (repositories)
  - [ ] 7.1 Implement `UserRepository` (`backend/app/repositories/user_repository.py`)
    - Write `find_by_email`, `create`, `find_by_id`, `update_email_verified` methods using `asyncpg` parameterized queries
    - _Requirements: 1.1, 1.3_

  - [ ] 7.2 Implement `HeatProfileRepository` (`backend/app/repositories/heat_profile_repository.py`)
    - Write `create`, `find_by_id`, `find_by_user_id`, `update`, `delete` methods
    - Use `ST_GeomFromText` / `ST_AsGeoJSON` for location serialization/deserialization
    - Validate WGS84 coordinate range before insert/update
    - _Requirements: 2.1, 2.2, 11.3_

  - [ ] 7.3 Implement `DemandProfileRepository` (`backend/app/repositories/demand_profile_repository.py`)
    - Write `create`, `find_by_id`, `find_by_user_id`, `update`, `delete` methods
    - Use `ST_GeomFromText` / `ST_AsGeoJSON` for location serialization/deserialization
    - Validate WGS84 coordinate range before insert/update
    - _Requirements: 3.1, 3.2, 11.3_

  - [ ] 7.4 Implement `CompatibilityScoreRepository` (`backend/app/repositories/compatibility_score_repository.py`)
    - Write `upsert`, `find_by_heat_profile_id`, `find_by_demand_profile_id`, `find_matches_for_user` (paginated, filterable by min score) methods
    - `find_matches_for_user` must join profiles and return all fields required by Requirement 8.3
    - _Requirements: 7.5, 8.1, 8.2, 8.3_

  - [ ] 7.5 Implement `ScoringConfigRepository` (`backend/app/repositories/scoring_config_repository.py`)
    - Write `get_current` and `update` methods
    - Enforce the weights-sum-to-1.0 constraint at the application layer before persisting
    - _Requirements: 7.4, 4.3_

- [ ] 8. Insert baseline seed data
  - Create `backend/app/db/seeds/001_baseline_archetypes.sql`
  - Insert the Data Center Producer baseline: supply 45°C, return 35°C, 2500 kW, water, 24/7 schedule (all 168 slots true), seasonal multipliers [0.85, 0.85, 0.90, 0.95, 1.00, 1.05, 1.15, 1.15, 1.10, 1.05, 0.95, 0.90]
  - Insert the Greenhouse Consumer baseline: min inlet 35°C, max 60°C, 120 m³/h, water, 06:00–22:00 Mon–Sun (slots 6–21 each day = 112 slots true), seasonal multipliers [1.60, 1.50, 1.30, 1.00, 0.70, 0.40, 0.40, 0.50, 0.80, 1.10, 1.40, 1.55]
  - Add `python -m app.db.seed` command; document in README
  - _Requirements: 9.1, 9.2, 9.3_

- [ ]* 8.1 Write unit tests for repository methods
  - Test `HeatProfileRepository` and `DemandProfileRepository` coordinate validation rejects out-of-range values
  - Test `ScoringConfigRepository.update` rejects weights that do not sum to 1.0
  - Test `CompatibilityScoreRepository.find_matches_for_user` pagination returns correct `total` and `nextCursor`
  - _Requirements: 2.4, 3.1, 7.4, 11.3_

- [ ] 9. Checkpoint — Milestone 2 complete
  - Run `python -m app.db.migrate && python -m app.db.seed` against a local PostgreSQL + PostGIS instance
  - Confirm all tables exist with correct columns and constraints
  - Ensure all tests pass, ask the user if questions arise.

---

## Milestone 3 — Profile Ingestion: Backend Endpoints + Frontend Forms (Parallel)

> The backend and frontend tracks in this milestone can be developed simultaneously. The frontend uses mock API responses until Milestone 5 integration.

### Milestone 3A — Backend: Authentication and Profile Endpoints

- [ ] 10. Implement authentication endpoints
  - [ ] 10.1 Implement `POST /api/v1/auth/register`
    - Validate: org_name required, email format, password ≥ 12 characters, role in {producer, consumer}
    - Hash password with bcrypt (cost factor ≥ 12)
    - Reject duplicate email with descriptive error (no account created)
    - Create user record, generate email verification token, enqueue verification email
    - Return 201 with user id and `emailVerificationSent: true`
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 10.2 Implement `POST /api/v1/auth/verify-email`
    - Validate token, mark `email_verified = true`, return 200
    - Return 400 for expired or invalid tokens
    - _Requirements: 1.6_

  - [ ] 10.3 Implement `POST /api/v1/auth/login`
    - Validate credentials, check `email_verified`, issue JWT access token (15 min) and refresh token (7 days)
    - Return 401 with appropriate error code for invalid credentials or unverified email
    - _Requirements: 1.4, 1.5, 1.6_

  - [ ] 10.4 Implement `POST /api/v1/auth/refresh`
    - Validate refresh token, issue new access token
    - _Requirements: 1.6_

  - [ ] 10.5 Implement JWT authentication dependency
    - Create `backend/app/middleware/auth.py` — FastAPI `Depends` function that verifies Bearer token on all protected routes
    - Attach `current_user` (id, role, email_verified) to request via dependency injection
    - Raise `HTTP 401` if token missing/invalid, `HTTP 403` if email not verified
    - _Requirements: 1.6_

- [ ] 11. Implement Heat Profile CRUD endpoints
  - [ ] 11.1 Implement `POST /api/v1/profiles/heat`
    - Validate all required fields; reject if supply_temp_c ≤ return_temp_c (Req 2.3); reject invalid WGS84 coordinates (Req 2.4)
    - Validate heat_transfer_medium is one of: water, steam, glycol-water mixture, thermal oil (Req 2.7)
    - Validate seasonal_multipliers array length = 12 and each value in [0.0, 2.0] if provided (Req 2.5)
    - Persist via `HeatProfileRepository.create`, enqueue scoring recompute job
    - Return 201 with created profile; profile available to Scoring Engine within 5 seconds
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7_

  - [ ] 11.2 Implement `GET /api/v1/profiles/heat/:id`
    - Return 404 if not found or not owned by requesting user
    - _Requirements: 2.1_

  - [ ] 11.3 Implement `PUT /api/v1/profiles/heat/:id`
    - Apply same validation as POST
    - Persist update, enqueue recompute job for all affected scores
    - Return 200 with updated profile
    - _Requirements: 2.6, 4.4_

  - [ ] 11.4 Implement `DELETE /api/v1/profiles/heat/:id`
    - Delete profile and cascade-delete associated `compatibility_scores` rows (handled by FK ON DELETE CASCADE)
    - Return 204
    - _Requirements: 2.1_

- [ ] 12. Implement Demand Profile CRUD endpoints
  - [ ] 12.1 Implement `POST /api/v1/profiles/demand`
    - Validate all required fields; reject if min_inlet_temp_c ≥ max_inlet_temp_c (Req 3.3); reject invalid WGS84 coordinates
    - Validate seasonal_multipliers if provided (Req 3.4)
    - Persist via `DemandProfileRepository.create`, enqueue scoring recompute job
    - Return 201 with created profile
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ] 12.2 Implement `GET /api/v1/profiles/demand/:id`
    - Return 404 if not found or not owned by requesting user
    - _Requirements: 3.1_

  - [ ] 12.3 Implement `PUT /api/v1/profiles/demand/:id`
    - Apply same validation as POST
    - Persist update, enqueue recompute job
    - Return 200 with updated profile
    - _Requirements: 3.5, 4.4_

  - [ ] 12.4 Implement `DELETE /api/v1/profiles/demand/:id`
    - Delete profile and cascade-delete associated scores
    - Return 204
    - _Requirements: 3.1_

- [ ] 13. Implement reference baseline endpoint
  - Implement `GET /api/v1/reference/baseline/:role`
  - Return the seeded Data Center profile template for `role=producer` and Greenhouse template for `role=consumer`
  - Return 400 for invalid role values
  - _Requirements: 9.1, 9.4_

- [ ]* 13.1 Write unit tests for profile endpoint validation
  - Test supply_temp_c ≤ return_temp_c returns 400 with correct error shape
  - Test out-of-range WGS84 coordinates return 400
  - Test invalid heat_transfer_medium returns 400
  - Test seasonal_multipliers outside [0.0, 2.0] returns 400
  - Test min_inlet_temp_c ≥ max_inlet_temp_c returns 400
  - _Requirements: 2.3, 2.4, 2.7, 3.3, 10.3_

- [ ] 14. Checkpoint — Milestone 3A complete
  - All auth and profile endpoints return correct status codes and response shapes
  - Ensure all tests pass, ask the user if questions arise.

### Milestone 3B — Frontend: Auth Pages and Profile Forms

- [ ] 15. Implement authentication pages
  - [ ] 15.1 Implement `src/app/(auth)/register/page.js`
    - Build registration form: org_name, email, password, role (Producer/Consumer) radio
    - Client-side validation: password ≥ 12 chars, email format, role required
    - On success, redirect to verify-email prompt page
    - Display server-side error messages inline (duplicate email, etc.)
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 15.2 Implement `src/app/(auth)/login/page.js`
    - Build login form: email, password
    - Store JWT access token in memory / httpOnly cookie; store refresh token in httpOnly cookie
    - On success, redirect Producer to `/profile/heat`, Consumer to `/profile/demand` on first login; otherwise to `/dashboard`
    - _Requirements: 1.4, 1.5_

  - [ ] 15.3 Implement `src/app/(auth)/verify-email/page.js`
    - Display verification prompt with resend link
    - Handle `?token=` query param to call verify-email endpoint and show success/error state
    - _Requirements: 1.6_

- [ ] 16. Implement the `ScheduleGrid` component
  - Create `src/components/ScheduleGrid.jsx`
  - Render a 7-row × 24-column interactive boolean grid (days × hours)
  - Support click-and-drag to toggle multiple cells
  - Accept `value` (array of 168 booleans) and `onChange` (callback receiving updated array) props
  - Display day labels (Mon–Sun) and hour labels (00–23)
  - _Requirements: 2.1, 3.1, 6.1_

- [ ]* 16.1 Write unit tests for `ScheduleGrid`
  - Test that toggling a cell fires `onChange` with the correct updated array
  - Test that the component renders 168 cells
  - _Requirements: 6.1_

- [ ] 17. Implement the `SeasonalMultiplierInput` component
  - Create `src/components/SeasonalMultiplierInput.jsx`
  - Render 12 labeled sliders (Jan–Dec), each with range 0.0–2.0 and step 0.05
  - Accept `value` (array of 12 numbers) and `onChange` (callback receiving updated array) props
  - Display current value next to each slider
  - _Requirements: 2.5, 3.4_

- [ ] 18. Implement the `HeatProfileForm` page
  - Create `src/app/(dashboard)/profile/heat/page.js`
  - Fields: facility_name, street_address, latitude, longitude, supply_temp_c, return_temp_c, peak_output_kw, heat_transfer_medium (select), weekly_schedule (`ScheduleGrid`), seasonal_multipliers (`SeasonalMultiplierInput`, optional)
  - Client-side validation: supply_temp_c > return_temp_c, lat in [-90,90], lng in [-180,180], medium in allowed list
  - Offer "Pre-fill with Data Center baseline" button that calls `GET /api/v1/reference/baseline/producer` (mocked in this milestone)
  - Submit to `POST /api/v1/profiles/heat` (mocked); display success confirmation
  - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.7, 9.4_

- [ ] 19. Implement the `DemandProfileForm` page
  - Create `src/app/(dashboard)/profile/demand/page.js`
  - Fields: facility_name, street_address, latitude, longitude, min_inlet_temp_c, max_inlet_temp_c, required_flow_rate_m3h, heat_transfer_medium_pref (select with "any" option), weekly_schedule (`ScheduleGrid`), seasonal_multipliers (`SeasonalMultiplierInput`, optional)
  - Client-side validation: min_inlet_temp_c < max_inlet_temp_c, coordinate ranges
  - Offer "Pre-fill with Greenhouse baseline" button (mocked)
  - Submit to `POST /api/v1/profiles/demand` (mocked); display success confirmation
  - _Requirements: 3.1, 3.3, 3.4, 9.4_

- [ ]* 19.1 Write unit tests for profile form validation
  - Test `HeatProfileForm` shows error when supply_temp_c ≤ return_temp_c
  - Test `DemandProfileForm` shows error when min_inlet_temp_c ≥ max_inlet_temp_c
  - Test coordinate fields reject out-of-range values
  - _Requirements: 2.3, 2.4, 3.3_

- [ ] 20. Checkpoint — Milestone 3B complete
  - Auth pages render and handle mock responses correctly
  - Profile forms validate inputs client-side and display correct error states
  - Ensure all tests pass, ask the user if questions arise.

---

## Milestone 4 — Scoring Engine + Match Dashboard (Parallel)

> The backend and frontend tracks in this milestone can be developed simultaneously. The frontend uses mock score data until Milestone 5 integration.

### Milestone 4A — Backend: Scoring Engine, Proximity Queries, and Match Endpoints

- [ ] 21. Implement the Scoring Engine core module (`backend/app/services/scoring.py`)
  - [ ] 21.1 Implement `compute_distance_sub_score(dist_km: float, max_dist_km: float) -> float`
    - Return 0 if `dist_km > max_dist_km` (hard exclusion)
    - Return `round(100 * (1 - dist_km / max_dist_km), 2)` otherwise
    - _Requirements: 4.1, 4.2, 7.2_

  - [ ]* 21.2 Write property tests for `compute_distance_sub_score` using `hypothesis`
    - **Property 1: Score is always in [0, 100]** — for any dist_km ≥ 0 and max_dist_km > 0, result is in [0, 100]
    - **Property 2: Monotone decrease** — for fixed max_dist_km, increasing dist_km never increases the score
    - **Property 3: Hard exclusion** — for any dist_km > max_dist_km, score = 0
    - **Validates: Requirements 4.1, 7.2**

  - [ ] 21.3 Implement `compute_temperature_sub_score(supply_temp_c: float, min_inlet_temp_c: float, producer_medium: str, consumer_medium_pref: str) -> float`
    - Compute ΔT = supply_temp_c − min_inlet_temp_c
    - Return 0 if ΔT < 10 (hard exclusion)
    - Return `50 + ((ΔT − 10) / 20) * 50` for 10 ≤ ΔT ≤ 30
    - Return 100 if ΔT > 30
    - Apply −20 penalty (floor 0) when medium is incompatible
    - Implement `is_medium_incompatible(producer_medium: str, consumer_medium_pref: str) -> bool` helper
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 21.4 Write property tests for `compute_temperature_sub_score` using `hypothesis`
    - **Property 4: Score is always in [0, 100]** — for any valid input combination, result is in [0, 100]
    - **Property 5: Hard exclusion below 10°C ΔT** — for any supply_temp_c where ΔT < 10, score = 0
    - **Property 6: Monotone increase with ΔT** — for fixed inputs, increasing ΔT never decreases the score (before penalty)
    - **Property 7: Medium penalty never produces negative score** — score with incompatible medium ≥ 0
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

  - [ ] 21.5 Implement `compute_schedule_overlap_pct(producer_schedule: list[bool], consumer_schedule: list[bool], producer_multipliers: list[float] | None, consumer_multipliers: list[float] | None, current_month: int) -> float`
    - Count `both_active` slots (both lists True at same index)
    - Count `consumer_active` slots
    - Apply current month's seasonal multipliers to scale effective active hours when provided
    - Return `(both_active / consumer_active) * 100`; return 0 if consumer_active = 0
    - _Requirements: 6.1, 6.2, 6.5_

  - [ ]* 21.6 Write property tests for `compute_schedule_overlap_pct` using `hypothesis`
    - **Property 8: Overlap is always in [0, 100]** — for any valid list[bool] inputs of length 168, result is in [0, 100]
    - **Property 9: Subset implies 100% overlap** — if producer schedule is a superset of consumer schedule, overlap = 100%
    - **Property 10: Empty consumer schedule** — if consumer has no active slots, result is 0 (no division by zero)
    - **Validates: Requirements 6.1, 6.2, 6.5**

  - [ ] 21.7 Implement `compute_schedule_sub_score(overlap_pct: float) -> float`
    - Return 0 if overlap_pct < 30 (hard exclusion)
    - Return `((overlap_pct − 30) / 70) * 100` for 30 ≤ overlap_pct ≤ 100
    - _Requirements: 6.3, 6.4_

  - [ ]* 21.8 Write property tests for `compute_schedule_sub_score` using `hypothesis`
    - **Property 11: Score is always in [0, 100]** — for any overlap_pct in [0, 100], result is in [0, 100]
    - **Property 12: Hard exclusion below 30%** — for any overlap_pct < 30, score = 0
    - **Property 13: Monotone increase** — increasing overlap_pct never decreases the score
    - **Validates: Requirements 6.3, 6.4**

  - [ ] 21.9 Implement `compute_composite_score(dist_sub: float, temp_sub: float, sched_sub: float, weights: ScoringWeights) -> float`
    - Return 0 if any sub-score is 0 (hard constraint violation)
    - Return `(weights.distance * dist_sub) + (weights.temperature * temp_sub) + (weights.schedule * sched_sub)` otherwise
    - _Requirements: 7.1, 7.3_

  - [ ]* 21.10 Write property tests for `compute_composite_score` using `hypothesis`
    - **Property 14: Zero propagation** — if any sub-score is 0, composite score = 0
    - **Property 15: Score is always in [0, 100]** — for any valid sub-scores and weights summing to 1.0, result is in [0, 100]
    - **Property 16: Weight scaling** — doubling a weight (while halving another to maintain sum = 1.0) increases the composite score when the corresponding sub-score is above average
    - **Validates: Requirements 7.1, 7.3**

- [ ] 22. Implement the spatial proximity query
  - Create `backend/app/services/spatial.py`
  - Implement `get_candidate_pairs(heat_profile_id, max_dist_km, conn)`: query using `ST_DistanceSphere(hp.location, dp.location) / 1000.0 <= max_dist_km` with GIST index via `asyncpg`
  - Implement `get_all_candidate_pairs(max_dist_km, conn)`: return all heat/demand profile pairs within distance threshold
  - Use PostGIS exclusively — no application-layer haversine
  - _Requirements: 4.2, 11.4_

- [ ] 23. Implement the async scoring job and queue integration
  - [ ] 23.1 Set up Arq queue
    - Create `backend/app/queue/worker.py` — define Arq `WorkerSettings` with Redis connection
    - Define job functions: `recompute_for_heat_profile`, `recompute_for_demand_profile`, `recompute_all`
    - _Requirements: 7.6, 2.6, 3.5_

  - [ ] 23.2 Implement the scoring job worker functions
    - In `backend/app/queue/worker.py`:
    - `recompute_for_heat_profile(ctx, heat_profile_id)`: fetch all demand profiles within `max_distance_km`, compute score for each pair, upsert into `compatibility_scores`
    - `recompute_for_demand_profile(ctx, demand_profile_id)`: fetch all heat profiles within `max_distance_km`, compute score for each pair, upsert
    - `recompute_all(ctx)` (triggered by config change): recompute all pairs
    - Ensure all affected scores are recomputed within 60 seconds of trigger
    - _Requirements: 7.6, 2.6, 3.5, 4.4_

  - [ ] 23.3 Enqueue recompute jobs from profile and config update handlers
    - Enqueue `recompute_for_heat_profile` from `PUT /profiles/heat/{id}` and `POST /profiles/heat`
    - Enqueue `recompute_for_demand_profile` from `PUT /profiles/demand/{id}` and `POST /profiles/demand`
    - Enqueue `recompute_all` from `PUT /admin/config`
    - _Requirements: 2.6, 3.5, 7.6_

- [ ] 24. Implement match query endpoints
  - [ ] 24.1 Implement `GET /api/v1/matches`
    - Authenticate request; determine user's profile type (producer/consumer)
    - Query `compatibility_scores` joined with counterpart profiles, filtered by `overall_score > 0`
    - Support `minScore` query param filter
    - Return paginated response with `total`, `page`, `pageSize`, `nextCursor`
    - Each match entry includes: counterpart facility_name, overall_score, pipe_distance_km, delta_t_c, schedule_overlap_pct, current month seasonal adjustment status
    - Sort by `overall_score DESC`
    - _Requirements: 8.1, 8.2, 8.3, 10.4_

  - [ ] 24.2 Implement `GET /api/v1/matches/:matchId`
    - Return full match detail: all fields from `compatibility_scores` plus both profile names and locations
    - Return 404 if match not found or not accessible by requesting user
    - _Requirements: 8.6_

- [ ] 25. Implement admin config endpoints
  - [ ] 25.1 Implement `GET /api/v1/admin/config`
    - Require `role = admin` (403 otherwise)
    - Return current `scoring_config` row
    - _Requirements: 7.4, 4.3_

  - [ ] 25.2 Implement `PUT /api/v1/admin/config`
    - Require `role = admin`
    - Validate weights sum to 1.0 (±0.0001 tolerance); validate max_distance_km in [1, 100]
    - Persist update, enqueue `RECOMPUTE_ALL` job
    - _Requirements: 7.4, 4.3, 7.6_

- [ ]* 25.3 Write unit tests for scoring engine functions using `pytest`
  - Test `compute_distance_sub_score` boundary values: dist_km = 0, dist_km = max_dist_km, dist_km > max_dist_km
  - Test `compute_temperature_sub_score` at ΔT = 9.9, 10, 20, 30, 30.1 and with incompatible medium
  - Test `compute_schedule_overlap_pct` with all-True producer, partial consumer, and empty consumer schedules
  - Test `compute_composite_score` with one zero sub-score returns 0
  - _Requirements: 4.1, 5.1, 5.2, 5.3, 5.4, 6.3, 7.1, 7.3_

- [ ] 26. Checkpoint — Milestone 4A complete
  - Scoring engine unit tests pass
  - Property tests pass
  - Match endpoints return correct paginated responses with mock data
  - Ensure all tests pass, ask the user if questions arise.

### Milestone 4B — Frontend: Match Dashboard and Map View

- [ ] 27. Implement the `FacilityMap` component
  - Create `src/components/FacilityMap.jsx`
  - Integrate Mapbox GL JS or Leaflet
  - Accept `userFacility: { lat, lng, name }` and `matches: { lat, lng, name, score }[]` props
  - Render distinct markers for the user's facility and each matched counterpart
  - _Requirements: 8.4_

- [ ] 28. Implement the `MatchCard` component
  - Create `src/components/MatchCard.jsx`
  - Display: counterpart facility name, Compatibility Score (0–100), pipe distance (km), ΔT (°C), Schedule Overlap (%), seasonal adjustment indicator
  - Accept an `onClick` handler prop
  - _Requirements: 8.3_

- [ ] 29. Implement the `ScoreFilterSlider` component
  - Create `src/components/ScoreFilterSlider.jsx`
  - Render a range slider (0–100) for minimum score filter
  - Accept `value` (number) and `onChange` (callback) props
  - Filtering updates the list without a full page reload (client-side state)
  - _Requirements: 8.5_

- [ ] 30. Implement the `MatchDetailPanel` component
  - Create `src/components/MatchDetailPanel.jsx`
  - Render a drawer or modal showing: Distance Sub-Score, Temperature Sub-Score, Schedule Sub-Score, pipe_distance_km, delta_t_c, schedule_overlap_pct
  - Accept `match` prop and `onClose` handler
  - _Requirements: 8.6_

- [ ] 31. Implement the `MatchDashboard` page
  - Create `src/app/(dashboard)/dashboard/page.js`
  - Fetch matches from `GET /api/v1/matches` (mocked in this milestone)
  - Render `MatchCard` list sorted by score descending
  - Render `FacilityMap` alongside the list
  - Wire `ScoreFilterSlider` to filter the displayed list client-side
  - Open `MatchDetailPanel` on card click, fetching detail from `GET /api/v1/matches/:matchId` (mocked)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ]* 31.1 Write unit tests for `MatchDashboard` filtering
  - Test that applying a minScore filter of 70 hides cards with score < 70
  - Test that removing the filter restores all cards
  - _Requirements: 8.5_

- [ ] 32. Implement the admin config page
  - Create `src/app/admin/config/page.js`
  - Implement `AdminWeightsForm` component: three weight inputs (distance, temperature, schedule) with real-time sum-to-1.0 validation display
  - Add max_distance_km input (integer, 1–100)
  - Submit to `PUT /api/v1/admin/config` (mocked); display success/error feedback
  - _Requirements: 7.4, 4.3_

- [ ]* 32.1 Write unit tests for `AdminWeightsForm`
  - Test that submitting weights that do not sum to 1.0 shows a validation error
  - Test that max_distance_km outside [1, 100] shows a validation error
  - _Requirements: 7.4, 4.3_

- [ ] 33. Checkpoint — Milestone 4B complete
  - Dashboard renders mock match data with working filter and detail panel
  - Map renders facility markers
  - Admin config form validates weights sum
  - Ensure all tests pass, ask the user if questions arise.

---

## Milestone 5 — Integration, End-to-End Testing, and Deployment Config

- [ ] 34. Wire the Next.js frontend to the live backend API
  - [ ] 34.1 Replace all mock API calls with live `src/lib/api.js` calls
    - Update `HeatProfileForm` and `DemandProfileForm` to call live profile endpoints
    - Update `MatchDashboard` to call live `GET /api/v1/matches` and `GET /api/v1/matches/:matchId`
    - Update `AdminWeightsForm` to call live `GET/PUT /api/v1/admin/config`
    - Update baseline pre-fill buttons to call live `GET /api/v1/reference/baseline/:role`
    - _Requirements: 10.1, 12.5_

  - [ ] 34.2 Implement the Next.js API proxy route handler
    - Create `src/app/api/v1/[...path]/route.js`
    - Forward all `/api/v1/*` requests to the backend service URL (from `NEXT_PUBLIC_API_URL` env var)
    - Forward Authorization headers; propagate error responses unchanged
    - _Requirements: 10.1_

  - [ ] 34.3 Implement JWT token lifecycle in the frontend
    - Store access token in memory; store refresh token in httpOnly cookie
    - Implement silent refresh: intercept 401 responses, call `/auth/refresh`, retry original request
    - Redirect to `/login` if refresh fails
    - _Requirements: 1.6_

- [ ] 35. Implement email verification flow end-to-end
  - Configure SMTP environment variables and wire the email service in the backend
  - Test the full flow: register → receive email → click link → `email_verified = true` → login succeeds
  - _Requirements: 1.2, 1.6_

- [ ] 36. Implement the `matches/[matchId]` detail page
  - Create `src/app/(dashboard)/matches/[matchId]/page.js`
  - Fetch match detail from `GET /api/v1/matches/:matchId` using the live API
  - Render `MatchDetailPanel` with full sub-score breakdown
  - Handle 404 gracefully with a user-friendly error state
  - _Requirements: 8.6_

- [ ] 37. Write end-to-end integration tests (`pytest` + `httpx.AsyncClient`)
  - [ ]* 37.1 Write integration test: Producer registration and profile creation flow
    - Register as Producer → verify email → login → create Heat Profile → assert profile persisted and recompute job enqueued
    - _Requirements: 1.1, 1.2, 2.2, 2.6_

  - [ ]* 37.2 Write integration test: Consumer registration and profile creation flow
    - Register as Consumer → verify email → login → create Demand Profile → assert profile persisted
    - _Requirements: 1.1, 1.2, 3.2_

  - [ ]* 37.3 Write integration test: Scoring Engine computes correct scores for baseline archetypes
    - Insert Data Center Producer and Greenhouse Consumer seed profiles at a known distance (e.g., 5 km apart)
    - Trigger recompute job synchronously in test (call worker function directly)
    - Assert: distance_sub_score, temperature_sub_score (ΔT = 45 − 35 = 10°C → score = 50), schedule_sub_score, and overall_score match expected values
    - Assert score is persisted in `compatibility_scores`
    - _Requirements: 7.1, 7.2, 7.5, 5.3, 6.4_

  - [ ]* 37.4 Write integration test: Hard constraint exclusions
    - Test pair with distance > max_distance_km → overall_score = 0, excluded from matches
    - Test pair with ΔT < 10°C → overall_score = 0, excluded
    - Test pair with schedule overlap < 30% → overall_score = 0, excluded
    - _Requirements: 4.1, 5.2, 6.3, 7.3_

  - [ ]* 37.5 Write integration test: Admin config change triggers full recompute
    - Update `max_distance_km` via `PUT /api/v1/admin/config`
    - Assert `recompute_all` job is enqueued
    - Assert all `compatibility_scores` rows are updated within 60 seconds
    - _Requirements: 7.6, 4.3_

  - [ ]* 37.6 Write integration test: Profile update triggers score recompute within 60 seconds
    - Update a Heat Profile's supply temperature
    - Assert all associated `compatibility_scores` rows are recomputed within 60 seconds
    - _Requirements: 2.6, 7.6_

  - [ ]* 37.7 Write integration test: Matches endpoint pagination
    - Insert 25 scored pairs for a single producer
    - Call `GET /api/v1/matches?pageSize=10`
    - Assert response contains `total=25`, `nextCursor` is present, and exactly 10 items returned
    - _Requirements: 10.4_

- [ ] 38. Create deployment configuration
  - [ ] 38.1 Create `docker-compose.yml` for local development
    - Services: `postgres` (with PostGIS image), `redis`, `backend` (Uvicorn), `frontend` (Next.js)
    - Include health checks and dependency ordering
    - Mount `.env` files; do not hard-code secrets
    - _Requirements: 12.5_

  - [ ] 38.2 Create production environment configuration
    - Create `backend/.env.production.example` and `frontend/.env.production.example` with all required variables documented
    - Add `Dockerfile` for the backend service (multi-stage build: `python:3.12-slim` base → install deps → copy app → `CMD ["uvicorn", "main:app", "--host", "0.0.0.0"]`)
    - Verify `next build` completes without errors for the frontend
    - _Requirements: 12.5_

- [ ] 39. Final checkpoint — All milestones complete
  - Run full test suite: `pytest backend/` (unit + property + integration)
  - Run `python -m app.db.migrate && python -m app.db.seed` against a clean database
  - Verify `swagger-cli validate openapi.yaml` passes
  - Verify `next build` and `uvicorn main:app` both start without errors
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP delivery
- Milestones 3 and 4 contain parallel frontend (3B, 4B) and backend (3A, 4A) tracks — both can be started simultaneously after Milestone 2 is complete
- Each task references specific requirements for full traceability
- Property tests (tasks 21.2, 21.4, 21.6, 21.8, 21.10) use the `hypothesis` library and validate universal correctness properties of the Scoring Engine's pure functions
- Unit tests use `pytest`; integration tests use `pytest` + `httpx.AsyncClient` against a test database
- Integration tests in Milestone 5 validate end-to-end flows across the full stack
- The scoring engine's pure functions (tasks 21.1–21.9) should be implemented and tested before wiring them into the async Arq worker (task 23.2)
