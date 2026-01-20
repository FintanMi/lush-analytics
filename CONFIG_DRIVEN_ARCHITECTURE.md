# Configuration-Driven Architecture

This document explains how the system eliminates hardcoded thresholds and tier-specific logic in favor of database-driven configuration.

## Core Principles

### 1. No Hardcoded Thresholds

**Rule**: ALL numeric thresholds MUST be stored in the `threshold_config` table.

**Before** (❌ Hardcoded):
```typescript
if (anomalyScore > 0.8) {
  triggerAlert();
}
```

**After** (✅ Config-driven):
```typescript
const threshold = await getThreshold('anomaly_critical');
if (anomalyScore > threshold.value) {
  triggerAlert();
}
```

### 2. No Tier-Specific Logic

**Rule**: Tier behavior MUST be determined by `tier_config` table, not code branches.

**Before** (❌ Hardcoded):
```typescript
if (tier === 'free') {
  windowSize = 256;
} else if (tier === 'pro') {
  windowSize = 512;
}
```

**After** (✅ Config-driven):
```typescript
const config = await getTierConfig(tier);
const windowSize = config.window_size;
```

### 3. Lazy Evaluation Only

**Rule**: Compute metrics ONLY when requested, never precompute.

**Before** (❌ Precomputation):
```typescript
// On event ingestion
async function ingestEvent(event) {
  await saveEvent(event);
  await computeAnomalyScore(event.sellerId);  // ❌ Precompute
  await computeHealthScore(event.sellerId);   // ❌ Precompute
  await computePredictions(event.sellerId);   // ❌ Precompute
}
```

**After** (✅ Lazy evaluation):
```typescript
// On event ingestion
async function ingestEvent(event) {
  await saveEvent(event);  // Only save, no computation
}

// On metric query
async function getAnomalyScore(sellerId) {
  const cached = await getCache(sellerId, 'anomaly');
  if (cached && !isStale(cached)) return cached;
  
  const score = await computeAnomalyScore(sellerId);  // ✅ Compute on demand
  await setCache(sellerId, 'anomaly', score);
  return score;
}
```

### 4. Centralized Visualization

**Rule**: Chart/widget logic MUST be centralized with props/config, not duplicated.

**Before** (❌ Duplicated):
```typescript
// In ComponentA.tsx
<LineChart data={data}>
  <XAxis dataKey="time" />
  <YAxis />
  <Line dataKey="value" stroke="#8884d8" />
</LineChart>

// In ComponentB.tsx (duplicate logic)
<LineChart data={data}>
  <XAxis dataKey="time" />
  <YAxis />
  <Line dataKey="value" stroke="#8884d8" />
</LineChart>
```

**After** (✅ Centralized):
```typescript
// BaseChart component
<BaseChart config={{
  type: 'line',
  data,
  xKey: 'time',
  yKeys: [{ key: 'value', color: '#8884d8' }]
}} />
```

## Implementation Guide

### Configuration Tables

#### threshold_config
```sql
CREATE TABLE threshold_config (
  id UUID PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  description TEXT,
  UNIQUE(category, name)
);
```

**Usage**:
```typescript
// Fetch thresholds
const thresholds = await supabase
  .from('threshold_config')
  .select('*')
  .eq('category', 'anomaly');

// Use in code
const criticalThreshold = thresholds.find(t => t.name === 'critical')?.value ?? 0.8;
```

#### tier_config
```sql
CREATE TABLE tier_config (
  tier TEXT PRIMARY KEY,
  window_size INTEGER NOT NULL,
  cache_ttl INTEGER NOT NULL,
  max_batch_size INTEGER NOT NULL,
  prediction_steps INTEGER NOT NULL,
  features JSONB NOT NULL
);
```

**Usage**:
```typescript
// Fetch tier config
const config = await supabase
  .from('tier_config')
  .select('*')
  .eq('tier', userTier)
  .single();

// Use in code
const windowSize = config.window_size;
const cacheTtl = config.cache_ttl;
```

#### signal_quality_rules
```sql
CREATE TABLE signal_quality_rules (
  id UUID PRIMARY KEY,
  pattern_type TEXT NOT NULL,
  detection_threshold NUMERIC NOT NULL,
  confidence_impact TEXT NOT NULL,
  description TEXT
);
```

**Usage**:
```typescript
// Fetch detection rules
const rules = await supabase
  .from('signal_quality_rules')
  .select('*');

// Use in code
const constantZeroRule = rules.find(r => r.pattern_type === 'constant_zero');
const detected = assessSignalQuality.detectConstantZero(
  values,
  constantZeroRule.detection_threshold
);
```

### Helper Functions

All helper functions accept thresholds/config as parameters:

```typescript
// ✅ Config-driven
export function getDataSufficiency(
  eventCount: number,
  thresholds: { name: string; value: number }[]
): 'insufficient' | 'minimal' | 'adequate' | 'optimal' {
  const insufficient = thresholds.find(t => t.name === 'data_insufficient')?.value ?? 50;
  const minimal = thresholds.find(t => t.name === 'data_minimal')?.value ?? 100;
  const adequate = thresholds.find(t => t.name === 'data_adequate')?.value ?? 300;

  if (eventCount < insufficient) return 'insufficient';
  if (eventCount < minimal) return 'minimal';
  if (eventCount < adequate) return 'adequate';
  return 'optimal';
}
```

### Centralized Charts

Use `BaseChart` and `MetricCard` components:

```typescript
import { BaseChart } from '@/components/charts/BaseChart';
import { MetricCard } from '@/components/charts/MetricCard';

// Line chart
<BaseChart config={{
  type: 'line',
  data: timeSeriesData,
  xKey: 'timestamp',
  yKeys: [
    { key: 'value', color: 'hsl(var(--primary))', name: 'Sales' }
  ],
  height: 300,
  showGrid: true,
  showLegend: true
}} />

// Metric card with chart
<MetricCard config={{
  title: 'Anomaly Score',
  description: 'Real-time anomaly detection',
  value: '0.73',
  change: { value: 12, label: 'vs last week', positive: false },
  chart: {
    type: 'area',
    data: historicalData,
    xKey: 'date',
    yKeys: [{ key: 'score', color: 'hsl(var(--destructive))' }]
  }
}} />
```

## Migration Checklist

- [x] Remove hardcoded thresholds from `src/config/analytics.ts`
- [x] Remove tier-specific logic from `src/config/invariants.ts`
- [x] Update signal quality functions to accept thresholds as parameters
- [x] Create `BaseChart` component for centralized visualization
- [x] Create `MetricCard` component for metric display
- [ ] Update analytics service to fetch config from database
- [ ] Update all API endpoints to use config-driven logic
- [ ] Update frontend components to use centralized charts
- [ ] Add config caching layer for performance
- [ ] Document config update procedures

## Benefits

1. **Flexibility**: Change thresholds without code deployment
2. **Auditability**: All config changes tracked in database
3. **Testability**: Easy to test with different configurations
4. **Maintainability**: Single source of truth for all behavior
5. **Performance**: Lazy evaluation reduces unnecessary computation
6. **Consistency**: Centralized charts ensure uniform UX
