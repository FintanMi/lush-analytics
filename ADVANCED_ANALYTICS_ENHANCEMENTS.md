# Advanced Analytics Enhancements

## Overview

This document describes the comprehensive enhancements made to the Lush Analytics platform, including advanced time-series algorithms, new visualization components, and improved signal quality metrics.

## 1. Sidebar Improvements

### Enhanced SidebarProvider

The sidebar now includes:
- **Cookie-based state persistence**: Sidebar state is saved across sessions
- **Mobile/Desktop unified toggle**: Single `toggleSidebar()` function handles both contexts
- **Keyboard shortcuts**: Cmd/Ctrl + B to toggle sidebar
- **Proper state management**: Supports controlled and uncontrolled modes

**Implementation**: `src/components/ui/sidebar.tsx`

## 2. Pricing Tier Updates

### Basic Tier Restored

The Basic tier is now visible on both the landing page and admin panel:

**Features**:
- $0/month (Free)
- Up to 10,000 events/month
- Basic analytics dashboard
- 7-day data retention
- Email support
- Single seller account
- Core anomaly detection
- Standard performance

**Files Updated**:
- `src/pages/LandingPage.tsx`
- `src/pages/AdminPanel.tsx`

## 3. Advanced Analytics Types

### New Type Definitions

Added comprehensive type definitions in `src/types/analytics.ts`:

#### Signal Quality Metrics
- `SignalToNoiseRatio`: Measures data quality per metric/seller/window
- `EffectiveSampleSize`: Adjusts raw counts by autocorrelation
- `WindowStabilityScore`: Tracks rolling window content changes
- `TemporalCoverage`: Measures time bucket population percentage
- `EntropyDrift`: Detects timing/value entropy changes vs baseline

#### Query Execution Metrics
- `QueryPlanCostAccuracy`: Estimated vs actual cost delta
- `NodeExecutionSkew`: Identifies bottleneck nodes
- `ParallelismEfficiency`: CPU utilization vs planned parallelism
- `CacheContributionRatio`: Cache hit effectiveness
- `PartialResultYieldTime`: Time to first usable output

#### Reproducibility Metrics
- `ReproducibilityDriftRate`: Computation consistency across runs
- `ConfigSensitivityIndex`: Output variance per config change
- `InvariantViolation`: System invariant breach tracking

#### Business & Engagement Metrics
- `InsightActionMetrics`: User engagement with insights
- `AlertToActionLatency`: Response time tracking
- `FalsePositiveTolerance`: Alert fatigue detection
- `RevenueAtRisk`: Financial impact estimation
- `TierSaturationIndex`: Usage vs limits monitoring
- `AlertCostEfficiency`: Value per alert delivered
- `UpgradeTriggerCorrelation`: Feature-to-upgrade mapping
- `ChurnAfterAlertStorms`: Alert fatigue impact on retention
- `UIEngagementMetrics`: Confidence message reads, panel usage, etc.

#### Time-Series Algorithm Results
- `MatrixProfileResult`: Motif and discord detection
- `BayesianChangePoint`: Regime shift identification
- `SeasonalHybridESDResult`: Seasonality-aware anomaly detection
- `CopulaDependencyDrift`: Cross-metric relationship monitoring
- `DTWDistanceToBaseline`: Behavioral signature comparison

#### Visualization Data Structures
- `LiveDAGHeatmap`: Real-time query execution DAG
- `TimeToInsightTimeline`: Value delivery pipeline stages
- `AttributionWaterfall`: Anomaly score component breakdown
- `FrequencyDomainData`: FFT analysis with bot detection
- `SignalQualityOverlay`: Confidence bands and quality indicators

## 4. Advanced Algorithm Configuration

### Configuration File

**Location**: `src/config/advanced-algorithms.ts`

**Algorithms Configured**:

1. **Matrix Profile (STOMP/SCRIMP++)**
   - Window size: 50
   - Motif similarity threshold: 0.85
   - Discord threshold: 2.5
   - FFT acceleration enabled

2. **Bayesian Online Change Point Detection (BOCPD)**
   - Hazard rate: 0.01
   - Change point threshold: 0.7
   - Max run length: 200

3. **Seasonal Hybrid ESD**
   - Max anomalies: 10
   - Alpha: 0.05
   - Seasonality periods: 24h, 168h (weekly), 720h (monthly)

4. **Copula-Based Dependency Drift**
   - Gaussian copula
   - Dependency threshold: 0.3
   - Drift threshold: 0.2
   - Monitored pairs: CLICK↔VIEW, VIEW↔SALE, CHECKOUT↔PAYMENT

