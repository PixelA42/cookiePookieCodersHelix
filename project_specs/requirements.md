# Requirements Document

## Introduction

The Industrial Heat Waste Recovery Optimizer (IHWRO) is a proximity-aware web platform that connects industrial heat producers (factories, data centers) with nearby heat consumers (greenhouses, cold-storage facilities, district heating networks). The platform ingests heat output profiles and demand schedules, then scores and surfaces viable heat-sharing pairs based on pipe distance, temperature compatibility, and seasonal schedule alignment. The MVP targets operations managers and sustainability leads at both producer and consumer facilities, enabling them to discover, evaluate, and initiate heat-sharing partnerships that would otherwise go undetected.

---

## Glossary

- **Producer**: A facility that generates surplus waste heat as a byproduct of its primary operations (e.g., data center, factory, power plant).
- **Consumer**: A facility that has a thermal demand that could be met by recovered waste heat (e.g., greenhouse, cold-storage facility, district heating operator).
- **Heat Profile**: A structured dataset describing a facility's thermal output or demand, including temperature range, flow rate, heat transfer medium, and temporal schedule.
- **Match**: A Producer–Consumer pair that satisfies all hard compatibility constraints (temperature delta, pipe distance, schedule overlap) and has a Compatibility Score above the minimum viable threshold.
- **Compatibility Score**: A composite numeric score (0–100) representing the viability of a Producer–Consumer pair, derived from distance, temperature compatibility, and schedule alignment sub-scores.
- **Temperature Delta (ΔT)**: The difference between a Producer's supply temperature and a Consumer's minimum required inlet temperature.
- **Pipe Distance**: The straight-line geodesic distance in kilometers between a Producer and Consumer facility, used as a proxy for infrastructure cost.
- **Schedule Overlap**: The proportion of operating hours per week during which both a Producer's surplus heat availability and a Consumer's thermal demand are simultaneously active.
- **Heat Transfer Medium**: The fluid used to transport thermal energy (e.g., water, steam, glycol solution).
- **Seasonal Profile**: A set of monthly or quarterly multipliers applied to a facility's baseline heat output or demand to reflect seasonal variation.
- **Scoring Engine**: The backend service responsible for computing Compatibility Scores for all Producer–Consumer pairs.
- **API Contract**: A versioned OpenAPI specification defining all request/response schemas shared between the frontend and backend teams.
- **PostGIS**: A spatial extension for PostgreSQL that enables geographic queries such as distance calculations and proximity searches.
- **IHWRO**: Abbreviation for Industrial Heat Waste Recovery Optimizer, the system described in this document.

---

## Requirements

---

### Requirement 1: User Registration and Role Assignment

**User Story:** As an operations manager at a heat-producing facility, I want to register my organization and declare its role as a Producer or Consumer, so that the platform can present me with relevant workflows and match results.

#### Acceptance Criteria

1. THE IHWRO SHALL provide a registration flow that collects organization name, primary contact email, password, and facility role (Producer or Consumer).
2. WHEN a user submits a registration form with a valid email address and a password of at least 12 characters, THE IHWRO SHALL create an account and send an email verification link within 60 seconds.
3. WHEN a user submits a registration form with an email address already associated with an existing account, THE IHWRO SHALL return a descriptive error message without creating a duplicate account.
4. WHEN a user selects the Producer role during registration, THE IHWRO SHALL route the user to the Heat Profile creation workflow upon first login.
5. WHEN a user selects the Consumer role during registration, THE IHWRO SHALL route the user to the Demand Profile creation workflow upon first login.
6. IF a user attempts to access a protected route without a verified email address, THEN THE IHWRO SHALL redirect the user to an email verification prompt.

---

### Requirement 2: Producer Heat Profile Ingestion

**User Story:** As a Producer operations manager, I want to submit my facility's heat output profile including location, temperature range, flow rate, and operating schedule, so that the platform can identify compatible Consumer matches for my surplus heat.

#### Acceptance Criteria

