# E-commerce Seller Analytics API Requirements Document

## 1. Application Overview

### 1.1 Application Name
E-commerce Seller Analytics API

### 1.2 Application Description
A lightweight, high-performance analytics API system designed for e-commerce sellers. The system provides real-time anomaly detection (sales/click spikes, bot detection), short-term trend prediction (traffic/sales forecasting), and efficient scalable backend architecture leveraging DSP techniques (FIR, FFT, HFD) and probabilistic caching.

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

### 2.2 Sliding Window Buffer Management
- Fixed-size circular buffer (512 data points)
- Automatic eviction of oldest data points when buffer is full
- Support for real-time FIR, FFT, and HFD computations
\n### 2.3 DSP Analytics Pipeline
- **FIR Smoothing**: Smooth time series data\n- **FFT Analysis**: Detect periodic spikes in sales/clicks, identify recurring bot patterns or hourly spikes
- **HFD (Higuchi Fractal Dimension)**: Measure time series complexity/irregularity, high HFD values indicate possible bot activity or anomalous behavior
- **Bayesian/Probabilistic Scoring**: Combine smoothed deviation, FFT spikes, and HFD to output anomaly score (0-1 range)

### 2.4 Probabilistic Caching
- Per-seller hot metric caching\n- Adaptive TTL strategy:
  - Hot sellers: recompute every 1 second
  - Cold sellers: recompute every 10-30 seconds
- Ensure system scalability under high load\n
### 2.5 Anomaly Detection API
- **Endpoint**: GET /metrics/:seller/anomalies
- **Functionality**: Return seller anomaly score\n- **Response Format**: { anomalyScore: 0.85 }

### 2.6 Prediction API\n- **Endpoint**: GET /metrics/:seller/predictions
- **Functionality**: Return predicted sales/traffic time series data
\n## 3. Technical Architecture\n
### 3.1 Data Processing\n- In-memory circular buffer for real-time data storage
- Streaming analytics processing\n- DSP algorithm integration (FIR, FFT, HFD)

### 3.2 Caching Strategy
- Probabilistic caching mechanism\n- Dynamic TTL adjustment
- Hot/cold data differentiation

### 3.3 API Design
- RESTful API architecture
- Real-time event ingestion
- On-demand metric query

## 4. System Characteristics
- Lightweight and elegant design
- High performance and scalability
- Real-time processing capability
- Intelligent caching optimization