5. **Dynamic Time Warping (DTW)**
   - Window size: 50
   - Euclidean distance metric
   - Similarity threshold: 0.75

### Algorithm Selection Strategy

Algorithms are automatically selected based on:
- **Data points available**
- **Pricing tier**
- **Fallback chains** for degraded scenarios

**Selection Logic**:
- `< 30 points`: Seasonal Hybrid ESD only
- `30-100 points`: S-H-ESD + DTW
- `100-500 points`: Matrix Profile + BOCPD + S-H-ESD + Copula (Pro/Enterprise)
- `> 500 points`: All algorithms (Enterprise)

## 5. Advanced Algorithm Service

### Implementation

**Location**: `src/services/advanced-algorithms.ts`

**Functions Implemented**:

1. `computeMatrixProfile()`: Detects repeating patterns and anomalies
2. `detectChangePoints()`: Identifies regime shifts using Bayesian methods
3. `detectSeasonalAnomalies()`: Robust anomaly detection with seasonality
4. `detectDependencyDrift()`: Monitors cross-metric relationships
5. `computeDTWDistance()`: Compares behavioral signatures
6. `calculateSNR()`: Signal-to-noise ratio measurement
7. `calculateEffectiveSampleSize()`: Autocorrelation-adjusted sample size
8. `calculateWindowStability()`: Rolling window consistency tracking
9. `analyzeTemporalCoverage()`: Time bucket population analysis
10. `calculateEntropyDrift()`: Timing and value entropy monitoring

**Utility Functions**:
- Euclidean distance, correlation, autocorrelation
- Mean, variance, standard deviation
- Normalization, moving average
- DTW distance calculation
- Seasonality detection and removal
- Entropy calculation (value and timing)

## 6. New Visualization Components

### 1. Live DAG Heatmap

**Location**: `src/components/analytics/LiveDAGHeatmap.tsx`

**Features**:
- Real-time query execution visualization
- Node coloring by latency (fast/medium/slow/failed)
- Bottleneck identification
- Invariant checking display
- Data flow visualization between nodes
- Cache usage and cost metrics

**Use Cases**:
- Query performance debugging
- Bottleneck identification
- SLA enforcement
- Internal tuning

### 2. Time-to-Insight Timeline

**Location**: `src/components/analytics/TimeToInsightTimeline.tsx`

**Features**:
- End-to-end value delivery visualization
- Stage breakdown: ingestion → computation → anomaly → insight → alert → action
- Duration and percentage per stage
- Performance insights and recommendations
- Success/failure/skip status tracking

**Use Cases**:
- Value delivery monitoring
- Performance optimization
- User action latency tracking
- Alert effectiveness measurement

### 3. Attribution Waterfall

**Location**: `src/components/analytics/AttributionWaterfall.tsx`

**Features**:
- Anomaly score component breakdown
- Before/after smoothing visualization
- Contribution percentage per component
- Top contributors ranking
- Confidence display

**Use Cases**:
- Explainable AI
- Insight transparency
- User trust building
- Debugging anomaly detection

### 4. Frequency Domain Explorer

**Location**: `src/components/analytics/FrequencyDomainExplorer.tsx`

**Features**:
- FFT magnitude spectrum visualization
- Dominant frequency identification
- Bot fingerprint detection
- Phase analysis
- Top frequency components table
- Bot confidence scoring

**Use Cases**:
- Bot detection
- Behavioral fingerprinting
- Pattern analysis
- Fraud prevention

### 5. Signal Quality Overlay

**Location**: `src/components/analytics/SignalQualityOverlay.tsx`

**Features**:
- Confidence bands visualization
- SNR, ESS, stability, coverage tracking
- Degraded mode detection and alerts
- Quality indicator timeline
- Sufficiency score overlay

**Use Cases**:
- Data quality monitoring
- Confidence explanation
- Degraded mode alerting
- Signal quality trends

## 7. Signal Quality Configuration Updates

### Enhanced Configuration

**Location**: `src/config/signal-quality.ts`

**New Sections**:

1. **Advanced Algorithms Reference**
   - Time-series algorithms
   - Quality metrics
   - Execution metrics
   - Reproducibility metrics
   - Business metrics
   - Engagement metrics

2. **Algorithm Selection Function**
   - `selectAlgorithms(dataPoints, tier)`: Returns appropriate algorithms based on data availability and pricing tier

## 8. Integration Points

### How to Use the New Features