1. THE IHWRO SHALL provide a Heat Profile form that collects the following fields: facility name, street address, geographic coordinates (latitude/longitude), supply temperature (°C), return temperature (°C), peak thermal output (kW), heat transfer medium, and weekly operating schedule.
2. WHEN a Producer submits a Heat Profile with all required fields populated and valid, THE IHWRO SHALL persist the profile and make it available to the Scoring Engine within 5 seconds.
3. WHEN a Producer submits a Heat Profile with a supply temperature value less than or equal to the return temperature value, THE IHWRO SHALL return a validation error identifying the invalid field pair.
4. WHEN a Producer submits a Heat Profile with geographic coordinates outside the valid range (latitude −90 to 90, longitude −180 to 180), THE IHWRO SHALL return a validation error identifying the invalid coordinate field.
5. THE IHWRO SHALL accept seasonal multipliers (one per calendar month, range 0.0–2.0) as an optional extension to the baseline Heat Profile.
6. WHEN a Producer updates an existing Heat Profile, THE IHWRO SHALL invalidate and recompute all Compatibility Scores associated with that Producer's facility within 60 seconds of the update being saved.
7. THE IHWRO SHALL support the following heat transfer medium values: water, steam, glycol-water mixture, thermal oil.

---

### Requirement 3: Consumer Demand Profile Ingestion

**User Story:** As a Consumer operations manager, I want to submit my facility's thermal demand profile including minimum inlet temperature, required flow rate, and operating schedule, so that the platform can identify Producer facilities whose surplus heat meets my needs.

#### Acceptance Criteria

1. THE IHWRO SHALL provide a Demand Profile form that collects the following fields: facility name, street address, geographic coordinates (latitude/longitude), minimum required inlet temperature (°C), maximum acceptable inlet temperature (°C), required flow rate (m³/h), heat transfer medium preference, and weekly operating schedule.
2. WHEN a Consumer submits a Demand Profile with all required fields populated and valid, THE IHWRO SHALL persist the profile and make it available to the Scoring Engine within 5 seconds.
3. WHEN a Consumer submits a Demand Profile with a minimum required inlet temperature greater than or equal to the maximum acceptable inlet temperature, THE IHWRO SHALL return a validation error identifying the invalid field pair.
4. THE IHWRO SHALL accept seasonal demand multipliers (one per calendar month, range 0.0–2.0) as an optional extension to the baseline Demand Profile.
5. WHEN a Consumer updates an existing Demand Profile, THE IHWRO SHALL invalidate and recompute all Compatibility Scores associated with that Consumer's facility within 60 seconds of the update being saved.

---

### Requirement 4: Proximity Filtering

**User Story:** As a platform user, I want the system to filter potential matches by geographic proximity, so that only economically viable heat-sharing pairs (those within feasible pipe distance) are surfaced.

#### Acceptance Criteria

1. THE Scoring Engine SHALL exclude any Producer–Consumer pair whose geodesic pipe distance exceeds 25 kilometers from match consideration.
2. WHEN computing pipe distance, THE Scoring Engine SHALL use the PostGIS `ST_DistanceSphere` function applied to the stored geographic coordinates of both facilities.
3. THE IHWRO SHALL allow platform administrators to configure the maximum pipe distance threshold (in whole kilometers, range 1–100) without requiring a code deployment.
4. WHEN a Producer or Consumer updates their facility's geographic coordinates, THE IHWRO SHALL recompute proximity eligibility for all pairs involving that facility within 60 seconds.

---

### Requirement 5: Temperature Compatibility Assessment

**User Story:** As a platform user, I want the system to assess whether a Producer's heat output temperature is compatible with a Consumer's inlet temperature requirements, so that only thermally viable pairs are scored and surfaced.

#### Acceptance Criteria

1. THE Scoring Engine SHALL classify a Producer–Consumer pair as thermally compatible only when the Producer's supply temperature exceeds the Consumer's minimum required inlet temperature by at least 10°C (ΔT ≥ 10°C).
2. WHEN a Producer–Consumer pair has a ΔT below 10°C, THE Scoring Engine SHALL assign a temperature sub-score of 0 and exclude the pair from match results.
3. WHEN a Producer–Consumer pair has a ΔT between 10°C and 30°C (inclusive), THE Scoring Engine SHALL assign a temperature sub-score using linear interpolation between 50 and 100.
4. WHEN a Producer–Consumer pair has a ΔT greater than 30°C, THE Scoring Engine SHALL assign a temperature sub-score of 100.
5. WHEN a Producer's heat transfer medium is incompatible with a Consumer's heat transfer medium preference and no standard heat exchanger adaptation is feasible, THE Scoring Engine SHALL reduce the temperature sub-score by 20 points, to a minimum of 0.

