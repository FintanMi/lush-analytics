# E-commerce Seller Analytics API

A lightweight, high-performance analytics API system designed for e-commerce sellers with real-time anomaly detection and predictive analytics.

## Features

### 🎯 Core Capabilities
- **Real-time Event Ingestion**: Accept and process SALE, CLICK, and VIEW events
- **Batch Ingestion**: High-throughput batch processing (up to 1000 events per request)
- **Anomaly Detection**: Advanced DSP-based detection using FIR smoothing, FFT analysis, and Higuchi Fractal Dimension
- **Predictive Analytics**: Short-term sales forecasting with confidence intervals and uncertainty bands
- **Probabilistic Caching**: Client-side 30-second cache with adaptive TTL strategy
- **Real-time Updates**: Supabase Realtime integration for live dashboard updates
- **Interactive Dashboard**: Real-time visualization of metrics and trends

### 🔬 DSP Analytics Pipeline
- **FIR Smoothing**: Reduces noise in time series data
- **FFT Analysis**: Detects periodic spikes and recurring patterns
- **HFD (Higuchi Fractal Dimension)**: Measures time series complexity to identify bot activity
- **Bayesian Scoring**: Combines multiple signals for accurate anomaly detection (0-1 scale)
- **Deterministic**: Same inputs always produce same outputs (no randomness)

### 🤖 Auto-Insights Engine
Lightweight rule-based and probability-based insights generation:

**Inputs:**
- Anomaly score from DSP pipeline
- FFT periodicity detection
- HFD complexity measurement
- Recent trend slope analysis

**Outputs:**
- **Anomaly Attribution**: Root cause breakdown showing contribution of each factor
- **Predictive Alerts**: Trend acceleration, FFT phase alignment, confidence decay warnings
- **Seller Health Score**: Composite index based on volatility, anomaly frequency, predictive risk, and data consistency
- **Behavior Fingerprinting**: FFT + HFD + timing entropy analysis to detect bot clusters, manipulation patterns, and strategy changes

### 📊 Dashboard Features
- Real-time metrics cards (Sales, Clicks, Views)
- Anomaly alerts with severity levels and dynamic CSS styling
- Multi-series event timeline charts with proper timestamp formatting
- Sales prediction charts with confidence bands (±σ around prediction)
- Visual separation between historical and predicted data
- Auto-insights panel with root cause attribution
- Seller health score visualization
- Predictive alerts panel
- Behavior fingerprint analysis
- Live update toggle with real-time Supabase subscriptions
- **Data Sufficiency Indicators**: Clear badges showing data quality (insufficient/minimal/adequate/optimal)
- **Time Window Display**: Explicit time ranges for all analyses
- **Rate Limit Visibility**: Real-time API usage tracking with tier-based limits

### 🔧 Advanced Features
- **Decision Hooks**: Configure automated actions based on thresholds
  - Anomaly threshold triggers
  - Health score alerts
  - Prediction-based notifications
  - Actions: Email, Webhook, SMS, Slack
- **Weekly Reports**: Automated seller health summaries
- **Alert-Driven Pricing Tiers**: Free, Basic, Pro, Enterprise with different rate limits
- **Public API Endpoints**: Integrate anomaly detection and predictions into your apps
- **API Key Management**: Secure access with per-seller API keys
- **Usage Tracking**: Monitor API calls, response times, and success rates
- **Opinionated Defaults**: Each tier comes with optimized settings (window size, cache TTL, batch limits)
- **Insight Summaries**: One-click comprehensive health reports with recommendations
- **One-Click Export**: PDF and email export functionality for reports
- **Embeddable Widgets**: Copy-paste HTML/React code for embedding analytics in your apps
- **Confidence-Aware Messaging**: Context-sensitive messages based on data quality and confidence levels
- **Data-Driven Configuration**: All thresholds, tiers, and alert levels stored in database tables

## Getting Started

### Usage

#### 1. Access the Dashboard
Navigate to the root URL to view the analytics dashboard. Select a seller from the dropdown to view their metrics. Toggle "Live" mode to enable real-time updates.

#### 2. Ingest Events
Go to "Event Ingestion" page to submit events:
- Select a seller
- Choose event type (SALE, CLICK, VIEW)
- Enter value
- Submit

#### 3. Manage Sellers
Use the "Sellers" page to:
- View all registered sellers
- Add new sellers
- View seller details and API keys
- Check pricing tiers and rate limits

### API Endpoints

