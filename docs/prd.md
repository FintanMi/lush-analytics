# E-commerce Seller Analytics API Requirements Document

## 1. Application Overview

### 1.1 Application Name\nE-commerce Seller Analytics API

### 1.2 Application Description
A lightweight, high-performance analytics API system designed for e-commerce sellers. The system provides real-time anomaly detection (sales/click spikes, bot detection), short-term trend prediction (traffic/sales forecasting), and efficient scalable backend architecture leveraging DSP techniques (FIR, FFT, HFD) and probabilistic caching. Enhanced with auto-insights engine, predictive alerts, seller health scoring, behavior fingerprinting capabilities, deterministic reproducibility, data sufficiency indicators, rate-limit visibility, decision hooks, weekly health reports, alert-driven pricing tiers, dedicated anomaly/prediction endpoints, opinionated tier defaults, insight summaries, one-click export functionality, embeddable components, and confidence/sufficiency aware messaging.

## 2. Core Features

### 2.1 Event Ingestion
- **Endpoint**: POST /events
- **Functionality**: Accept and process seller event data in real-time
- **Payload Structure**:
  - sellerId: Seller identifier
  - timestamp: Event timestamp (milliseconds)
  - type: Event type (SALE / CLICK / VIEW)
  - value: Event value
- **Processing Logic**: Add events to preallocated fixed-size ring buffer (contiguous array), with separate buffers per seller per metric. Use index modulo window size for circular access. No per-event reallocation or object churn.

### 2.2 Batch Ingestion
- **Endpoint**: POST /events/batch
- **Functionality**: Accept bulk event data for high-throughput sellers\n- **Payload Structure**: Array of event objects
- **Processing Logic**: Efficiently process multiple events in a single request to reduce overhead, using same ring buffer mechanism\n
### 2.3 Ring Buffer Management
- Preallocated fixed-size contiguous array (window size defined in centralized config)
- Index modulo window size for circular access\n- Zero reallocation per event
- No per-event object churn
- Support for real-time FIR, FFT, and HFD computations
- **Clear Time-Window Definitions**: Expose time-window parameters (start timestamp, end timestamp, window size) in API responses and UI

### 2.4 DSP Analytics Pipeline
- **FIR Smoothing**: Smooth time series data\n- **FFT Analysis**: Detect periodic spikes in sales/clicks, identify recurring bot patterns or hourly spikes\n- **HFD (Higuchi Fractal Dimension)**: Measure time series complexity/irregularity, high HFD values indicate possible bot activity or anomalous behavior
- **Bayesian/Probabilistic Scoring**: Combine smoothed deviation, FFT spikes, and HFD to output anomaly score (0-1 range)
- **Deterministic Anomaly Reproducibility**: Ensure same inputs always produce same outputs by using fixed random seeds, deterministic sorting, and consistent computation order

### 2.5 Probabilistic Caching with Temporal Locality
- Per-seller hot metric caching
- **lastComputedAt** timestamp tracking for each cached metric
- Probabilistic refresh only when queried (not on every event)
- Adaptive TTL strategy defined in centralized config:\n  - Hot sellers: recompute based on config TTL
  - Cold sellers: recompute based on config TTL
- Short-term caching layer to reduce repeated function calls
- Ensure system scalability under high load

### 2.6 Anomaly Detection API
- **Endpoint**: GET /metrics/:seller/anomalies
- **Functionality**: Return seller anomaly score and attribution breakdown
- **Response Format**:
  - anomalyScore: Overall anomaly score (0-1)
  - attribution: Root cause breakdown (FFT spike contribution, HFD complexity contribution, trend deviation)\n  - timeWindow: Clear time-window definition (startTimestamp, endTimestamp, windowSize)
  - dataSufficiency: Data sufficiency indicator (sufficient/insufficient, minimum data points required, current data points available)
  - reproducibilityHash: Hash value for deterministic verification\n  - confidenceMessage: Confidence and sufficiency aware messaging explaining result reliability

### 2.7 Prediction API
- **Endpoint**: GET /metrics/:seller/predictions
- **Functionality**: Return predicted sales/traffic time series data with confidence bands
- **Response Format**:\n  - predictions: Array of predicted values with timestamps
  - confidenceBands: ± confidence intervals around predictions
  - historicalCutoff: Timestamp marking where history ends and prediction begins
  - timeWindow: Clear time-window definition
  - dataSufficiency: Data sufficiency indicator
  - reproducibilityHash: Hash value for deterministic verification
  - confidenceMessage: Confidence and sufficiency aware messaging explaining prediction reliability