---

### Requirement 6: Schedule Overlap Computation

**User Story:** As a platform user, I want the system to measure how well a Producer's heat availability schedule aligns with a Consumer's demand schedule, so that matches with high temporal alignment are ranked above those with poor alignment.

#### Acceptance Criteria

1. THE Scoring Engine SHALL represent weekly operating schedules as a set of 168 hourly time slots (24 hours × 7 days), each marked as active or inactive.
2. THE Scoring Engine SHALL compute Schedule Overlap as the ratio of hours per week during which both the Producer's surplus heat is available and the Consumer's thermal demand is active, divided by the total hours during which the Consumer's demand is active, expressed as a percentage.
3. WHEN a Producer–Consumer pair has a Schedule Overlap below 30%, THE Scoring Engine SHALL assign a schedule sub-score of 0.
4. WHEN a Producer–Consumer pair has a Schedule Overlap between 30% and 100% (inclusive), THE Scoring Engine SHALL assign a schedule sub-score using linear interpolation between 0 and 100.
5. WHERE seasonal multipliers are provided for both the Producer and Consumer, THE Scoring Engine SHALL apply the current calendar month's multipliers when computing the Schedule Overlap for real-time scoring.

---

### Requirement 7: Compatibility Scoring Engine

**User Story:** As a platform user, I want each Producer–Consumer pair to receive a single Compatibility Score out of 100, so that I can quickly rank and compare potential heat-sharing partnerships.

#### Acceptance Criteria

1. THE Scoring Engine SHALL compute the Compatibility Score using the weighted formula: `Score = (0.35 × Distance_Sub_Score) + (0.40 × Temperature_Sub_Score) + (0.25 × Schedule_Sub_Score)`, where each sub-score is in the range 0–100.
2. THE Scoring Engine SHALL compute the Distance Sub-Score as: `100 × (1 − (pipe_distance_km / max_distance_threshold_km))`, rounded to two decimal places.
3. WHEN any individual sub-score is 0 due to a hard constraint violation (ΔT < 10°C, Schedule Overlap < 30%, or distance > threshold), THE Scoring Engine SHALL set the overall Compatibility Score to 0 and exclude the pair from match results.
4. THE IHWRO SHALL allow platform administrators to adjust the three scoring weights (distance, temperature, schedule) via a configuration interface, provided the weights sum to 1.0.
5. WHEN a Compatibility Score is computed or recomputed, THE Scoring Engine SHALL persist the score, the three sub-scores, the pipe distance, the ΔT value, and the Schedule Overlap percentage alongside the pair record.
6. THE Scoring Engine SHALL recompute all affected Compatibility Scores within 60 seconds of any change to a Heat Profile, Demand Profile, or scoring configuration.

---

### Requirement 8: Match Discovery Dashboard

**User Story:** As a Producer or Consumer operations manager, I want to view a ranked list of my facility's compatible matches with their Compatibility Scores and key metrics, so that I can evaluate and prioritize potential heat-sharing partnerships.

#### Acceptance Criteria

1. WHEN a logged-in Producer views their match dashboard, THE IHWRO SHALL display all Consumer facilities with a Compatibility Score greater than 0, sorted by Compatibility Score in descending order.
2. WHEN a logged-in Consumer views their match dashboard, THE IHWRO SHALL display all Producer facilities with a Compatibility Score greater than 0, sorted by Compatibility Score in descending order.
3. THE IHWRO SHALL display the following fields for each match entry: counterpart facility name, Compatibility Score, pipe distance (km), ΔT (°C), Schedule Overlap (%), and the current month's seasonal adjustment status.
4. THE IHWRO SHALL render a map view alongside the list view, plotting the user's facility and all matched counterpart facilities as distinct markers using their stored geographic coordinates.
5. WHEN a user applies a minimum Compatibility Score filter on the dashboard, THE IHWRO SHALL update the displayed match list to show only pairs meeting or exceeding the specified threshold without requiring a full page reload.
6. WHEN a user clicks on a match entry, THE IHWRO SHALL display a detail panel showing the full breakdown of Distance Sub-Score, Temperature Sub-Score, and Schedule Sub-Score.

---

### Requirement 9: Dataset Baseline Reference Data

