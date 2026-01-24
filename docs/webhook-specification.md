# Webhook Specification

## Exact Webhook Payload Schema (Deterministic, Auditable, Non-Leaky)

### Design Goals (Non-Negotiable)

A webhook payload must be:

1. **Purely derived** (never raw)
2. **Deterministic** (same input → same payload)
3. **Self-verifying** (hash + config)
4. **Window-scoped**
5. **Side-effect safe**

A webhook payload is a **signed receipt of a state transition**, not an event stream.

---

## 1.1 Canonical Webhook Envelope

This envelope is shared by all webhook event types.

```json
{
  "id": "whk_01HZX8F7W9M3Y7T4Q2A6B9",
  "type": "alert_triggered",
  "sellerId": "sel_8f92d0c3",
  "emittedAt": 1737225600000,
  "sequence": 412,
  "timeWindow": {
    "start": 1737222000000,
    "end": 1737225600000,
    "windowSizeMs": 3600000
  },
  "payload": { /* type-specific */ },
  "dataSufficiency": {
    "status": "sufficient",
    "requiredPoints": 120,
    "actualPoints": 147
  },
  "signalQuality": {
    "score": 0.91,
    "flags": []
  },
  "configVersion": "cfg_2024_11_03_0012",
  "reproducibilityHash": "sha256:9d3a7c1e8f…",
  "signature": "hmac-sha256:ab91e5..."
}
```

### Why This Preserves Determinism

- **sequence** is monotonic per seller
- **emittedAt** is derived from window end
- **payload** contains only computed outputs
- **reproducibilityHash** lets receivers verify recomputation
- **signature** is computed over a canonical JSON serialization

---

## 1.2 Event-Specific Payloads

### alert_triggered

```json
{
  "alertLevel": "warning",
  "alertType": "spike_detected",
  "anomalyScore": 0.87,
  "threshold": 0.75,
  "attribution": {
    "fft": 0.41,
    "hfd": 0.29,
    "trend": 0.17,
    "smoothedDeviation": 0.13
  },
  "healthImpact": -12
}
```

### prediction_updated

```json
{
  "horizon": 24,
  "unit": "hour",
  "predictions": [120, 118, 121, 130],
  "confidenceBands": {
    "lower": [100, 99, 102, 110],
    "upper": [140, 137, 142, 150]
  }
}
```

### insight_state_changed

```json
{
  "insightId": "ins_01HZV7R8",
  "previousState": "generated",
  "newState": "confirmed",
  "reason": "subsequent_data_confirmed"
}
```

---

## Hard Webhook Invariants

1. **Always reproducible**
2. **Always auditable**

---

## 2. Mapping Webhook Volume Directly into Pricing Tiers

This is where you get clean monetization without dark patterns.

### 2.1 Conceptual Model

Webhook usage is treated as:

- **Downstream compute amplification**

Every webhook represents:

- A downstream system reaction
- Operational value
- External coupling cost

So webhook volume becomes a **pricing signal**, not just rate-limiting.

---

### 2.2 Metrics You Track (Per Seller, Per Month)

```typescript
interface WebhookUsageMetrics {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  uniqueEventTypes: number;
  peakHourlyRate: number;
}
```

---

### 2.3 Tier Mapping (Data-Driven)

| Tier    | Monthly Webhook Deliveries | Event Types           | Notes                  |
|---------|----------------------------|-----------------------|------------------------|
| Free    | 0                          | –                     | No webhooks            |
| Basic   | ≤ 5,000                    | alert_triggered       | Alerts only            |
| Premium | ≤ 50,000                   | alerts + predictions  | Full analytics         |

**Important**: This table lives in centralized config, not code.

---

### 2.4 Enforcement Model

Webhooks beyond tier limit:

- Are **dropped deterministically**
- Drop reason **logged + surfaced in dashboard**

Drops:

- **Never affect analytics**
- Are **visible as usage signals**

Pricing endpoint exposes:

```json
{
  "tier": "premium",
  "webhookUsage": {
    "used": 38112,
    "limit": 50000,
    "remaining": 11888
  }
}
```

This aligns perfectly with:

- **Transparency**
- **Predictability**
- **No surprise bills**

---

## 3. Funnel DSL That Fits Your Config System

This is the most subtle piece — and where most analytics platforms fail.

### 3.1 Funnel Design Philosophy

A funnel is:

- A **windowed state machine**
- Over **aggregated counts**
- With **explicit sufficiency per step**

**Not** a query language.  
**Not** ad-hoc.

---

### 3.2 Funnel DSL (Config-Native)

```yaml
funnels:
  checkout_conversion_v1:
    version: 1
    description: View → Checkout → Payment
    window:
      sizeMs: 86400000
      slideMs: 3600000
    steps:
      - id: view
        eventType: VIEW
        minCount: 100
      - id: checkout
        eventType: CHECKOUT_STARTED
        minRatioFrom: view
        minRatio: 0.05
      - id: payment
        eventType: PAYMENT_SUCCEEDED
        minRatioFrom: checkout
        minRatio: 0.6
    dropoffAttribution:
      enabled: true
    sufficiency:
      minTotalEvents: 300
    output:
      includeConfidence: true
      includeAttribution: true
```

---

### 3.3 Funnel Evaluation Rules (Deterministic)

- Steps evaluated **strictly in order**
- Ratios computed from **same time window**
- **No cross-window joins**
- **No user-level stitching**
- **No inferred paths**

---

### 3.4 Funnel API

**Request:**

```
GET /funnels/:seller/checkout_conversion_v1
```

**Response:**

```json
{
  "funnelId": "checkout_conversion_v1",
  "steps": [
    { "id": "view", "count": 1200 },
    { "id": "checkout", "count": 210, "conversion": 0.175 },
    { "id": "payment", "count": 142, "conversion": 0.676 }
  ],
  "dropoff": {
    "view_to_checkout": 990,
    "checkout_to_payment": 68
  },
  "timeWindow": { "start": 1737222000000, "end": 1737225600000, "windowSizeMs": 3600000 },
  "dataSufficiency": { "status": "sufficient", "requiredPoints": 300, "actualPoints": 1552 },
  "confidenceMessage": "High confidence: sufficient data for reliable conversion analysis",
  "configVersion": "cfg_2024_11_03_0012",
  "reproducibilityHash": "sha256:a7f3c9d2e1..."
}
```

---

## Summary

This webhook specification ensures:

1. **Deterministic, auditable payloads** that can be reproduced
2. **Clean pricing integration** through webhook volume metrics
3. **Config-driven funnel analysis** without ad-hoc queries
4. **Transparency and predictability** for users

All webhook payloads are signed receipts of state transitions, never raw event streams.
