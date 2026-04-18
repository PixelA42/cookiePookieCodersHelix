# Industrial Heat Waste Recovery Optimizer - Design Document

## 1. Problem Synthesis

Industrial facilities (explicitly including factories and data centers) release significant waste heat, while nearby facilities (greenhouses, cold-storage, district heating) may be able to absorb it. The stated gap is the absence of a matching system that can connect supply and demand. The requested solution is a proximity-aware platform that ingests industrial heat output profiles and local demand schedules, then identifies viable heat-sharing pairs while accounting for pipe distance, temperature compatibility, and seasonal mismatch.

## 2. Extracted Requirements & Constraints

- Build a platform for matching industrial heat suppliers to local heat demand consumers.
- The platform must be proximity-aware.
- Input data must include industrial heat output profiles.
- Input data must include local demand schedules.
- Output must identify viable heat-sharing pairs.
- Pairing logic must account for pipe distance.
- Pairing logic must account for temperature compatibility.
- Pairing logic must account for seasonal mismatch.
- The problem statement establishes that currently no matching system exists.
- Explicit producer examples: factories and data centers.
- Explicit consumer examples: greenhouses, cold-storage, district heating.

## 3. Proposed Design Approaches

### Approach 1: Quick/Pragmatic Rules-Based Pairing

**Mechanism:**
- Normalize supplier profiles and consumer demand schedules into common structures.
- Generate candidate pairs using a proximity filter (distance-first pruning).
- Apply deterministic viability checks in sequence:
	- Pipe-distance threshold check.
	- Temperature compatibility check.
	- Schedule overlap and seasonal overlap check.
- Return only pairs that pass all checks, optionally sorted by strongest combined fit (for example: shortest distance plus highest schedule overlap).

**Trade-offs:**
- Pros:
	- Fastest to implement and easiest to validate.
	- High explainability because each acceptance/rejection has explicit reasons.
	- Lower operational complexity; predictable behavior.
- Cons:
	- Sensitive to threshold tuning; strict cutoffs may exclude borderline but practical pairs.
	- Less robust when data is noisy or partially missing.
	- Can struggle to rank many viable candidates beyond simple heuristic ordering.

### Approach 2: Weighted Multi-Criteria Scoring and Ranking

**Mechanism:**
- Compute a compatibility score per candidate pair by combining:
	- Distance fitness.
	- Temperature compatibility fitness.
	- Temporal compatibility fitness (including seasonality alignment).
- Use weighted aggregation to rank all candidate pairs by score.
- Support configurable weights to reflect stakeholder priorities without changing core logic.
- Surface top-ranked pairs above a minimum viability threshold.

**Trade-offs:**
- Pros:
	- Produces a full ranking, not only binary pass/fail.
	- More flexible than strict rules; can balance competing factors.
	- Easier to calibrate over time by adjusting weights and thresholds.
- Cons:
	- Weight selection can be subjective without governance.
	- Lower transparency than pure rules unless score decomposition is exposed.
	- Risk of score masking, where one strong factor hides a critical weakness in another factor.

### Approach 3: Network Optimization (Graph/Matching Engine)

**Mechanism:**
- Model suppliers and consumers as graph nodes.
- Represent each feasible supplier-consumer link as an edge only if baseline viability constraints are met (distance, temperature, seasonal/schedule compatibility).
- Assign edge weights based on expected transfer fitness.
- Run a matching/optimization routine to select a globally optimal set of pairings (rather than independent pair ranking), minimizing mismatch and maximizing overall viable utilization.
- Re-run optimization per planning window (for example, seasonal windows) to account for changing schedules and mismatch patterns.

**Trade-offs:**
- Pros:
	- Optimizes system-wide outcomes, not just pair-by-pair local choices.
	- Handles competing candidates and resource contention more rigorously.
	- Naturally supports scenario analysis across seasonal periods.
- Cons:
	- Highest implementation and operational complexity.
	- Requires clearer data definitions and constraint modeling discipline.
	- More difficult to explain and troubleshoot for non-technical stakeholders.

### Approach 4: Innovative Two-Stage Hybrid (Rules Gate + Learning Ranker)

**Mechanism:**
- Stage 1: Hard-constraint viability gate filters out clearly infeasible pairs using explicit checks (distance, temperature, seasonal/schedule incompatibility).
- Stage 2: A learning-based ranker orders the remaining feasible pairs using historical outcomes and observed pairing performance over time.
- Keep hard constraints immutable while allowing ranking quality to improve from data.

**Trade-offs:**
- Pros:
	- Preserves safety and domain constraints through explicit gating.
	- Improves recommendation quality as data accumulates.
	- Balances explainability (gate) and adaptability (ranker).
- Cons:
	- Requires historical data and feedback loops to unlock full value.
	- Adds lifecycle complexity (model training, monitoring, drift detection).
	- Hard to evaluate early when labeled outcomes are sparse.

## 4. Edge Cases & Blind Spots

- Sparse geography case: nearest facilities may still exceed practical pipe-distance limits, yielding few or zero viable pairs.
- Temperature near-threshold case: small measurement errors can flip compatibility decisions.
- Temporal granularity mismatch: supplier profiles and demand schedules may be reported at different time resolutions, affecting overlap accuracy.
- Seasonal transition case: shoulder months may not fit simple seasonal buckets and can produce unstable recommendations.
- One-to-many contention: several consumers may target the same high-fit supplier, creating allocation conflicts in non-optimization approaches.
- Many-to-one contention: one consumer may receive many candidate suppliers with no clear tie-break policy.
- Missing data fields: incomplete profile attributes can cause false negatives (overly strict) or false positives (overly permissive).
- Static-distance blind spot: straight-line proximity may not reflect actual pipe route feasibility.
- Recommendation volatility: small schedule updates can cause large ranking shifts if smoothing/hysteresis is not defined.

## 5. Assumptions & Open Questions

- What exact fields are included in an "industrial heat output profile"?
- What exact fields and time granularity are included in "local demand schedules"?
- Are pairings strictly one supplier to one consumer, or can one supplier serve multiple consumers?
- Is the platform expected to recommend only pairs, or also quantity/flow allocation per pair?
- Is there a maximum acceptable pipe distance, and is it global or context-specific?
- How should temperature compatibility be evaluated (minimum/maximum ranges, tolerance bands, or transfer efficiency model)?
- How should seasonal mismatch be represented (calendar seasons, monthly buckets, dynamic weather periods)?
- Should the system return binary viability only, ranked recommendations, or both?
- What is the required recommendation latency (batch planning vs near real-time updates)?
- What data quality rules apply when inputs are incomplete, stale, or contradictory?
- Are there geographic boundaries that define "nearby" (administrative limits, service zones)?
- What success metrics define platform effectiveness (e.g., viable pair count, utilization potential, avoided waste heat)?