**User Story:** As a new platform user, I want the system to provide realistic baseline data examples for common facility types, so that I can understand the expected data format and populate my profile accurately.

#### Acceptance Criteria

1. THE IHWRO SHALL provide a reference dataset containing at least two baseline facility examples: one Producer (data center archetype) and one Consumer (greenhouse archetype).
2. THE Data Center baseline Producer profile SHALL include the following representative values: supply temperature 45°C, return temperature 35°C, peak thermal output 2,500 kW, heat transfer medium water, operating schedule 24 hours/day 7 days/week, seasonal multipliers ranging from 0.85 (summer) to 1.15 (winter) reflecting cooling load variation.
3. THE Greenhouse baseline Consumer profile SHALL include the following representative values: minimum required inlet temperature 35°C, maximum acceptable inlet temperature 60°C, required flow rate 120 m³/h, heat transfer medium water, operating schedule 06:00–22:00 Monday–Sunday, seasonal multipliers ranging from 0.40 (summer) to 1.60 (winter) reflecting heating demand variation.
4. WHEN a new user begins profile creation, THE IHWRO SHALL offer the option to pre-populate the form with the relevant baseline example for their facility role.

---

### Requirement 10: API Contract and Parallel Development Support

**User Story:** As a frontend engineer building the Next.js interface, I want a stable, versioned API contract defined before backend implementation begins, so that frontend and backend teams can develop in parallel without blocking each other.

#### Acceptance Criteria

1. THE IHWRO SHALL expose all data operations through a RESTful API versioned under the `/api/v1/` path prefix.
2. THE IHWRO SHALL provide an OpenAPI 3.1 specification file describing all endpoints, request schemas, response schemas, and error codes before backend implementation of any endpoint begins.
3. THE IHWRO SHALL return all API error responses in the format `{ "error": { "code": "<string>", "message": "<string>", "field": "<string|null>" } }` with appropriate HTTP status codes.
4. WHEN the backend returns a paginated list resource, THE IHWRO SHALL include a `pagination` object in the response containing `total`, `page`, `pageSize`, and `nextCursor` fields.
5. THE IHWRO SHALL version the OpenAPI specification file in the project repository and update it before merging any breaking API change.

---

### Requirement 11: Spatial Data Storage

**User Story:** As a backend engineer, I want all facility location data stored in a PostGIS-enabled PostgreSQL database, so that proximity queries are computed efficiently using native spatial indexing.

#### Acceptance Criteria

1. THE IHWRO SHALL store all facility geographic coordinates as PostGIS `GEOGRAPHY(POINT, 4326)` column types.
2. THE IHWRO SHALL create a spatial index (GIST) on all `GEOGRAPHY` columns used in proximity queries.
3. WHEN a facility record is inserted or updated with new coordinates, THE IHWRO SHALL validate that the coordinate values fall within the valid WGS84 range before persisting the record.
4. THE Scoring Engine SHALL use PostGIS spatial functions exclusively for all distance computations, rather than application-layer haversine calculations.

---

### Requirement 12: Phased Engineering Milestones

**User Story:** As an engineering lead, I want the implementation broken into parallel-safe milestones so that the frontend (Next.js) and backend teams can make progress simultaneously without blocking on each other's deliverables.

#### Acceptance Criteria

1. THE IHWRO engineering plan SHALL define Milestone 1 as: API contract finalization (OpenAPI spec), project scaffolding (Next.js frontend shell, FastAPI/Node backend shell), and shared type generation from the OpenAPI spec — all completable before any feature logic is implemented.
2. THE IHWRO engineering plan SHALL define Milestone 2 as: database schema creation (PostgreSQL + PostGIS), data model implementation, and seed data insertion for the two baseline facility archetypes.
3. THE IHWRO engineering plan SHALL define Milestone 3 as: backend implementation of profile ingestion endpoints and frontend implementation of profile creation forms — executable in parallel using mock API responses on the frontend.
4. THE IHWRO engineering plan SHALL define Milestone 4 as: backend implementation of the Scoring Engine and proximity query logic, and frontend implementation of the match dashboard and map view — executable in parallel using mock score data on the frontend.
5. THE IHWRO engineering plan SHALL define Milestone 5 as: frontend–backend integration, end-to-end testing, and deployment configuration.
