# E-commerce Seller Analytics API Requirements Document

## 1. Application Overview

### 1.1 Application Name
E-commerce Seller Analytics API

### 1.2 Application Description
A lightweight, high-performance analytics API system designed for e-commerce sellers. The system provides real-time anomaly detection (sales/click spikes, bot detection), short-term trend prediction (traffic/sales forecasting), and efficient scalable backend architecture leveraging DSP techniques (FIR, FFT, HFD) and probabilistic caching. Enhanced with auto-insights engine, predictive alerts, seller health scoring, behavior fingerprinting capabilities, deterministic reproducibility, data sufficiency indicators, rate-limit visibility, decision hooks, weekly health reports, alert-driven pricing tiers, dedicated anomaly/prediction endpoints, opinionated tier defaults, insight summaries, one-click export functionality, embeddable components, confidence/sufficiency aware messaging, auditable configuration management, formalized insight lifecycle, embeddable guardrails, codified system invariants, data minimization enforcement, aggregation-first analytics, tier-based retention policies, edge case detection as signal quality indicators, and comprehensive encryption strategy.

## 2. Core Features

### 2.1 Event Ingestion
- **Endpoint**: POST /events
- **Functionality**: Accept and process seller event data in real-time
- **Payload Structure**:
  - sellerId: Seller identifier (opaque/surrogate key only)
  - timestamp: Event timestamp (milliseconds)\n  - type: Event type (SALE / CLICK / VIEW)\n  - value: Event value (behavioral signal only, no PII)
- **Processing Logic**: Add events to preallocated fixed-size ring buffer (contiguous array), with separate buffers per seller per metric. Use index modulo window size for circular access. No per-event reallocation or object churn.
- **Data Minimization**: Strip all PII (names, emails, addresses) from event payloads, retain only behavioral signals.\n\n### 2.2 Batch Ingestion
- **Endpoint**: POST /events/batch
- **Functionality**: Accept bulk event data for high-throughput sellers
- **Payload Structure**: Array of event objects (PII-stripped)\n- **Processing Logic**: Efficiently process multiple events in a single request to reduce overhead, using same ring buffer mechanism\n\n### 2.3 Ring Buffer Management
- Preallocated fixed-size contiguous array (window size defined in centralized config)
- Index modulo window size for circular access\n- Zero reallocation per event\n- No per-event object churn
- Support for real-time FIR, FFT, and HFD computations
- **Clear Time-Window Definitions**: Expose time-window parameters (start timestamp, end timestamp, window size) in API responses and UI\n
### 2.4 DSP Analytics Pipeline
- **FIR Smoothing**: Smooth time series data\n- **FFT Analysis**: Detect periodic spikes in sales/clicks, identify recurring bot patterns or hourly spikes
- **HFD (Higuchi Fractal Dimension)**: Measure time series complexity/irregularity, high HFD values indicate possible bot activity or anomalous behavior
- **Bayesian/Probabilistic Scoring**: Combine smoothed deviation, FFT spikes, and HFD to output anomaly score (0-1 range)
- **Deterministic Anomaly Reproducibility**: Ensure same inputs always produce same outputs by fixing random seeds, deterministic sorting, and consistent computation order
- **Aggregation-First**: All analytics operate on aggregated data, never on raw individual events

### 2.5 Probabilistic Caching with Temporal Locality
- Per-seller hot metric caching\n- **lastComputedAt** timestamp tracking for each cached metric
- Probabilistic refresh only when queried (not on every event)
- Adaptive TTL strategy defined in centralized config:\n  - Hot sellers: recompute based on config TTL
  - Cold sellers: recompute based on config TTL
- Short-term caching layer to reduce repeated function calls
- Ensure system scalability under high load

### 2.6 Anomaly Detection API
- **Endpoint**: GET /metrics/:seller/anomalies
- **Functionality**: Return seller anomaly score and attribution breakdown
- **Response Format**:
  - anomalyScore: Overall anomaly score (0-1)\n  - attribution: Root cause breakdown (FFT spike contribution, HFD complexity contribution, trend deviation)\n  - timeWindow: Clear time-window definition (startTimestamp, endTimestamp, windowSize)
  - dataSufficiency: Data sufficiency indicator (sufficient/insufficient, minimum data points required, current data points available)
  - reproducibilityHash: Hash value for deterministic verification
  - confidenceMessage: Confidence and sufficiency aware messaging explaining result reliability
  - configVersion: Configuration version used for this computation
  - signalQuality: Signal quality assessment (degenerate patterns, edge case flags)
