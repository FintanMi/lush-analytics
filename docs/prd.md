# E-commerce Seller Analytics API Requirements Document

## 1. Application Overview

### 1.1 Application Name\nE-commerce Seller Analytics API

### 1.2 Application Description
A lightweight, high-performance analytics API system designed for e-commerce sellers. The system provides real-time anomaly detection (sales/click spikes, bot detection), short-term trend prediction (traffic/sales forecasting), and efficient scalable backend architecture leveraging DSP techniques (FIR, FFT, HFD) and probabilistic caching. Enhanced with auto-insights engine, predictive alerts, seller health scoring, behavior fingerprinting capabilities, deterministic reproducibility, data sufficiency indicators, rate-limit visibility, decision hooks, weekly health reports, alert-driven pricing tiers, and dedicated anomaly/prediction endpoints.

## 2. Core Features

### 2.1 Event Ingestion
- **Endpoint**: POST /events
- **Functionality**: Accept and process seller event data in real-time
- **Payload Structure**:
  - sellerId: Seller identifier\n  - timestamp: Event timestamp (milliseconds)
  - type: Event type (SALE / CLICK / VIEW)
  - value: Event value
- **Processing Logic**: Add events to sliding window buffer (in-memory circular array), with separate buffers per seller per metric

### 2.2 Batch Ingestion
- **Endpoint**: POST /events/batch
- **Functionality**: Accept bulk event data for high-throughput sellers
- **Payload Structure**: Array of event objects
- **Processing Logic**: Efficiently process multiple events in a single request to reduce overhead

### 2.3 Sliding Window Buffer Management
- Fixed-size circular buffer (512 data points)
- Automatic eviction of oldest data points when buffer is full
- Support for real-time FIR, FFT, and HFD computations
- **Clear Time-Window Definitions**: Expose time-window parameters (start timestamp, end timestamp, window size) in API responses and UI

### 2.4 DSP Analytics Pipeline\n- **FIR Smoothing**: Smooth time series data\n- **FFT Analysis**: Detect periodic spikes in sales/clicks, identify recurring bot patterns or hourly spikes
- **HFD (Higuchi Fractal Dimension)**: Measure time series complexity/irregularity, high HFD values indicate possible bot activity or anomalous behavior
- **Bayesian/Probabilistic Scoring**: Combine smoothed deviation, FFT spikes, and HFD to output anomaly score (0-1 range)
- **Deterministic Anomaly Reproducibility**: Ensure same inputs always produce same outputs by using fixed random seeds, deterministic sorting, and consistent computation order

### 2.5 Probabilistic Caching
- Per-seller hot metric caching
- Adaptive TTL strategy:
  - Hot sellers: recompute every 1 second
  - Cold sellers: recompute every 10-30 seconds
- Short-term caching layer to reduce repeated function calls
- Ensure system scalability under high load

### 2.6 Anomaly Detection API
- **Endpoint**: GET /metrics/:seller/anomalies
- **Functionality**: Return seller anomaly score and attribution breakdown
- **Response Format**:
  - anomalyScore: Overall anomaly score (0-1)
  - attribution: Root cause breakdown (FFT spike contribution, HFD complexity contribution, trend deviation)
  - timeWindow: Clear time-window definition (startTimestamp, endTimestamp, windowSize)
  - dataSufficiency: Data sufficiency indicator (sufficient/insufficient, minimum data points required, current data points available)
  - reproducibilityHash: Hash value for deterministic verification

### 2.7 Prediction API
- **Endpoint**: GET /metrics/:seller/predictions
- **Functionality**: Return predicted sales/traffic time series data with confidence bands
- **Response Format**:
  - predictions: Array of predicted values with timestamps
  - confidenceBands: ± confidence intervals around predictions\n  - historicalCutoff: Timestamp marking where history ends and prediction begins
  - timeWindow: Clear time-window definition\n  - dataSufficiency: Data sufficiency indicator
  - reproducibilityHash: Hash value for deterministic verification

### 2.8 Auto-Insights Engine
- **Functionality**: Generate lightweight insights based on rule and probability analysis
- **Input Signals**:
  - Anomaly score
  - FFT periodicity
  - HFD complexity
  - Recent trend slope
- **Output**: Human-readable insights explaining detected patterns and potential issues

### 2.9 Anomaly Attribution (Root Cause Breakdown)
- **Functionality**: Explain anomaly score composition
- **Components**:
  - FFT spike contribution percentage
  - HFD complexity contribution percentage
  - Trend deviation contribution percentage
  - Smoothed deviation contribution percentage\n\n### 2.10 Predictive Alerts
- **Functionality**: Proactive alert system based on trend analysis
- **Detection Mechanisms**:
  - Trend acceleration monitoring
  - FFT phase alignment detection
  - Confidence decay tracking
- **Alert Types**: Potential spike warning, declining trend alert, pattern shift notification

### 2.11 Seller Health Score (Composite Index)
- **Endpoint**: GET /metrics/:seller/health
- **Functionality**: Calculate comprehensive seller health score
- **Scoring Factors**:
  - Volatility level
  - Anomaly frequency
  - Predictive risk assessment
  - Data consistency metrics