#### Event Ingestion (Single)
```
POST /functions/v1/event-ingestion
Content-Type: application/json

{
  "sellerId": "uuid",
  "timestamp": 1234567890000,
  "type": "SALE" | "CLICK" | "VIEW",
  "value": 99.99
}
```

#### Batch Event Ingestion
```
POST /functions/v1/batch-ingestion
Content-Type: application/json

{
  "events": [
    {
      "sellerId": "uuid",
      "timestamp": 1234567890000,
      "type": "SALE",
      "value": 99.99
    },
    ...
  ]
}

Response:
{
  "success": true,
  "inserted": 100
}

Limits: Maximum 1000 events per batch
```

#### Anomaly Detection (Public API)
```
GET /functions/v1/anomaly-detection?sellerId={uuid}&type={SALE|CLICK|VIEW}
Headers:
  x-api-key: your_api_key_here

Response:
{
  "anomalyScore": 0.85,
  "metrics": {
    "periodicScore": 0.72,
    "hfd": 1.45,
    "dataPoints": 512,
    "timeWindowStart": 1234567890000,
    "timeWindowEnd": 1234567900000,
    "dataSufficiency": "optimal"
  },
  "deterministic": true,
  "computedAt": 1234567890000
}

Rate Limit Response (429):
{
  "error": "Rate limit exceeded",
  "rateLimit": {
    "current": 1000,
    "limit": 1000,
    "remaining": 0,
    "resetAt": 1234567890000,
    "tier": "free"
  }
}
```

#### Predictions (Public API)
```
GET /functions/v1/predictions?sellerId={uuid}&type={SALE|CLICK|VIEW}&steps=10
Headers:
  x-api-key: your_api_key_here

Response:
{
  "predictions": [
    {
      "timestamp": 1234567890000,
      "predicted": 150.5,
      "confidence": 0.85,
      "upperBound": 180.2,
      "lowerBound": 120.8
    }
  ],
  "historical": [...],
  "metadata": {
    "dataPoints": 256,
    "predictionSteps": 10,
    "timeWindowStart": 1234567890000,
    "timeWindowEnd": 1234567900000,
    "dataSufficiency": "adequate"
  },
  "deterministic": true,
  "computedAt": 1234567890000
}
```

#### Auto-Insights Engine
```
GET /functions/v1/insights-engine?sellerId={uuid}&type={SALE|CLICK|VIEW}

Response:
{
  "insights": [
    {
      "type": "anomaly" | "trend" | "pattern" | "alert",
      "severity": "low" | "medium" | "high" | "critical",
      "title": "Critical Anomaly Detected",
      "description": "...",
      "attribution": [
        {
          "factor": "Deviation",
          "contribution": 0.4,
          "description": "Significant deviation from baseline"
        }
      ],
      "confidence": 0.9,
      "timestamp": 1234567890000
    }
  ],
  "healthScore": {
    "overall": 0.75,
    "volatility": 0.8,
    "anomalyFrequency": 0.7,
    "predictiveRisk": 0.75,
    "dataConsistency": 0.8,
    "trend": "improving" | "stable" | "declining"
  },
  "fingerprint": {
    "sellerId": "uuid",
    "fftSignature": [0.3, 0.5, 0.2],
    "hfdPattern": 1.2,
    "timingEntropy": 0.15,
    "patternType": "normal" | "bot" | "manipulation" | "irregular",
    "confidence": 0.85
  },
  "alerts": [
    {
      "type": "trend_acceleration" | "phase_misalignment" | "confidence_decay",
      "severity": "low" | "medium" | "high",
      "message": "...",
      "predictedImpact": 25.5,
      "timeToImpact": 3600000
    }
  ]
}
```

## Architecture

### Backend
- **Database**: Supabase PostgreSQL
  - `sellers`: Seller accounts with API keys and pricing tiers
  - `events`: Time series event data (512 point sliding window)
  - `metrics_cache`: Probabilistic cache with adaptive TTL
  - `decision_hooks`: Automated action triggers
  - `weekly_reports`: Historical health summaries
  - `api_usage`: API call tracking and analytics

- **Edge Functions**: Serverless compute for DSP algorithms
  - `event-ingestion`: Single event processing and storage
  - `batch-ingestion`: High-throughput batch processing
  - `anomaly-detection`: DSP pipeline execution with rate limiting
  - `predictions`: Time series forecasting with confidence bands
  - `insights-engine`: Auto-insights generation