#### 1. In Dashboard Components

```typescript
import { computeMatrixProfile, calculateSNR } from '@/services/advanced-algorithms';
import LiveDAGHeatmapVisualization from '@/components/analytics/LiveDAGHeatmap';

// Compute advanced metrics
const matrixProfile = computeMatrixProfile(data, sellerId, metricType);
const snr = calculateSNR(data, sellerId, metricType, windowStart, windowEnd);

// Render visualizations
<LiveDAGHeatmapVisualization data={dagData} loading={false} />
```

#### 2. In Query Console

```typescript
import TimeToInsightTimelineVisualization from '@/components/analytics/TimeToInsightTimeline';

<TimeToInsightTimelineVisualization data={timelineData} loading={false} />
```

#### 3. In Anomaly Detection

```typescript
import { detectSeasonalAnomalies, detectChangePoints } from '@/services/advanced-algorithms';
import AttributionWaterfallVisualization from '@/components/analytics/AttributionWaterfall';

const anomalies = detectSeasonalAnomalies(data, timestamps, sellerId, metricType);
const changePoints = detectChangePoints(data, sellerId, metricType);

<AttributionWaterfallVisualization data={attributionData} loading={false} />
```

#### 4. In Bot Detection

```typescript
import FrequencyDomainExplorer from '@/components/analytics/FrequencyDomainExplorer';

<FrequencyDomainExplorer data={frequencyData} loading={false} />
```

#### 5. In Signal Quality Monitoring

```typescript
import SignalQualityOverlayVisualization from '@/components/analytics/SignalQualityOverlay';

<SignalQualityOverlayVisualization data={qualityData} loading={false} />
```

## 9. Benefits

### For Enterprise Buyers
- **Query Plan Cost Accuracy**: Optimize database performance
- **Node-Level Execution Skew**: Identify bottlenecks
- **Parallelism Efficiency**: Maximize resource utilization
- **Reproducibility Metrics**: Ensure consistent results

### For Sellers
- **Revenue at Risk Detection**: Proactive intervention
- **Alert Fatigue Prevention**: False positive monitoring
- **Tier Saturation Alerts**: Upgrade recommendations
- **Insight Action Tracking**: Measure value delivery

### For Platform Health
- **Invariant Violation Tracking**: System integrity monitoring
- **Config Sensitivity Analysis**: Safe configuration changes
- **Churn Prediction**: Alert storm impact assessment
- **UI Engagement Metrics**: User experience optimization

## 10. Best Practices

### Algorithm Selection
1. Always check data sufficiency before running algorithms
2. Use fallback chains for degraded scenarios
3. Respect tier limits on algorithm availability
4. Cache algorithm results appropriately

### Visualization Usage
1. Show loading states during computation
2. Handle null/empty data gracefully
3. Provide clear explanations for metrics
4. Use consistent color schemes

### Signal Quality
1. Always display confidence bands
2. Explain degraded mode to users
3. Show SNR and ESS alongside results
4. Track temporal coverage gaps

### Performance
1. Use incremental computation where possible
2. Leverage ring buffers for streaming data
3. Apply FFT acceleration for Matrix Profile
4. Cache expensive computations

## 11. Future Enhancements

### Planned Features
1. Real-time algorithm switching based on data quality
2. Automated algorithm parameter tuning
3. Multi-metric correlation analysis
4. Predictive tier saturation alerts
5. Advanced bot fingerprint library
6. Custom algorithm configuration per seller

### Research Areas
1. Adaptive window sizing
2. Online learning for change point detection
3. Multi-resolution analysis
4. Causal inference for attribution
5. Federated learning for privacy

## 12. References

### Academic Papers
- Matrix Profile: Yeh et al. (2016) - "Matrix Profile I"
- BOCPD: Adams & MacKay (2007) - "Bayesian Online Changepoint Detection"
- S-H-ESD: Hochenbaum et al. (2017) - "Automatic Anomaly Detection in the Cloud Via Statistical Learning"
- Copulas: Nelsen (2006) - "An Introduction to Copulas"
- DTW: Sakoe & Chiba (1978) - "Dynamic Programming Algorithm Optimization"

### Documentation
- Signal Quality: `src/config/signal-quality.ts`
- Advanced Algorithms: `src/config/advanced-algorithms.ts`
- Algorithm Service: `src/services/advanced-algorithms.ts`
- Type Definitions: `src/types/analytics.ts`

---

**Last Updated**: 2026-01-21
**Version**: 2.0.0
**Author**: Lush Analytics Team