\n### 2.7 Prediction API
- **Endpoint**: GET /metrics/:seller/predictions
- **Functionality**: Return predicted sales/traffic time series data with confidence bands
- **Response Format**:\n  - predictions: Array of predicted values with timestamps
  - confidenceBands: ± confidence intervals around predictions
  - historicalCutoff: Timestamp marking where history ends and prediction begins
  - timeWindow: Clear time-window definition\n  - dataSufficiency: Data sufficiency indicator
  - reproducibilityHash: Hash value for deterministic verification
  - confidenceMessage: Confidence and sufficiency aware messaging explaining prediction reliability
  - configVersion: Configuration version used for this computation
  - signalQuality: Signal quality assessment

### 2.8 Auto-Insights Engine with Summaries and Lifecycle Management
- **Functionality**: Generate lightweight insights based on rule and probability analysis
- **Input Signals**:
  - Anomaly score\n  - FFT periodicity
  - HFD complexity
  - Recent trend slope
- **Output**: Human-readable insight summaries explaining detected patterns and potential issues
- **Insight Summaries**: Concise, actionable summaries for quick understanding
- **Insight Lifecycle States**:
  - Generated: Newly created insight
  - Confirmed: Insight validated by subsequent data or user action
  - Expired: Insight no longer relevant due to time passage
  - Superseded: Insight replaced by newer, more accurate insight
- **State Transitions**: Automatic state management based on time, data updates, and user feedback
- **Endpoint**: GET /insights/:seller/lifecycle to query insight states
\n### 2.9 Anomaly Attribution (Root Cause Breakdown)
- **Functionality**: Explain anomaly score composition\n- **Components**:
  - FFT spike contribution percentage
  - HFD complexity contribution percentage
  - Trend deviation contribution percentage
  - Smoothed deviation contribution percentage
\n### 2.10 Predictive Alerts with Single Primary Trigger
- **Functionality**: Proactive alert system based on primary trigger with contextual information
- **Primary Trigger**: Anomaly score threshold (defined in centralized config)
- **Contextual Information**: Trend, attribution, fingerprint, time window provided as context, not as additional triggers
- **Alert Levels**: Defined by config tables (data-driven), not conditionals
- **Alert Types**: Potential spike warning, declining trend alert, pattern shift notification
- **System Invariant**: All alerts must reference data sufficiency status
\n### 2.11 Seller Health Score (Composite Index)
- **Endpoint**: GET /metrics/:seller/health
- **Functionality**: Calculate comprehensive seller health score\n- **Scoring Factors**:
  - Volatility level
  - Anomaly frequency
  - Predictive risk assessment
  - Data consistency metrics