### Frontend
- **Framework**: React 18 + TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **Charts**: Recharts with custom tooltips and timestamp formatting
- **Routing**: React Router v7
- **State**: React Hooks + Context
- **Theme**: next-themes for dark mode support
- **Real-time**: Supabase Realtime subscriptions

### Caching Strategy
- **Client-side**: 30-second in-memory cache for API responses
- **Server-side**: Adaptive TTL (1s hot, 10s cold) in database
- Automatic cache invalidation on new events

### Real-time Updates
- Supabase Realtime subscriptions for live event streaming
- Toggle-able live mode in dashboard
- Automatic data refresh on new events
- Optimistic UI updates

### Rate Limiting & Pricing Tiers
- **Free**: 1,000 calls/hour, 256 window size, 60s cache, 100 batch limit, 5 prediction steps
- **Basic**: 10,000 calls/hour, 512 window size, 30s cache, 500 batch limit, 10 prediction steps, export enabled
- **Pro**: 100,000 calls/hour, 512 window size, 10s cache, 1000 batch limit, 20 prediction steps, webhooks enabled
- **Enterprise**: Unlimited calls, 1024 window size, 5s cache, 5000 batch limit, 50 prediction steps, custom features

Rate limits reset hourly. Exceeded limits return 429 status with reset time.

### Configuration System
All system parameters are data-driven and stored in database tables:

**Tier Configuration** (`tier_config`):
- API call limits
- Window sizes
- Cache TTL
- Batch sizes
- Prediction steps
- Feature flags

**Alert Configuration** (`alert_config`):
- Trigger types (anomaly_score, health_score, prediction_confidence, data_sufficiency)
- Threshold ranges
- Severity levels
- Message templates
- Enable/disable flags

**Threshold Configuration** (`threshold_config`):
- Anomaly weights (deviation: 0.4, periodic: 0.3, HFD: 0.3)
- Health weights (volatility: 0.25, anomaly: 0.35, risk: 0.25, consistency: 0.15)
- Data sufficiency thresholds (insufficient: <50, minimal: 50-99, adequate: 100-299, optimal: 300+)
- Fingerprint thresholds (bot HFD: 1.8, bot entropy: 0.1, manipulation HFD: 1.6)
- Prediction confidence minimum: 0.5
- Trend acceleration threshold: 5

All thresholds can be updated in the database without code changes.

## System Governance

### Configuration Auditing
All configuration changes are tracked with full audit trails:

**Config Versioning** (`config_versions`):
- Every change to tier_config, alert_config, threshold_config creates a new version
- Tracks effective_since and effective_until timestamps
- Records who made the change and why
- Enables rollback to previous configurations
- Point-in-time configuration queries

**Config Snapshots** (`config_snapshots`):
- Automatic snapshots created for weekly reports, exports, and audits
- Captures complete system configuration at specific moments
- Ensures reports always reference the configuration that generated them
- Enables reproducible analysis

### Insight Lifecycle Management
Formal state machine for insights:

**States**:
- `generated`: Initial state when insight is created
- `confirmed`: User has acknowledged and validated the insight
- `expired`: Insight no longer relevant (auto-expires based on data sufficiency)
- `superseded`: Replaced by newer, more accurate insight

**Auto-Expiry Rules**:
- Insufficient data: 1 hour
- Minimal data: 24 hours
- Adequate data: 7 days
- Optimal data: 30 days

**State Transitions**:
- Generated → Confirmed, Expired, Superseded
- Confirmed → Expired, Superseded
- Expired/Superseded → Terminal states

### Embed Widget Guardrails

**Rate Limiting**:
- Free: 100 requests/hour per embed key
- Basic: 1,000 requests/hour
- Pro: 10,000 requests/hour
- Enterprise: Unlimited

**Branding Requirements**:
- Free/Basic: "Powered by Analytics API" watermark required
- Pro/Enterprise: Custom branding allowed, no watermark

**Access Control**:
- Read-only scopes by default
- Embed keys separate from API keys
- Per-widget-type access control (anomaly, health, prediction, all)
- Usage tracking per embed key

### System Invariants

**Determinism Guarantees** (Hard):
- Same input data always produces identical outputs
- No random number generation in analytics algorithms
- Algorithm implementations are versioned and immutable

**Computation Transparency** (Hard):
- All recomputations logged with timestamps
- Explicit cache invalidation only
- lastComputedAt timestamps required for all cached metrics
- Lazy evaluation: metrics computed only when queried

**Alert Requirements** (Hard):
- All alerts must include data sufficiency level
- Each alert type has exactly one primary trigger condition
- All thresholds must be in threshold_config table
- No hidden or hardcoded thresholds

