# E-commerce Seller Analytics API Requirements Document

## 1. Application Overview

### 1.1 Application Name\nE-commerce Seller Analytics API

### 1.2 Application Description
A lightweight, high-performance analytics API system designed for e-commerce sellers. The system provides real-time anomaly detection (sales/click spikes, bot detection), short-term trend prediction (traffic/sales forecasting), and efficient scalable backend architecture leveraging DSP techniques (FIR, FFT, HFD) and probabilistic caching. Enhanced with auto-insights engine, predictive alerts, seller health scoring, and behavior fingerprinting capabilities.

## 2. Core Features

### 2.1 Event Ingestion
- **Endpoint**: POST /events
- **Functionality**: Accept and process seller event data in real-time
- **Payload Structure**:
  - sellerId: Seller identifier
  - timestamp: Event timestamp (milliseconds)
  - type: Event type (SALE / CLICK / VIEW)
  - value: Event value
- **Processing Logic**: Add events to sliding window buffer (in-memory circular array), with separate buffers per seller per metric

### 2.2 Batch Ingestion
- **Endpoint**: POST /events/batch
- **Functionality**: Accept bulk event data for high-throughput sellers
- **Payload Structure**: Array of event objects\n- **Processing Logic**: Efficiently process multiple events in a single request to reduce overhead

### 2.3 Sliding Window Buffer Management
- Fixed-size circular buffer (512 data points)
- Automatic eviction of oldest data points when buffer is full
- Support for real-time FIR, FFT, and HFD computations
\n### 2.4 DSP Analytics Pipeline
- **FIR Smoothing**: Smooth time series data
- **FFT Analysis**: Detect periodic spikes in sales/clicks, identify recurring bot patterns or hourly spikes
- **HFD (Higuchi Fractal Dimension)**: Measure time series complexity/irregularity, high HFD values indicate possible bot activity or anomalous behavior
- **Bayesian/Probabilistic Scoring**: Combine smoothed deviation, FFT spikes, and HFD to output anomaly score (0-1 range)

### 2.5 Probabilistic Caching
- Per-seller hot metric caching
- Adaptive TTL strategy:
  - Hot sellers: recompute every 1 second
  - Cold sellers: recompute every 10-30 seconds
- Short-term caching layer to reduce repeated function calls
- Ensure system scalability under high load

### 2.6 Anomaly Detection API\n- **Endpoint**: GET /metrics/:seller/anomalies\n- **Functionality**: Return seller anomaly score and attribution breakdown
- **Response Format**: \n  - anomalyScore: Overall anomaly score (0-1)\n  - attribution: Root cause breakdown (FFT spike contribution, HFD complexity contribution, trend deviation)\n\n### 2.7 Prediction API
- **Endpoint**: GET /metrics/:seller/predictions
- **Functionality**: Return predicted sales/traffic time series data with confidence bands
- **Response Format**:
  - predictions: Array of predicted values with timestamps
  - confidenceBands: ± confidence intervals around predictions
  - historicalCutoff: Timestamp marking where history ends and prediction begins

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
  - Smoothed deviation contribution percentage
\n### 2.10 Predictive Alerts
- **Functionality**: Proactive alert system based on trend analysis
- **Detection Mechanisms**:
  - Trend acceleration monitoring
  - FFT phase alignment detection
  - Confidence decay tracking
- **Alert Types**: Potential spike warning, declining trend alert, pattern shift notification

### 2.11 Seller Health Score (Composite Index)
- **Endpoint**: GET /metrics/:seller/health
- **Functionality**: Calculate comprehensive seller health score\n- **Scoring Factors**:
  - Volatility level
  - Anomaly frequency
  - Predictive risk assessment
  - Data consistency metrics
- **Response Format**: { healthScore: 0-100, breakdown: {...} }

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
- **Adaptive Logic**:
  - High-activity sellers: Full resolution analysis
  - Medium-activity sellers: Moderate sampling
  - Low-activity sellers: Reduced sampling frequency
- **Benefit**: Optimize system resources while maintaining accuracy

### 2.14 Real-time Dashboard Integration
- **Technology**: Supabase Realtime integration
- **Functionality**: Live dashboard updates with AnomalyAlert component
- **Features**:
  - Real-time anomaly notifications
  - Live metric updates
  - Event log display with pagination/infinite scrolling
\n### 2.15 Event Log Management
- **Functionality**: Display and manage event logs on dashboard
- **Features**:
  - Pagination support
  - Infinite scrolling capability
  - Efficient data loading for large event volumes

## 3. Technical Architecture
\n### 3.1 Data Processing
- In-memory circular buffer for real-time data storage\n- Streaming analytics processing
- DSP algorithm integration (FIR, FFT, HFD)
- Batch processing support for high-throughput scenarios

### 3.2 Caching Strategy
- Probabilistic caching mechanism\n- Dynamic TTL adjustment
- Hot/cold data differentiation\n- Short-term caching layer for frequently accessed computations

### 3.3 API Design
- RESTful API architecture
- Real-time event ingestion
- Batch ingestion endpoint
- On-demand metric query
- Type-safe implementation (no any casts)

### 3.4 Dashboard Components
- Mode toggle functionality (light/dark theme)
- Time-series chart with proper timestamp handling:\n  - Numeric timestamps internally
  - Formatted display in tooltips and axis ticks
  - Clear visual separation between historical and predicted data
  - Non-overlapping labels for multi-day data spans
- Confidence band visualization (± band around predictions)
- Real-time alert notifications
- Event log with pagination/infinite scrolling
\n### 3.5 Real-time Integration
- Supabase Realtime for live data streaming
- WebSocket connections for dashboard updates
- AnomalyAlert component integration
\n## 4. System Characteristics
- Lightweight and elegant design
- High performance and scalability
- Real-time processing capability
- Intelligent caching optimization
- Adaptive resource management
- Comprehensive analytics and insights
- Type-safe implementation
- Enhanced user experience with real-time updates