### 2.8 Auto-Insights Engine with Summaries
- **Functionality**: Generate lightweight insights based on rule and probability analysis
- **Input Signals**:
  - Anomaly score
  - FFT periodicity
  - HFD complexity
  - Recent trend slope
- **Output**: Human-readable insight summaries explaining detected patterns and potential issues
- **Insight Summaries**: Concise, actionable summaries for quick understanding

### 2.9 Anomaly Attribution (Root Cause Breakdown)
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

### 2.11 Seller Health Score (Composite Index)
- **Endpoint**: GET /metrics/:seller/health
- **Functionality**: Calculate comprehensive seller health score\n- **Scoring Factors**:
  - Volatility level
  - Anomaly frequency
  - Predictive risk assessment
  - Data consistency metrics
- **Response Format**: { healthScore: 0-100, breakdown: {...}, timeWindow: {...}, dataSufficiency: {...}, confidenceMessage: \"...\" }

### 2.12 Behavior Fingerprinting
- **Functionality**: Identify and track seller behavior patterns
- **Analysis Methods**:
  - FFT + HFD + timing entropy combination
- **Detection Capabilities**:
  - Bot clusters identification
  - Repeated manipulation patterns
  - Sudden strategy changes
- **Output**: Behavior fingerprint signature and pattern classification

### 2.13 Smart Sampling & Adaptive Resolution
- **Functionality**: Automatically adjust analytics computation cost based on seller activity
- **Adaptive Logic** (defined in centralized config):
  - High-activity sellers: Full resolution analysis
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

### 2.15 Event Log Management
- **Functionality**: Display and manage event logs on dashboard
- **Features**:
  - Pagination support
  - Infinite scrolling capability
  - Efficient data loading for large event volumes
\n### 2.16 Decision Hooks
- **Functionality**: Provide extensible decision hooks for custom business logic integration
- **Hook Points**:\n  - Pre-anomaly detection hook: Execute custom logic before anomaly detection
  - Post-anomaly detection hook: Execute custom logic after anomaly detection
  - Pre-prediction hook: Execute custom logic before prediction generation
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
- **Delivery Methods**: Email, dashboard notification, API endpoint for retrieval
- **Endpoint**: GET /reports/:seller/weekly

### 2.18 Alert-Driven Pricing Tiers with Opinionated Defaults
- **Functionality**: Dynamic pricing tier system based on alert frequency and severity
- **Tier Structure**: Data-driven tier definitions (not logic-based)
- **Opinionated Defaults Per Tier**:
  - Basic Tier: Standard features, default alert thresholds, basic insights
  - Premium Tier: Enhanced features, lower alert thresholds, detailed insights, faster response\n  - Enterprise Tier: Full feature access, custom alert thresholds, comprehensive insights, dedicated support
- **Pricing Factors** (defined in centralized config):\n  - Number of alerts triggered per month
  - Anomaly severity levels
  - Prediction accuracy requirements
  - Real-time processing needs
- **Endpoint**: GET /pricing/:seller/tier

### 2.19 Dedicated Anomaly Endpoint
- **Endpoint**: POST /sell/anomaly
- **Functionality**: Dedicated endpoint for selling/exposing anomaly detection results to external systems
- **Payload Structure**:
  - sellerId: Seller identifier
  - timeRange: Time range for anomaly detection
  - includeAttribution: Boolean flag to include root cause breakdown
- **Response Format**:
  - anomalyScore: Overall anomaly score
  - attribution: Root cause breakdown
  - timeWindow: Time-window definition
  - dataSufficiency: Data sufficiency indicator\n  - reproducibilityHash: Hash value for verification
  - confidenceMessage: Confidence and sufficiency aware messaging\n
### 2.20 Dedicated Prediction Endpoint
- **Endpoint**: POST /sell/prediction
- **Functionality**: Dedicated endpoint for selling/exposing prediction results to external systems
- **Payload Structure**:
  - sellerId: Seller identifier
  - predictionHorizon: Number of time steps to predict
  - includeConfidenceBands: Boolean flag to include confidence intervals
- **Response Format**:\n  - predictions: Array of predicted values with timestamps
  - confidenceBands: ± confidence intervals\n  - historicalCutoff: Timestamp marking history/prediction boundary
  - timeWindow: Time-window definition
  - dataSufficiency: Data sufficiency indicator
  - reproducibilityHash: Hash value for verification
  - confidenceMessage: Confidence and sufficiency aware messaging\n
### 2.21 One-Click Export Functionality
- **Functionality**: Export reports, insights, and analytics data with one click
- **Export Formats**: PDF, Email\n- **Export Content**:
  - Anomaly reports
  - Prediction reports
  - Health score reports
  - Weekly health reports
  - Insight summaries
- **Endpoints**:
  - POST /export/pdf: Generate and download PDF report
  - POST /export/email: Send report via email
\n### 2.22 Embeddable Components
- **Functionality**: Provide embeddable UI components for integration into external dashboards or applications
- **Components**:\n  - Anomaly chart widget
  - Prediction chart widget
  - Health score widget\n  - Alert notification widget
  - Event log widget
- **Integration**: JavaScript SDK or iframe-based embedding
- **Customization**: Support for theme customization and configuration options

## 3. Technical Architecture

### 3.1 Data Processing\n- Preallocated fixed-size contiguous ring buffer for real-time data storage
- Index modulo window size for circular access\n- Zero reallocation per event, no per-event object churn\n- Streaming analytics processing\n- DSP algorithm integration (FIR, FFT, HFD)
- Batch processing support for high-throughput scenarios
- Deterministic computation pipeline with fixed random seeds and consistent ordering

### 3.2 Caching Strategy with Temporal Locality
- Probabilistic caching mechanism\n- **lastComputedAt** timestamp tracking
- Probabilistic refresh only when queried
- Dynamic TTL adjustment (defined in centralized config)
- Hot/cold data differentiation
- Short-term caching layer for frequently accessed computations
\n### 3.3 API Design
- RESTful API architecture
- Real-time event ingestion
- Batch ingestion endpoint
- On-demand metric query
- Type-safe implementation (no any casts)
- Dedicated sell endpoints for anomaly and prediction results
- Decision hook integration points
- One-click export endpoints

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
- **Confidence & Sufficiency Aware Messaging**: Contextual messages explaining result reliability\n- **Embeddable Component Support**: Integration of embeddable widgets\n
### 3.5 Real-time Integration
- Supabase Realtime for live data streaming
- WebSocket connections for dashboard updates
- AnomalyAlert component integration
\n### 3.6 Reporting & Pricing System
- Automated weekly report generation engine
- Alert-driven pricing tier calculation logic (data-driven, not logic-based)
- Report delivery system (email, notification, API)\n- Pricing tier API endpoints
- One-click export functionality integration
\n### 3.7 Deterministic Reproducibility System
- Fixed random seed management
- Deterministic sorting and computation order
- Reproducibility hash generation for verification
- Input/output logging for audit trails
\n### 3.8 Centralized Configuration System
- **Centralized Config Store**: Single source of truth for all system parameters
- **Config Parameters**:
  - Window sizes (ring buffer size, analysis window size)
  - Thresholds (anomaly score threshold, confidence cutoffs)
  - TTLs (hot seller TTL, cold seller TTL, cache TTL)
  - Tier limits (alert frequency limits per tier, feature access per tier)
  - Confidence cutoffs (minimum confidence for predictions, minimum data sufficiency)
  - Alert levels (defined by config tables, not conditionals)\n  - Sampling rates (high/medium/low activity sampling rates)
- **Dynamic Expressions**: Use dynamic expressions where applicable, avoid magic numbers
- **Data-Driven Design**: Alert levels, tiers, thresholds all defined by config data, not hardcoded logic

### 3.9 Modular and Composable Architecture
- **Composability Focus**: Design for composability, not reuse
- **Modular Components**: Separate modules for DSP, caching, alerting, reporting, export, embedding
- **Concise Refactoring**: Eliminate redundancy, centralize common logic
- **Zero Magic Numbers**: All constants defined in centralized config
\n## 4. System Characteristics
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
- Embeddable components for external integration
- Confidence and sufficiency aware messaging throughout
- Data-driven configuration system (no magic numbers, no hardcoded logic)
- Modular and composable architecture
- Efficient data movement with preallocated ring buffers and zero per-event churn
- Single primary trigger for alerts with contextual information