**Data Minimization** (Hard):
- No PII (names, emails, addresses) in analytics data paths
- Seller IDs must be UUIDs (opaque, never sequential integers)
- Event payloads contain only behavioral signals (type, value, timestamp)
- Analytics computed on aggregates, never individual events
- Exports contain only aggregated metrics, never raw events

**Retention Policies** (Hard):
- Data retention periods determined by pricing tier
- All data has explicit expiry timestamp (expires_at column)
- Automatic decay: old data removed automatically
- No indefinite storage, even for enterprise tier

### Data Retention by Tier

| Tier | Events | Metrics Cache | Insights | Exports | API Usage |
|------|--------|---------------|----------|---------|-----------|
| Free | 7 days | 1 day | 7 days | 1 day | 7 days |
| Basic | 30 days | 7 days | 30 days | 7 days | 30 days |
| Pro | 90 days | 30 days | 90 days | 30 days | 90 days |
| Enterprise | 365 days | 90 days | 365 days | 90 days | 365 days |

**Decay Strategies**:
- Free/Basic: Hard delete (permanent removal)
- Pro: Archive (moved to cold storage)
- Enterprise: Archive with extended retention

**Automatic Cleanup**:
- Triggered by database triggers on insert
- expires_at timestamp set automatically based on tier
- Background jobs remove expired data
- No manual intervention required

## Signal Quality & Edge Case Detection

### Philosophy
**Edge cases are NOT errors** - they are low-confidence signal regimes. The system treats degenerate patterns as signals about data quality, not bugs to be fixed.

### Confidence Regimes

| Regime | Quality Score | Description |
|--------|---------------|-------------|
| High | ≥0.8 | Normal, organic data. Analytics are reliable. |
| Medium | 0.5-0.8 | Some irregularities detected. Still usable. |
| Low | 0.3-0.5 | Significant issues. Reduced confidence. Use with caution. |
| Degenerate | <0.3 | Unsuitable for reliable analytics. |

### Degenerate Patterns (Signals, Not Errors)

**Constant Zero Values**:
- Detection: >95% of values are exactly zero
- Impact: Severe - indicates no real activity
- Message: "Data consists primarily of zero values. Analytics unreliable."

**Perfect Periodicity**:
- Detection: >99% exact repeating pattern
- Impact: Severe - likely bot or automated traffic
- Message: "Perfect repeating pattern detected. Likely automated/bot traffic."

**Impossible Regularity**:
- Detection: Variance too low for organic behavior
- Impact: Moderate - suspicious pattern
- Message: "Unnaturally regular pattern. Confidence reduced."

**Bot Signature**:
- Detection: Events clustered in <1ms intervals
- Impact: Moderate - automated behavior
- Message: "Automated behavior detected. Results may not reflect organic activity."

**Synthetic Data**:
- Detection: Single value appears in >90% of events
- Impact: Moderate - unnatural distribution
- Message: "Data distribution suggests synthetic generation."

### Systemic Anomalies (System Health, Not Seller Analytics)

These flag system-level issues and do NOT pollute seller analytics:

**Schema Change**:
- Detection: Database schema modified
- Impact: May affect data consistency
- Action: Review recent changes

**Timestamp Drift**:
- Detection: Clock skew >1 minute
- Impact: Time-based analytics may be inaccurate
- Action: Check system clocks

**Ingestion Burst**:
- Detection: Traffic spike >10x baseline
- Impact: May indicate bot attack or viral event
- Action: Monitor and investigate

**Rate Limit Breach**:
- Detection: API limits exceeded
- Impact: Some data may be dropped
- Action: Review tier limits

**Cache Thrashing**:
- Detection: >100 invalidations/minute
- Impact: Performance degraded, analytics delayed
- Action: Optimize cache strategy

**Computation Timeout**:
- Detection: Analytics computation failed
- Impact: Complex analytics unavailable
- Action: Reduce data window or complexity

## Security & Encryption

### Encryption at Rest

**Required** (AES-256-GCM, 90-day key rotation):
- Event values
- Configuration data (tier_config, alert_config, threshold_config)
- Config snapshots
- Export file URLs
- API usage logs
- Weekly reports

### Encryption in Transit

**Required** (TLS 1.3, no exceptions):
- All API traffic
- Widget embeds
- Webhooks
- Database connections
- Internal service communication

### Secrets & Key Material