- **Response Format**: { healthScore: 0-100, breakdown: {...}, timeWindow: {...}, dataSufficiency: {...} }

### 2.12 Behavior Fingerprinting
- **Functionality**: Identify and track seller behavior patterns\n- **Analysis Methods**:
  - FFT + HFD + timing entropy combination
- **Detection Capabilities**:
  - Bot clusters identification
  - Repeated manipulation patterns
  - Sudden strategy changes
- **Output**: Behavior fingerprint signature and pattern classification

### 2.13 Smart Sampling & Adaptive Resolution
- **Functionality**: Automatically adjust analytics computation cost based on seller activity
- **Adaptive Logic**:
  - High-activity sellers: Full resolution analysis\n  - Medium-activity sellers: Moderate sampling
  - Low-activity sellers: Reduced sampling frequency
- **Benefit**: Optimize system resources while maintaining accuracy

### 2.14 Real-time Dashboard Integration
- **Technology**: Supabase Realtime integration
- **Functionality**: Live dashboard updates with AnomalyAlert component
- **Features**:
  - Real-time anomaly notifications
  - Live metric updates
  - Event log display with pagination/infinite scrolling
  - **Time-Window Display**: Show clear time-window definitions in UI (start time, end time, window size)
  - **Data Sufficiency Indicators**: Display explicit data sufficiency status (sufficient/insufficient, progress bar showing current vs required data points)
  - **Rate-Limit & Backpressure Visibility**: Show current rate-limit status, remaining quota, backpressure indicators, and queue depth

### 2.15 Event Log Management
- **Functionality**: Display and manage event logs on dashboard
- **Features**:
  - Pagination support
  - Infinite scrolling capability
  - Efficient data loading for large event volumes
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
- **Delivery Methods**: Email, dashboard notification, API endpoint for retrieval
- **Endpoint**: GET /reports/:seller/weekly\n\n### 2.18 Alert-Driven Pricing Tiers
- **Functionality**: Dynamic pricing tier system based on alert frequency and severity
- **Tier Logic**:
  - Basic Tier: Low alert frequency, standard features
  - Premium Tier: Medium alert frequency, enhanced features and faster response
  - Enterprise Tier: High alert frequency, full feature access, dedicated support
- **Pricing Factors**:
  - Number of alerts triggered per month
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
\n## 3. Technical Architecture
\n### 3.1 Data Processing
- In-memory circular buffer for real-time data storage\n- Streaming analytics processing
- DSP algorithm integration (FIR, FFT, HFD)
- Batch processing support for high-throughput scenarios
- Deterministic computation pipeline with fixed random seeds and consistent ordering

### 3.2 Caching Strategy\n- Probabilistic caching mechanism
- Dynamic TTL adjustment\n- Hot/cold data differentiation
- Short-term caching layer for frequently accessed computations

### 3.3 API Design
- RESTful API architecture
- Real-time event ingestion
- Batch ingestion endpoint
- On-demand metric query
- Type-safe implementation (no any casts)\n- Dedicated sell endpoints for anomaly and prediction results
- Decision hook integration points

### 3.4 Dashboard Components
- Mode toggle functionality (light/dark theme)\n- Time-series chart with proper timestamp handling:
  - Numeric timestamps internally
  - Formatted display in tooltips and axis ticks
  - Clear visual separation between historical and predicted data
  - Non-overlapping labels for multi-day data spans
- Confidence band visualization (± band around predictions)\n- Real-time alert notifications\n- Event log with pagination/infinite scrolling
- **Time-Window Display Panel**: Show start time, end time, window size for current analysis
- **Data Sufficiency Indicators**: Visual indicators (progress bars, status badges) showing data completeness
- **Rate-Limit & Backpressure Dashboard**: Display current rate-limit status, remaining quota, backpressure metrics, queue depth visualization

### 3.5 Real-time Integration
- Supabase Realtime for live data streaming
- WebSocket connections for dashboard updates
- AnomalyAlert component integration\n\n### 3.6 Reporting & Pricing System
- Automated weekly report generation engine
- Alert-driven pricing tier calculation logic
- Report delivery system (email, notification, API)\n- Pricing tier API endpoints
\n### 3.7 Deterministic Reproducibility System
- Fixed random seed management
- Deterministic sorting and computation order
- Reproducibility hash generation for verification
- Input/output logging for audit trails

## 4. System Characteristics
- Lightweight and elegant design
- High performance and scalability
- Real-time processing capability
- Intelligent caching optimization
- Adaptive resource management
- Comprehensive analytics and insights
- Type-safe implementation
- Enhanced user experience with real-time updates
- Deterministic and reproducible anomaly detection
- Clear time-window definitions and data sufficiency indicators
- Rate-limit and backpressure visibility
- Extensible decision hooks for custom business logic
- Automated weekly health reporting
- Dynamic alert-driven pricing tiers
- Dedicated endpoints for selling anomaly and prediction results