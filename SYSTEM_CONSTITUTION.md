# System Constitution
## E-commerce Seller Analytics API

**Version 1.0 | Effective Date: 2026-01-20**

---

## Preamble

This Constitution establishes the foundational principles, guarantees, and constraints governing the E-commerce Seller Analytics API. It serves as the supreme authority for all system behavior, design decisions, and operational policies. Any implementation, configuration, or practice that conflicts with this Constitution is invalid.

---

## Article I: Core Principles

### Section 1.1: Determinism Guarantee
The system SHALL produce identical outputs for identical inputs across all executions, environments, and time periods. No randomness, no silent variations, no hidden state dependencies.

**Enforcement**: All analytics algorithms are versioned, immutable, and free of random number generation. Every computation includes a `deterministic: true` flag and `computedAt` timestamp.

### Section 1.2: Transparency Mandate
All system behavior SHALL be observable, traceable, and auditable. No silent recomputations, no hidden thresholds, no magic numbers.

**Enforcement**: Configuration stored in database tables, all changes versioned with effective timestamps, all computations logged with temporal locality markers (`lastComputedAt`).

### Section 1.3: Data Minimization
The system SHALL collect, process, and retain only data necessary for analytics. No PII, no indefinite storage, no raw event exposure.

**Enforcement**: Opaque seller IDs (UUIDs), behavioral signals only (type/value/timestamp), aggregation-first analytics, tier-based automatic expiry.

---

## Article II: System Invariants

### Section 2.1: Hard Invariants (Never Violable)

1. **Same Input → Same Output**: Deterministic computation guarantee
2. **No PII in Analytics Paths**: Names, emails, addresses forbidden
3. **Opaque Identifiers Only**: UUIDs for sellers, never sequential integers
4. **Explicit Expiry Required**: All data has `expires_at` timestamp
5. **Single Primary Trigger**: Each alert type has exactly one trigger condition
6. **Data Sufficiency Required**: All alerts include data quality level
7. **No Hidden Thresholds**: All thresholds in `threshold_config` table
8. **Encryption at Rest**: Sensitive data encrypted with AES-256-GCM
9. **TLS Everywhere**: All network traffic encrypted, no exceptions
10. **Behavioral Signals Only**: Event payloads stripped to type/value/timestamp

### Section 2.2: Soft Invariants (Strongly Recommended)

1. **Aggregation First**: Compute on aggregates, not individual events
2. **Lazy Evaluation**: Metrics computed only when queried
3. **Temporal Locality**: Cache with `lastComputedAt` timestamps
4. **Probabilistic Refresh**: Recompute based on staleness, not schedule

---

## Article III: Signal Quality Philosophy

### Section 3.1: Edge Cases as Signals
Edge cases are NOT errors or bugs. They are low-confidence signal regimes indicating data quality issues.

**Examples**:
- Constant zero values → Degenerate signal (no real activity)
- Perfect periodicity → Bot signature (automated traffic)
- Impossible regularity → Synthetic data (unnatural distribution)

**Treatment**: Flag as signal quality issue, reduce confidence, provide context. Do NOT reject, error, or hide.

### Section 3.2: Systemic vs. Seller Anomalies
System health issues SHALL NOT pollute seller analytics.

**Systemic Anomalies** (system health):
- Schema changes
- Timestamp drift
- Ingestion bursts
- Cache thrashing

**Seller Anomalies** (analytics):
- Sales spikes
- Click patterns
- Behavior changes

**Separation**: Tracked in separate tables, different severity levels, distinct resolution workflows.

---

## Article IV: Privacy & Security

### Section 4.1: Encryption Requirements

**At Rest** (AES-256-GCM, 90-day rotation):
- Event values
- Configuration data
- Export files
- API usage logs

**In Transit** (TLS 1.3, no exceptions):
- All API traffic
- Widget embeds
- Webhooks
- Database connections

**Key Material** (AES-256-GCM, 30-day rotation):
- API keys (rotatable, scoped, revocable)
- Embed tokens
- Webhook secrets

**NOT Encrypted** (performance optimization):
- Derived analytics (anomaly scores, health scores)
- Aggregated metrics
- Public configuration

### Section 4.2: Data Retention
Retention periods determined by pricing tier. Automatic expiry enforced by database triggers.

| Tier | Events | Cache | Insights | Exports |
|------|--------|-------|----------|---------|
| Free | 7 days | 1 day | 7 days | 1 day |
| Basic | 30 days | 7 days | 30 days | 7 days |
| Pro | 90 days | 30 days | 90 days | 30 days |
| Enterprise | 365 days | 90 days | 365 days | 90 days |

**No Indefinite Storage**: Even enterprise tier has limits.

---

## Article V: Configuration Governance

### Section 5.1: Auditability
All configuration changes SHALL be versioned with:
- `effective_since` and `effective_until` timestamps
- `changed_by` attribution
- `change_reason` documentation
- Full configuration snapshot

### Section 5.2: Reproducibility
Every report, export, and analysis SHALL reference the exact configuration that generated it via config snapshots.

### Section 5.3: Rollback Capability
Any configuration can be rolled back to any previous version by setting a new version with historical `config_data`.

---

## Article VI: Alert Simplification

### Section 6.1: Single Primary Trigger
Each alert type has exactly ONE primary trigger condition. Other metrics are context, not multi-dimensional triggers.

**Valid**:
- Anomaly alert triggered by `anomaly_score > 0.8`
- Health alert triggered by `health_score < 0.4`

**Invalid**:
- Alert triggered by `anomaly_score > 0.8 AND trend_acceleration > 5 AND fingerprint_match`

### Section 6.2: Data Sufficiency Requirement
All alerts MUST include data sufficiency level. Alerts on insufficient data are flagged as low-confidence.

---

## Article VII: Insight Lifecycle

### Section 7.1: Formal States
Insights follow a formal state machine:

1. **Generated**: Initial creation
2. **Confirmed**: User acknowledged
3. **Expired**: No longer relevant (auto-expiry based on data sufficiency)
4. **Superseded**: Replaced by newer insight

### Section 7.2: Auto-Expiry Rules
- Insufficient data: 1 hour
- Minimal data: 24 hours
- Adequate data: 7 days
- Optimal data: 30 days

---

## Article VIII: Embed Widget Guardrails

### Section 8.1: Rate Limiting
Embed keys have tier-based rate limits:
- Free: 100 requests/hour
- Basic: 1,000 requests/hour
- Pro: 10,000 requests/hour
- Enterprise: Unlimited

### Section 8.2: Branding Requirements
- Free/Basic: "Powered by Analytics API" watermark required
- Pro/Enterprise: Custom branding allowed

### Section 8.3: Default Scopes
Embed keys are read-only by default. Write/admin scopes require explicit grant.

---

## Article IX: Amendment Process

This Constitution may be amended only through:
1. Formal proposal with rationale
2. Impact analysis on existing guarantees
3. Migration plan for affected systems
4. Version increment and effective date

**Backward Compatibility**: Amendments SHALL NOT break existing guarantees without explicit deprecation period.

---

## Article X: Supremacy Clause

This Constitution is the supreme authority. Any code, configuration, or practice that conflicts with this Constitution is invalid and must be corrected.

**Precedence Order**:
1. System Constitution (this document)
2. System Invariants (codified in database)
3. Configuration tables (tier_config, alert_config, threshold_config)
4. Implementation code

---

**Signed**: E-commerce Analytics API System
**Date**: 2026-01-20
**Version**: 1.0