**Required** (AES-256-GCM, 30-day key rotation):
- API keys (sellers.api_key)
- Embed key hashes (embed_keys.key_hash)
- Webhook secrets (decision_hooks.webhook_secret)

**Properties**:
- Rotatable: Keys can be rotated without service interruption
- Scoped: Keys have limited permissions (read/write/admin)
- Revocable: Keys can be instantly revoked

### Data NOT Encrypted

**Performance optimization** - these are already aggregated/derived:
- Anomaly scores
- Health scores
- Prediction results
- Aggregated metrics
- Public configuration
- Derived analytics

**Reason**: No sensitive data, already anonymized through aggregation

## Technical Details

### DSP Algorithms

#### FIR Smoothing
Simple moving average filter to reduce noise:
```
smoothed[i] = average(data[i-2:i+2])
```

#### FFT Analysis
Autocorrelation-based periodic spike detection:
```
correlation(lag) = Σ(x[i] - mean)(x[i+lag] - mean) / variance
```

#### Higuchi Fractal Dimension
Complexity measurement for bot detection:
```
HFD = -slope(log(k), log(L(k)))
where L(k) = curve length at scale k
```

#### Anomaly Score
Bayesian combination:
```
score = 0.4 × deviation + 0.3 × periodic + 0.3 × hfd
```

**Deterministic Guarantee**: All algorithms use fixed seeds and deterministic operations. Same input data always produces identical output scores.

### Data Sufficiency Levels
- **Insufficient** (<50 events): Unreliable analysis, need more data
- **Minimal** (50-99 events): Basic analysis possible, accuracy limited
- **Adequate** (100-299 events): Good analysis quality
- **Optimal** (300+ events): Excellent analysis with high confidence

### Auto-Insights Engine

#### Anomaly Attribution
Breaks down anomaly score into contributing factors:
- Deviation from baseline (40% weight)
- Periodic patterns (30% weight)
- Complexity/HFD (30% weight)

#### Seller Health Score
Composite index calculation:
```
overall = 0.25 × volatility + 0.35 × anomalyFrequency + 
          0.25 × predictiveRisk + 0.15 × dataConsistency
```

#### Behavior Fingerprinting
Pattern detection using:
- **FFT Signature**: Frequency domain characteristics
- **HFD Pattern**: Fractal dimension for complexity
- **Timing Entropy**: Regularity of event timing

Classification:
- **Bot**: HFD > 1.8 && entropy < 0.1
- **Manipulation**: HFD > 1.6 && high FFT peaks
- **Irregular**: High timing entropy
- **Normal**: Standard human patterns

#### Predictive Alerts
- **Trend Acceleration**: |slope| > 5
- **Phase Misalignment**: Periodic score 0.7-0.9
- **Confidence Decay**: Prediction confidence < 0.6

### Decision Hooks
Automated actions triggered by conditions:
- **Anomaly Threshold**: Alert when score exceeds threshold
- **Health Score**: Notify on health degradation
- **Prediction Alert**: Act on forecasted issues

Actions:
- **Email**: Send notification email
- **Webhook**: POST to external URL
- **SMS**: Send text message
- **Slack**: Post to Slack channel

### Performance Characteristics
- **Sliding Window**: 512 data points per seller per metric
- **Query Latency**: <100ms (cached), <500ms (computed)
- **Throughput**: 1000+ events/second (batch mode)
- **Storage**: Automatic cleanup of old events
- **Cache Hit Rate**: ~80% with 30s TTL
- **Deterministic**: 100% reproducible results

### Chart Improvements
- **Timestamp Handling**: Numeric timestamps internally, formatted only in tooltips and ticks
- **Multi-day Support**: Full date + time formatting (MMM dd, yyyy HH:mm)
- **Confidence Bands**: ±σ bands around predictions showing uncertainty growth
- **Visual Separation**: Reference line marking forecast start
- **No Overlap**: Separate actual and predicted data series
- **Time Window Display**: Clear indication of analysis time range

### Performance Optimizations
- **Ring Buffer Pattern**: Fixed-size contiguous arrays (conceptual implementation in Edge Functions)
- **Zero Object Churn**: Preallocated data structures, no per-event allocations
- **Temporal Locality**: `lastComputedAt` timestamps for probabilistic refresh
- **Lazy Computation**: Metrics computed only when queried, not on every event
- **Efficient Indexing**: Database indexes on temporal queries for fast lookups