- **Response Format**: { healthScore: 0-100, breakdown: {...}, timeWindow: {...}, dataSufficiency: {...}, confidenceMessage: \"...\", configVersion: \"...\", signalQuality: {...} }

### 2.12 Behavior Fingerprinting
- **Functionality**: Identify and track seller behavior patterns
- **Analysis Methods**:
  - FFT + HFD + timing entropy combination
- **Detection Capabilities**:
  - Bot clusters identification
  - Repeated manipulation patterns
  - Sudden strategy changes
- **Output**: Behavior fingerprint signature and pattern classification
- **Data Minimization**: Fingerprints based on aggregated behavioral signals only, no PII

### 2.13 Smart Sampling & Adaptive Resolution
- **Functionality**: Automatically adjust analytics computation cost based on seller activity
- **Adaptive Logic** (defined in centralized config):\n  - High-activity sellers: Full resolution analysis
  - Medium-activity sellers: Moderate sampling
  - Low-activity sellers: Reduced sampling frequency
- **Benefit**: Optimize system resources while maintaining accuracy

### 2.14 Real-time Dashboard Integration
- **Technology**: Supabase Realtime integration\n- **Functionality**: Live dashboard updates with AnomalyAlert component
- **Features**:
  - Real-time anomaly notifications
  - Live metric updates
  - Event log display with pagination/infinite scrolling
  - **Time-Window Display**: Show clear time-window definitions in UI (start time, end time, window size)
  - **Data Sufficiency Indicators**: Display explicit data sufficiency status (sufficient/insufficient, progress bar showing current vs required data points)
  - **Rate-Limit & Backpressure Visibility**: Show current rate-limit status, remaining quota, backpressure indicators, and queue depth
  - **Confidence & Sufficiency Aware Messaging**: Display contextual messages explaining result reliability based on data quality
  - **Insight Lifecycle Display**: Show insight states (Generated, Confirmed, Expired, Superseded) with visual indicators
  - **Signal Quality Indicators**: Display edge case flags and degenerate pattern warnings
\n### 2.15 Event Log Management
- **Functionality**: Display and manage event logs on dashboard
- **Features**:
  - Pagination support
  - Infinite scrolling capability
  - Efficient data loading for large event volumes
- **Data Minimization**: Display only aggregated behavioral signals, no PII
\n### 2.16 Decision Hooks
- **Functionality**: Provide extensible decision hooks for custom business logic integration
- **Hook Points**:
  - Pre-anomaly detection hook: Execute custom logic before anomaly detection
  - Post-anomaly detection hook: Execute custom logic after anomaly detection\n  - Pre-prediction hook: Execute custom logic before prediction generation
  - Post-prediction hook: Execute custom logic after prediction generation\n  - Alert trigger hook: Execute custom logic when alerts are triggered
- **Use Cases**: Custom notification routing, third-party integration, business rule enforcement, audit logging

### 2.17 Weekly Seller Health Reports
- **Functionality**: Generate and deliver automated weekly health reports for sellers
- **Report Content**:
  - Weekly health score summary
  - Anomaly frequency and severity breakdown
  - Trend analysis and predictions
  - Behavior pattern insights
  - Actionable recommendations
  - Insight summaries for quick understanding
  - Insight lifecycle status summary
  - Signal quality assessment summary
- **Delivery Methods**: Email, dashboard notification, API endpoint for retrieval
- **Endpoint**: GET /reports/:seller/weekly
- **Config Snapshot**: Each report includes snapshot of configuration version used for generation

### 2.18 Alert-Driven Pricing Tiers with Opinionated Defaults
- **Functionality**: Dynamic pricing tier system based on alert frequency and severity
- **Tier Structure**: Data-driven tier definitions (not logic-based)
- **Opinionated Defaults Per Tier**:
  - Basic Tier: Standard features, default alert thresholds, basic insights, light branding watermark on embeddables
  - Premium Tier: Enhanced features, lower alert thresholds, detailed insights, faster response, reduced branding on embeddables
  - Enterprise Tier: Full feature access, custom alert thresholds, comprehensive insights, dedicated support, no branding on embeddables
- **Pricing Factors** (defined in centralized config):\n  - Number of alerts triggered per month
  - Anomaly severity levels
  - Prediction accuracy requirements
  - Real-time processing needs
- **Endpoint**: GET /pricing/:seller/tier

### 2.19 Dedicated Anomaly Endpoint
- **Endpoint**: POST /sell/anomaly
- **Functionality**: Dedicated endpoint for selling/exposing anomaly detection results to external systems
- **Payload Structure**:
  - sellerId: Seller identifier (opaque/surrogate key)\n  - timeRange: Time range for anomaly detection\n  - includeAttribution: Boolean flag to include root cause breakdown
- **Response Format**:
  - anomalyScore: Overall anomaly score\n  - attribution: Root cause breakdown
  - timeWindow: Time-window definition
  - dataSufficiency: Data sufficiency indicator\n  - reproducibilityHash: Hash value for verification
  - confidenceMessage: Confidence and sufficiency aware messaging\n  - configVersion: Configuration version used
  - signalQuality: Signal quality assessment

### 2.20 Dedicated Prediction Endpoint
- **Endpoint**: POST /sell/prediction
- **Functionality**: Dedicated endpoint for selling/exposing prediction results to external systems
- **Payload Structure**:
  - sellerId: Seller identifier (opaque/surrogate key)
  - predictionHorizon: Number of time steps to predict
  - includeConfidenceBands: Boolean flag to include confidence intervals
- **Response Format**:\n  - predictions: Array of predicted values with timestamps
  - confidenceBands: ± confidence intervals\n  - historicalCutoff: Timestamp marking history/prediction boundary
  - timeWindow: Time-window definition
  - dataSufficiency: Data sufficiency indicator
  - reproducibilityHash: Hash value for verification
  - confidenceMessage: Confidence and sufficiency aware messaging
  - configVersion: Configuration version used
  - signalQuality: Signal quality assessment

### 2.21 One-Click Export Functionality
- **Functionality**: Export reports, insights, and analytics data with one click
- **Export Formats**: PDF, Email\n- **Export Content**:
  - Anomaly reports
  - Prediction reports
  - Health score reports
  - Weekly health reports
  - Insight summaries
  - Configuration snapshot used for report generation
- **Endpoints**:
  - POST /export/pdf: Generate and download PDF report
  - POST /export/email: Send report via email
\n### 2.22 Embeddable Components with Guardrails
- **Functionality**: Provide embeddable UI components for integration into external dashboards or applications
- **Components**:\n  - Anomaly chart widget
  - Prediction chart widget
  - Health score widget\n  - Alert notification widget
  - Event log widget
- **Integration**: JavaScript SDK or iframe-based embedding
- **Customization**: Support for theme customization and configuration options
- **Soft Guardrails**:
  - Rate-limit per embed key (defined in centralized config per tier)
  - Light branding watermark for free/basic tiers
  - Read-only scopes by default (no write access unless explicitly granted)
  - Embed key authentication required\n
### 2.23 Auditable Configuration Management
- **Functionality**: Track and audit all configuration changes\n- **Features**:
  - Version control for config tables
  - \"Effective since\" timestamps for each config change
  - Config snapshot storage with reports
  - Config change audit log
  - Rollback capability to previous config versions
- **Endpoints**:
  - GET /config/versions: List all config versions
  - GET /config/version/:id: Retrieve specific config version
  - GET /config/audit: Retrieve config change audit log
  - POST /config/rollback/:id: Rollback to specific config version

### 2.24 Edge Case Detection as Signal Quality\n- **Functionality**: Detect and flag edge cases as low-confidence signal regimes, not errors
- **Degenerate Behavior Patterns**:
  - Constant zero values: Flag as low-signal regime
  - Perfect periodicity: Flag as potential bot activity signal
  - Impossible regularity: Flag as anomalous signal pattern
- **Treatment**: Edge cases are signals, not bugs. They indicate low-confidence regimes and should be surfaced as signal quality indicators
- **Output**: Signal quality score and edge case flags included in all analytics responses
- **Integration**: Signal quality indicators displayed in dashboard and included in API responses

### 2.25 Systemic Anomaly Detection
- **Functionality**: Detect and flag systemic issues separate from seller analytics
- **Systemic Anomaly Types**:
  - Sudden schema changes: Detect unexpected data structure changes
  - Timestamp drift: Identify clock synchronization issues
  - Ingestion bursts: Detect unusual data ingestion patterns
- **Treatment**: Flag system health issues without polluting seller analytics
- **Output**: Separate system health metrics and alerts
- **Endpoint**: GET /system/health to query systemic anomaly status
- **Dashboard Integration**: System health panel separate from seller analytics

## 3. Technical Architecture

### 3.1 Data Processing\n- Preallocated fixed-size contiguous ring buffer for real-time data storage
- Index modulo window size for circular access\n- Zero reallocation per event, no per-event object churn\n- Streaming analytics processing\n- DSP algorithm integration (FIR, FFT, HFD)
- Batch processing support for high-throughput scenarios
- Deterministic computation pipeline with fixed random seeds and consistent ordering
- **Aggregation-First**: All analytics operate on aggregated data, never on raw individual events

### 3.2 Caching Strategy with Temporal Locality
- Probabilistic caching mechanism\n- **lastComputedAt** timestamp tracking\n- Probabilistic refresh only when queried\n- Dynamic TTL adjustment (defined in centralized config)
- Hot/cold data differentiation
- Short-term caching layer for frequently accessed computations
\n### 3.3 API Design
- RESTful API architecture\n- Real-time event ingestion
- Batch ingestion endpoint
- On-demand metric query
- Type-safe implementation (no any casts)
- Dedicated sell endpoints for anomaly and prediction results
- Decision hook integration points
- One-click export endpoints
- Auditable configuration endpoints
- System health endpoints

### 3.4 Dashboard Components
- Mode toggle functionality (light/dark theme)
- Time-series chart with proper timestamp handling:\n  - Numeric timestamps internally
  - Formatted display in tooltips and axis ticks
  - Clear visual separation between historical and predicted data
  - Non-overlapping labels for multi-day data spans
- Confidence band visualization (± band around predictions)
- Real-time alert notifications
- Event log with pagination/infinite scrolling
- **Time-Window Display Panel**: Show start time, end time, window size for current analysis
- **Data Sufficiency Indicators**: Visual indicators (progress bars, status badges) showing data completeness
- **Rate-Limit & Backpressure Dashboard**: Display current rate-limit status, remaining quota, backpressure metrics, queue depth visualization
- **Confidence & Sufficiency Aware Messaging**: Contextual messages explaining result reliability\n- **Embeddable Component Support**: Integration of embeddable widgets\n- **Insight Lifecycle Visualization**: Display insight states with visual indicators and state transition history
- **Config Version Display**: Show current config version in use
- **Signal Quality Indicators**: Display edge case flags and degenerate pattern warnings
- **System Health Panel**: Separate panel for systemic anomaly monitoring

### 3.5 Real-time Integration
- Supabase Realtime for live data streaming
- WebSocket connections for dashboard updates
- AnomalyAlert component integration
\n### 3.6 Reporting & Pricing System
- Automated weekly report generation engine
- Alert-driven pricing tier calculation logic (data-driven, not logic-based)
- Report delivery system (email, notification, API)\n- Pricing tier API endpoints
- One-click export functionality integration
- Config snapshot storage with each report
\n### 3.7 Deterministic Reproducibility System
- Fixed random seed management
- Deterministic sorting and computation order
- Reproducibility hash generation for verification
- Input/output logging for audit trails
- **System Invariant**: Determinism guarantee - same inputs always produce same outputs
\n### 3.8 Centralized Configuration System
- **Centralized Config Store**: Single source of truth for all system parameters
- **Config Parameters**:
  - Window sizes (ring buffer size, analysis window size)
  - Thresholds (anomaly score threshold, confidence cutoffs, signal quality thresholds)
  - TTLs (hot seller TTL, cold seller TTL, cache TTL)
  - Tier limits (alert frequency limits per tier, feature access per tier)
  - Confidence cutoffs (minimum confidence for predictions, minimum data sufficiency)
  - Alert levels (defined by config tables, not conditionals)
  - Sampling rates (high/medium/low activity sampling rates)
  - Embed rate-limits per tier
  - Retention policies per tier
  - Edge case detection thresholds
- **Dynamic Expressions**: Use dynamic expressions where applicable, avoid magic numbers
- **Data-Driven Design**: Alert levels, tiers, thresholds all defined by config data, not hardcoded logic
- **Versioning**: All config changes versioned with timestamps
- **Audit Trail**: Complete audit log of config changes\n
### 3.9 Modular and Composable Architecture
- **Composability Focus**: Design for composability, not reuse
- **Modular Components**: Separate modules for DSP, caching, alerting, reporting, export, embedding, config management, insight lifecycle, edge case detection, systemic anomaly detection
- **Concise Refactoring**: Eliminate redundancy, centralize common logic
- **Zero Magic Numbers**: All constants defined in centralized config
\n### 3.10 Data Minimization and Privacy Architecture
- **Hard Invariant**: No names, emails, addresses in analytics paths
- **Seller IDs**: Always opaque/surrogate keys, never direct identifiers
- **Event Payloads**: Stripped to behavioral signals only, no PII
- **Aggregation-First**: All analytics operate on aggregated data
- **Data Minimization Enforcement**: Automated checks to prevent PII leakage
\n### 3.11 Retention Policy System
- **Tier-Based Retention**: Retention periods defined per pricing tier in centralized config
- **Explicit Expiry Windows**: Clear expiry timestamps for all data
- **Automatic Decay**: Automated data deletion based on retention policies
- **Retention Tiers**:
  - Basic Tier: 30-day retention
  - Premium Tier: 90-day retention
  - Enterprise Tier: 365-day retention (customizable)
- **Policy Enforcement**: Retention as policy, not configuration - enforced at system level
\n### 3.12 System Invariants (Codified)
- **Determinism Guarantee**: Same inputs always produce same outputs
- **No Silent Recomputation**: All recomputations logged and auditable
- **No Hidden Thresholds**: All thresholds defined in centralized config
- **All Alerts Reference Data Sufficiency**: Every alert must include data sufficiency status
- **Data Minimization**: No PII in analytics paths, seller IDs always opaque, event payloads stripped to behavioral signals only
- **Aggregation-First**: All analytics operate on aggregated data, never on raw individual events
- **Edge Cases as Signals**: Edge cases treated as low-confidence signal regimes, not errors
- **Systemic Anomalies Separate**: System health issues flagged separately from seller analytics
\n### 3.13 Encryption Strategy
- **At Rest Encryption**:
  - Event storage: Encrypted\n  - Config tables: Encrypted
  - Reports: Encrypted
  - Usage logs: Encrypted
- **In Transit Encryption**:
  - API traffic: TLS everywhere, no exceptions
  - Widget embeds: TLS required\n  - Webhooks: TLS required
- **Secrets & Keys Management**:
  - API keys: Encrypted, rotatable, scoped, revocable
  - Webhook secrets: Encrypted, rotatable, scoped, revocable
  - Embed tokens: Encrypted, rotatable, scoped, revocable
- **Not Encrypted**:
  - Derived analytics: Not encrypted (aggregated, non-sensitive)
  - Aggregated metrics: Not encrypted (aggregated, non-sensitive)
  - Scores: Not encrypted (aggregated, non-sensitive)
- **Key Rotation**: Automated key rotation policies defined in centralized config
- **Access Control**: Role-based access control for encrypted data

## 4. System Characteristics
- Lightweight and elegant design
- High performance and scalability
- Real-time processing capability
- Intelligent caching optimization with temporal locality
- Adaptive resource management
- Comprehensive analytics and insights
- Type-safe implementation
- Enhanced user experience with real-time updates
- Deterministic and reproducible anomaly detection
- Clear time-window definitions and data sufficiency indicators
- Rate-limit and backpressure visibility
- Extensible decision hooks for custom business logic
- Automated weekly health reporting with insight summaries
- Dynamic alert-driven pricing tiers with opinionated defaults
- Dedicated endpoints for selling anomaly and prediction results
- One-click export functionality (PDF/email)
- Embeddable components for external integration with soft guardrails
- Confidence and sufficiency aware messaging throughout
- Data-driven configuration system (no magic numbers, no hardcoded logic)
- Modular and composable architecture
- Efficient data movement with preallocated ring buffers and zero per-event churn
- Single primary trigger for alerts with contextual information
- Auditable configuration management with versioning and snapshots
- Formalized insight lifecycle with state management\n- Data minimization and privacy enforcement as hard invariants
- Aggregation-first analytics approach
- Tier-based retention policies with automatic decay
- Codified system invariants for consistency and reliability
- Edge case detection as signal quality indicators
- Systemic anomaly detection separate from seller analytics
- Comprehensive encryption strategy (at rest, in transit, secrets & keys)
\n## 5. System Constitution

### 5.1 Purpose and Scope
This System Constitution defines the foundational principles, invariants, and governance rules that govern the E-commerce Seller Analytics API. It serves as the authoritative reference for all system design, implementation, and operational decisions. All system components, modules, and behaviors must conform to the principles and invariants articulated herein.

### 5.2 Core Principles

#### 5.2.1 Determinism and Reproducibility
The system guarantees deterministic behavior: identical inputs must always produce identical outputs. This principle ensures auditability, debuggability, and trust. All computations use fixed random seeds, deterministic sorting, and consistent ordering. Reproducibility hashes are generated for all analytics outputs to enable verification.

#### 5.2.2 Data Minimization and Privacy by Design
The system enforces strict data minimization as a hard invariant. No personally identifiable information (PII) such as names, emails, or addresses may enter analytics paths. Seller identifiers are always opaque surrogate keys. Event payloads are stripped to behavioral signals only. All analytics operate on aggregated data, never on raw individual events. This principle is non-negotiable and enforced at the architectural level.

#### 5.2.3 Transparency and Explainability
The system provides full transparency into its decision-making processes. All analytics outputs include clear time-window definitions, data sufficiency indicators, confidence messaging, signal quality assessments, and configuration version references. Users must understand what the system knows, what it does not know, and how confident it is in its outputs.

#### 5.2.4 Configuration as Single Source of Truth
All system parameters, thresholds, and behaviors are defined in a centralized configuration system. No magic numbers or hardcoded logic are permitted. Configuration changes are versioned, timestamped, and auditable. This principle ensures consistency, maintainability, and governance.\n
#### 5.2.5 Composability over Reusability
The system prioritizes composability in its architecture. Modules are designed to be combined and extended, not merely reused. This principle enables flexibility, adaptability, and long-term maintainability.

#### 5.2.6 Edge Cases as Signals, Not Errors
The system treats edge cases (constant zero values, perfect periodicity, impossible regularity) as low-confidence signal regimes, not as errors or bugs. Edge cases are surfaced as signal quality indicators, providing valuable information about data quality and behavioral patterns.

#### 5.2.7 Separation of Concerns: Seller Analytics vs. System Health
Seller analytics and systemic anomalies are strictly separated. System health issues (schema changes, timestamp drift, ingestion bursts) are flagged independently and do not pollute seller-level analytics. This separation ensures clarity and prevents false positives in seller-facing outputs.

### 5.3 System Invariants

The following invariants are codified and enforced at the system level. Violations of these invariants constitute system failures and must be prevented by design:

1. **Determinism Guarantee**: Same inputs always produce same outputs.\n2. **No Silent Recomputation**: All recomputations are logged and auditable.
3. **No Hidden Thresholds**: All thresholds are defined in centralized config.
4. **All Alerts Reference Data Sufficiency**: Every alert must include data sufficiency status.
5. **Data Minimization**: No PII in analytics paths; seller IDs always opaque; event payloads stripped to behavioral signals only.
6. **Aggregation-First**: All analytics operate on aggregated data, never on raw individual events.
7. **Edge Cases as Signals**: Edge cases treated as low-confidence signal regimes, not errors.
8. **Systemic Anomalies Separate**: System health issues flagged separately from seller analytics.
\n### 5.4 Governance and Change Management

All changes to the System Constitution require formal review and approval. Configuration changes are versioned and auditable. System invariants may not be violated under any circumstances. This governance framework ensures stability, trust, and long-term system integrity.

## 6. Public Trust & Security Statement

### 6.1 Our Commitment to Trust and Security

The E-commerce Seller Analytics API is built on a foundation of trust, transparency, and security. We recognize that our users entrust us with sensitive behavioral data, and we take this responsibility seriously. This Public Trust & Security Statement articulates our commitments and the measures we have implemented to protect user data and maintain system integrity.

### 6.2 Data Privacy and Minimization

We enforce strict data minimization as a core architectural principle. No personally identifiable information (PII) such as names, emails, or addresses is collected, stored, or processed in analytics paths. Seller identifiers are always opaque surrogate keys, ensuring anonymity. Event payloads are stripped to behavioral signals only, and all analytics operate on aggregated data. This approach minimizes privacy risks and ensures compliance with data protection regulations.

### 6.3 Encryption and Data Protection

We employ comprehensive encryption strategies to protect data at rest and in transit:\n\n- **At Rest**: Event storage, configuration tables, reports, and usage logs are encrypted using industry-standard encryption algorithms.
- **In Transit**: All API traffic, widget embeds, and webhooks use TLS encryption without exception.
- **Secrets & Keys**: API keys, webhook secrets, and embed tokens are encrypted, rotatable, scoped, and revocable. Automated key rotation policies are enforced.
\nDerived analytics, aggregated metrics, and scores are not encrypted, as they are aggregated and non-sensitive by design.

### 6.4 Determinism and Auditability

We guarantee deterministic behavior: identical inputs always produce identical outputs. This ensures auditability, debuggability, and trust. All computations are logged, and reproducibility hashes are generated for verification. Configuration changes are versioned and auditable, providing a complete audit trail.

### 6.5 Transparency and Explainability

We provide full transparency into our decision-making processes. All analytics outputs include clear time-window definitions, data sufficiency indicators, confidence messaging, signal quality assessments, and configuration version references. Users always know what the system knows, what it does not know, and how confident it is in its outputs.

### 6.6 Retention and Data Lifecycle\n
We enforce tier-based retention policies with explicit expiry windows. Data is automatically deleted based on retention policies, ensuring compliance with data protection regulations and minimizing long-term storage risks. Retention periods are clearly communicated and enforced at the system level.

### 6.7 Security Incident Response

We maintain a formal security incident response plan. In the event of a security incident, we will promptly investigate, mitigate, and communicate with affected users. We are committed to continuous improvement and learning from security incidents.\n
### 6.8 Compliance and Certifications

We are committed to compliance with relevant data protection regulations, including GDPR and CCPA. We continuously monitor regulatory developments and adapt our practices accordingly.\n
### 6.9 Contact and Accountability

For security concerns, questions, or incident reports, users may contact our security team at security@example.com. We are accountable to our users and committed to maintaining their trust.\n
## 7. Signal Semantics Glossary

This glossary defines the precise meanings of key terms used throughout the system. These definitions are authoritative and must be consistently applied across all system components, documentation, and user-facing interfaces.

### 7.1 Anomaly\n
**Definition**: An anomaly is a statistically significant deviation from expected behavioral patterns, quantified as a probabilistic score in the range [0, 1]. An anomaly score of 0 indicates no deviation; a score of 1 indicates maximum deviation.

**Composition**: Anomaly scores are computed using a Bayesian/probabilistic combination of:\n- **FFT Spike Contribution**: Periodic spikes detected via Fast Fourier Transform analysis.\n- **HFD Complexity Contribution**: Time series complexity measured via Higuchi Fractal Dimension.
- **Trend Deviation Contribution**: Deviation from smoothed trend lines.
- **Smoothed Deviation Contribution**: Deviation from FIR-smoothed baseline.

**Interpretation**: Anomalies indicate potential issues such as bot activity, sales spikes, or unusual behavioral patterns. They are signals for investigation, not definitive diagnoses.

**Attribution**: All anomaly outputs include root cause breakdown, showing the percentage contribution of each component to the overall anomaly score.

### 7.2 Confidence

**Definition**: Confidence is a measure of the system's certainty in its outputs, expressed as a qualitative or quantitative indicator. Confidence depends on data sufficiency, signal quality, and computational stability.

**Factors Affecting Confidence**:
- **Data Sufficiency**: Sufficient data points are required for reliable analytics. Insufficient data reduces confidence.
- **Signal Quality**: High signal quality (low noise, no degenerate patterns) increases confidence. Low signal quality (edge cases, degenerate patterns) reduces confidence.
- **Computational Stability**: Deterministic, reproducible computations increase confidence. Non-deterministic or unstable computations reduce confidence.

**Confidence Messaging**: All analytics outputs include confidence-aware messaging, explaining the reliability of results based on data quality and sufficiency.

**Confidence Bands**: Predictions include confidence bands (± intervals) around predicted values, visualizing uncertainty.\n
### 7.3 Sufficiency

**Definition**: Sufficiency is a binary or graduated indicator of whether the system has enough data to produce reliable analytics. Sufficiency is determined by comparing the number of available data points to the minimum required data points for a given analysis.

**Sufficiency Indicators**:
- **Sufficient**: The system has enough data to produce reliable analytics.
- **Insufficient**: The system does not have enough data. Analytics may be unreliable or unavailable.
\n**Sufficiency Thresholds**: Minimum data point requirements are defined in centralized configuration and vary by analysis type (anomaly detection, prediction, health scoring, etc.).

**Sufficiency Messaging**: All analytics outputs include data sufficiency indicators and messaging, explaining whether sufficient data is available and how many data points are required vs. available.

**System Invariant**: All alerts must reference data sufficiency status. Alerts based on insufficient data must be clearly flagged.\n
### 7.4 Signal Quality

**Definition**: Signal quality is an assessment of the reliability and interpretability of input data. High signal quality indicates clean, consistent, and interpretable data. Low signal quality indicates noisy, inconsistent, or degenerate data patterns.

**Signal Quality Indicators**:
- **Degenerate Patterns**: Constant zero values, perfect periodicity, impossible regularity. These patterns are flagged as low-confidence signal regimes.
- **Edge Case Flags**: Indicators of unusual or boundary-case data patterns.\n- **Noise Levels**: Assessment of data noise and variability.
\n**Treatment**: Signal quality indicators are surfaced in all analytics outputs. Low signal quality reduces confidence and is communicated to users via confidence-aware messaging.

**Philosophy**: Edge cases and degenerate patterns are treated as signals, not errors. They provide valuable information about data quality and behavioral patterns.

### 7.5 Time Window

**Definition**: A time window is the temporal range over which analytics are computed. Time windows are defined by a start timestamp, end timestamp, and window size (duration).

**Clarity Requirement**: All analytics outputs must include clear time-window definitions, ensuring users understand the temporal scope of the analysis.

**Ring Buffer Alignment**: Time windows align with the ring buffer structure, ensuring efficient and consistent data access.\n
### 7.6 Reproducibility Hash

**Definition**: A reproducibility hash is a cryptographic hash value generated from the inputs and configuration used to produce an analytics output. It enables deterministic verification: identical inputs and configuration will always produce the same hash.

**Purpose**: Reproducibility hashes ensure auditability and trust. Users can verify that analytics outputs are deterministic and have not been tampered with.
\n**Inclusion**: All analytics outputs include a reproducibility hash.\n
### 7.7 Config Version

**Definition**: A config version is a unique identifier for a specific version of the centralized configuration system. Config versions are timestamped and auditable.
\n**Purpose**: Config versions ensure that analytics outputs can be traced back to the exact configuration used to produce them. This enables reproducibility, auditability, and debugging.

**Inclusion**: All analytics outputs include the config version used for computation.

### 7.8 Insight Lifecycle State

**Definition**: An insight lifecycle state is the current status of an auto-generated insight. Insights transition through states based on time, data updates, and user feedback.

**States**:
- **Generated**: Newly created insight.
- **Confirmed**: Insight validated by subsequent data or user action.
- **Expired**: Insight no longer relevant due to time passage.
- **Superseded**: Insight replaced by newer, more accurate insight.
\n**Purpose**: Insight lifecycle states provide context and relevance, helping users understand the current validity and applicability of insights.

### 7.9 Systemic Anomaly

**Definition**: A systemic anomaly is an issue affecting the system itself, rather than seller-level behavior. Systemic anomalies include schema changes, timestamp drift, and ingestion bursts.

**Separation**: Systemic anomalies are flagged separately from seller analytics, ensuring clarity and preventing false positives in seller-facing outputs.

**Monitoring**: Systemic anomalies are monitored via dedicated system health endpoints and dashboard panels.

---

This glossary provides precise, authoritative definitions for key system terms. Consistent use of these definitions across all system components, documentation, and user-facing interfaces is mandatory.