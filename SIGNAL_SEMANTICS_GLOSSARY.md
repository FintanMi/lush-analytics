# Signal Semantics Glossary
## E-commerce Seller Analytics API

**Version 1.0 | Last Updated: 2026-01-20**

This glossary defines the precise meaning of key terms used throughout the analytics system. These definitions are normative and govern all system behavior, documentation, and user communication.

---

## Core Concepts

### Anomaly

**Definition**: A statistically significant deviation from expected behavior patterns, detected through DSP algorithms (FIR smoothing, FFT analysis, HFD computation).

**NOT**: An error, bug, or system malfunction.

**Measurement**: Anomaly score (0-1 scale)
- 0.0-0.4: Normal variation
- 0.4-0.6: Moderate anomaly (monitor)
- 0.6-0.8: High anomaly (investigate)
- 0.8-1.0: Critical anomaly (immediate action)

**Components**:
- **Deviation**: Distance from smoothed baseline (weight: 0.4)
- **Periodic Spikes**: FFT-detected recurring patterns (weight: 0.3)
- **Complexity**: HFD-measured irregularity (weight: 0.3)

**Context**: Always includes:
- Data sufficiency level
- Time window (start/end timestamps)
- Confidence regime
- Deterministic flag

**Example**: "Anomaly score 0.85 detected in sales data (optimal sufficiency, high confidence, 7-day window)."

---

### Confidence

**Definition**: The system's degree of certainty in its analytical conclusions, derived from signal quality assessment and data sufficiency.

**NOT**: Statistical confidence interval (though related).

**Measurement**: Confidence score (0-1 scale) or regime classification

**Regimes**:
1. **High Confidence** (≥0.8):
   - Normal, organic data
   - No degenerate patterns detected
   - Sufficient data points (≥300)
   - Analytics are reliable

2. **Medium Confidence** (0.5-0.8):
   - Some irregularities detected
   - Adequate data points (100-299)
   - Still usable with caveats

3. **Low Confidence** (0.3-0.5):
   - Significant signal quality issues
   - Minimal data points (50-99)
   - Use with caution

4. **Degenerate** (<0.3):
   - Severe pattern anomalies
   - Insufficient data (<50)
   - Unsuitable for reliable analytics

**Factors Affecting Confidence**:
- Data sufficiency level
- Presence of degenerate patterns
- Signal quality score
- Time window stability

**Example**: "Prediction has medium confidence (0.65) due to adequate but not optimal data sufficiency."

---

### Data Sufficiency

**Definition**: The quantity and quality of data available for analysis, measured against tier-specific thresholds.

**NOT**: Data completeness or accuracy (those are separate concerns).

**Measurement**: Classification into four levels based on event count

**Levels**:
1. **Insufficient** (<50 events):
   - Not enough data for basic analysis
   - Results highly unreliable
   - Auto-expire insights in 1 hour
   - Message: "Need X more events for basic analysis"

2. **Minimal** (50-99 events):
   - Basic analysis possible
   - Reduced accuracy expected
   - Auto-expire insights in 24 hours
   - Message: "Limited data. Predictions have reduced accuracy"

3. **Adequate** (100-299 events):
   - Good quality analysis
   - Reasonable reliability
   - Auto-expire insights in 7 days
   - Message: "Good quality analysis"

4. **Optimal** (≥300 events):
   - Excellent data quality
   - High reliability
   - Auto-expire insights in 30 days
   - Message: "Excellent data quality for analysis"

**Context**: Always displayed alongside confidence and anomaly scores.

**Example**: "Data sufficiency: Adequate (247 events). 53 more recommended for optimal analysis."

---

### Determinism

**Definition**: The guarantee that identical inputs produce identical outputs across all executions, environments, and time periods.