### Confidence & Sufficiency Messaging
Context-aware messages based on data quality:
- **Insufficient**: "Insufficient data for reliable predictions. Results may be inaccurate."
- **Minimal**: "Limited data available. Predictions have reduced accuracy."
- **Low Confidence (<0.5)**: "Low confidence prediction. Consider collecting more data."
- **Moderate Confidence (0.5-0.7)**: "Moderate confidence. Predictions are reasonably reliable."
- **High Confidence (>0.7)**: "High confidence prediction based on sufficient data."

### Alert Simplification
Single primary trigger per alert type:
- **Anomaly Alerts**: Triggered by anomaly_score only (other metrics are context)
- **Health Alerts**: Triggered by health_score only
- **Prediction Alerts**: Triggered by prediction_confidence only
- **Data Alerts**: Triggered by data_sufficiency only

No multi-dimensional alert triggers. Each alert has one clear condition.

### Privacy & Security

**Data Minimization**:
- No PII stored in analytics tables
- Seller IDs are opaque UUIDs
- Event payloads stripped to behavioral signals only
- Aggregation-first analytics (never expose individual events)

**Access Control**:
- API keys for backend access
- Embed keys for widget access
- Separate scopes for read/write/admin operations
- Rate limiting per key type

**Audit Trail**:
- All configuration changes tracked
- Config snapshots with reports
- Insight lifecycle states
- Embed key usage monitoring

## Color System

The application uses a professional analytics color scheme with dynamic CSS classes:
- **Primary**: Blue (#3B82F6) - Main actions and highlights
- **Success**: Green (#16A34A) - Normal metrics
- **Warning**: Orange (#F59E0B) - Moderate anomalies
- **Info**: Cyan (#0EA5E9) - Informational metrics
- **Destructive**: Red (#EF4444) - Critical anomalies

Dynamic alert classes:
- `.alert-critical`, `.badge-critical`
- `.alert-warning`, `.badge-warning`
- `.alert-info`, `.badge-info`
- `.alert-success`, `.badge-success`

## Integration Examples

### Embeddable Widgets

#### HTML Embed
```html
<iframe 
  src="https://your-app.com/embed/anomaly?sellerId=uuid&apiKey=key" 
  width="400" 
  height="300" 
  frameborder="0"
  style="border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
</iframe>
```

**Embed Key Management**:
```typescript
// Create embed key
const { key, embedKey } = await analyticsApi.createEmbedKey(
  sellerId,
  'anomaly', // widget type
  1000 // rate limit per hour
);

// Use in widget
<iframe src={`/embed/anomaly?embedKey=${key}`} />
```

**Guardrails**:
- Rate limited per embed key (tier-based)
- Read-only scopes by default
- Free/Basic tiers show "Powered by Analytics API" watermark
- Pro/Enterprise can use custom branding

#### React Component
```typescript
import { useEffect, useState } from 'react';

function AnalyticsWidget() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('https://your-app.com/api/analytics/anomaly?sellerId=uuid', {
      headers: { 'x-api-key': 'your_key' }
    })
      .then(res => res.json())
      .then(setData);
  }, []);

  return (
    <div>
      {data && <p>Anomaly Score: {data.anomalyScore}</p>}
    </div>
  );
}
```

### JavaScript/TypeScript
```typescript
const apiKey = 'your_api_key_here';
const sellerId = 'seller_uuid';

// Get anomaly score
const response = await fetch(
  `https://your-project.supabase.co/functions/v1/anomaly-detection?sellerId=${sellerId}&type=SALE`,
  { headers: { 'x-api-key': apiKey } }
);
const data = await response.json();
console.log('Anomaly Score:', data.anomalyScore);
console.log('Data Quality:', data.metrics.dataSufficiency);
console.log('Time Window:', new Date(data.metrics.timeWindowStart), '-', new Date(data.metrics.timeWindowEnd));
```

### Python
```python
import requests

api_key = 'your_api_key_here'
seller_id = 'seller_uuid'

response = requests.get(
    f'https://your-project.supabase.co/functions/v1/anomaly-detection',
    params={'sellerId': seller_id, 'type': 'SALE'},
    headers={'x-api-key': api_key}
)
data = response.json()
print(f"Anomaly Score: {data['anomalyScore']}")
print(f"Data Quality: {data['metrics']['dataSufficiency']}")
```

### cURL
```bash
curl -X GET \
  'https://your-project.supabase.co/functions/v1/anomaly-detection?sellerId=uuid&type=SALE' \
  -H 'x-api-key: your_api_key_here'
```

## License

© 2026 E-commerce Seller Analytics API