**NOT**: Predictability of future events (that's forecasting).

**Enforcement**:
- No random number generation
- Versioned, immutable algorithms
- Fixed-point arithmetic where applicable
- Explicit timestamps for all computations

**Verification**:
- Every response includes `deterministic: true` flag
- `computedAt` timestamp for reproducibility
- Configuration snapshots for exact replication

**Example**: "Running anomaly detection on the same 1000 events will always produce score 0.73, regardless of when or where computed."

---

## Signal Quality Terms

### Degenerate Pattern

**Definition**: A data pattern that indicates unusable or unreliable signal quality, treated as information about data quality rather than an error.

**Types**:
1. **Constant Zero** (>95% zeros):
   - Indicates no real activity
   - Severity: Severe
   - Impact: Analytics unreliable

2. **Perfect Periodicity** (>99% regular):
   - Likely bot or automated traffic
   - Severity: Severe
   - Impact: Results don't reflect organic behavior

3. **Impossible Regularity** (variance too low):
   - Unnatural distribution
   - Severity: Moderate
   - Impact: Confidence reduced

4. **Bot Signature** (timestamp clustering <1ms):
   - Automated behavior detected
   - Severity: Moderate
   - Impact: May not reflect organic activity

5. **Synthetic Data** (single value >90%):
   - Artificially generated data
   - Severity: Moderate
   - Impact: Distribution unnatural

**Treatment**: Flag as signal quality issue, reduce confidence, provide context. Do NOT reject or error.

---

### Signal Quality Score

**Definition**: A composite metric (0-1 scale) assessing the reliability of input data for analytics.

**Calculation**:
```
quality_score = 1.0
  - (0.5 if constant_zero)
  - (0.3 if perfect_periodicity)
  - (0.2 if impossible_regularity)
  - (0.2 if bot_signature)
```

**Interpretation**:
- 1.0: Perfect signal quality
- 0.8-1.0: High quality (reliable)
- 0.5-0.8: Medium quality (usable)
- 0.3-0.5: Low quality (caution)
- 0.0-0.3: Degenerate (unreliable)

**Usage**: Determines confidence regime and auto-expiry rules.

---

### Systemic Anomaly

**Definition**: A system-level issue affecting infrastructure or operations, tracked separately from seller analytics.

**NOT**: A seller behavior anomaly (those are analytics insights).

**Types**:
1. **Schema Change**: Database structure modified
2. **Timestamp Drift**: Clock skew >1 minute
3. **Ingestion Burst**: Traffic spike >10x baseline
4. **Rate Limit Breach**: API limits exceeded
5. **Cache Thrashing**: >100 invalidations/minute
6. **Computation Timeout**: Analytics failed to complete

**Severity Levels**:
- **Info**: Informational, no action needed
- **Warning**: Potential issue, monitor
- **Critical**: Immediate attention required

**Separation**: Tracked in `systemic_anomalies` table, NOT in seller analytics.

---

## Temporal Concepts

### Time Window

**Definition**: The specific time range (start and end timestamps) used for analysis.

**Format**: ISO 8601 timestamps (UTC)
- `timeWindowStart`: Earliest event included
- `timeWindowEnd`: Latest event included

**Purpose**:
- Reproducibility: Same window = same results
- Transparency: Users know exactly what data was analyzed
- Auditability: Historical queries use historical windows

**Example**: "Analysis covers time window 2026-01-13T00:00:00Z to 2026-01-20T00:00:00Z (7 days)."

---

### Temporal Locality

**Definition**: The principle that recently computed metrics are likely still valid and should be cached with explicit timestamps.

**Implementation**:
- `lastComputedAt`: Timestamp of last computation
- `computation_count`: Number of times computed
- Probabilistic refresh based on staleness

**Purpose**: Avoid silent recomputations while maintaining freshness.

---

### Effective Since / Until

**Definition**: Timestamps indicating when a configuration version is/was active.

**Usage**:
- `effective_since`: When this version became active
- `effective_until`: When this version was superseded (NULL if current)

**Purpose**: Point-in-time configuration queries and rollback capability.

---

## Analytics Metrics

### Health Score

**Definition**: A composite metric (0-1 scale) assessing overall seller performance and data quality.

**Components**:
- **Volatility** (weight: 0.25): Stability of metrics
- **Anomaly Frequency** (weight: 0.35): How often anomalies occur
- **Predictive Risk** (weight: 0.25): Likelihood of future issues
- **Data Consistency** (weight: 0.15): Signal quality over time

**Interpretation**:
- 0.8-1.0: Excellent health
- 0.6-0.8: Good health (minor optimizations possible)
- 0.4-0.6: Moderate health (monitor closely)
- 0.0-0.4: Poor health (immediate action required)

---

### Prediction Confidence

**Definition**: The system's certainty in forecast accuracy, based on model fit and data sufficiency.

**Factors**:
- Historical prediction accuracy
- Data sufficiency level
- Signal quality score
- Time horizon (shorter = higher confidence)

**Interpretation**:
- >0.7: High confidence (reliable forecast)
- 0.5-0.7: Moderate confidence (reasonable reliability)
- <0.5: Low confidence (use with caution)

---

## Lifecycle States

### Insight States

**Definition**: Formal states in the insight lifecycle state machine.

**States**:
1. **Generated**: Initial creation, awaiting review
2. **Confirmed**: User acknowledged and validated
3. **Expired**: No longer relevant (auto-expired)
4. **Superseded**: Replaced by newer insight

**Transitions**:
- Generated → Confirmed, Expired, Superseded
- Confirmed → Expired, Superseded
- Expired/Superseded → Terminal (no further transitions)

---

## Encryption & Security

### At Rest Encryption

**Definition**: Data encrypted while stored on disk or in database.

**Algorithm**: AES-256-GCM
**Key Rotation**: 90 days
**Scope**: Event values, config data, exports, reports

---

### In Transit Encryption

**Definition**: Data encrypted during network transmission.

**Protocol**: TLS 1.3
**Scope**: All API traffic, webhooks, database connections
**Exceptions**: None (TLS everywhere)

---

### Key Material

**Definition**: Cryptographic keys, API keys, secrets, and tokens.

**Algorithm**: AES-256-GCM (for storage)
**Key Rotation**: 30 days
**Properties**: Rotatable, scoped, revocable

---

## Glossary Maintenance

This glossary is a living document. Terms may be added, refined, or deprecated as the system evolves.

**Change Process**:
1. Propose term addition/modification
2. Review for consistency with System Constitution
3. Update glossary with version increment
4. Announce changes to users

**Version History**:
- v1.0 (2026-01-20): Initial publication

---

**Questions?** Contact documentation@analytics-api.example.com
