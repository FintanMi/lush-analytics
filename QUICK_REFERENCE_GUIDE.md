# Quick Reference Guide - New Analytics Systems

## Analytics Capability Registry

### Basic Usage

```typescript
import { 
  ANALYTICS_REGISTRY,
  getCapabilityById,
  getCapabilitiesByCategory,
  getCapabilitiesByTier,
  estimateQueryCost,
  canRunInParallel
} from '@/config/analytics-registry';

// Get a specific capability
const fftCapability = getCapabilityById('fft_analysis');
console.log(fftCapability.primaryQuestion); // "What are the dominant periodic patterns?"
console.log(fftCapability.costClass); // "medium"

// Get all DSP capabilities
const dspCapabilities = getCapabilitiesByCategory('DSP');

// Get capabilities available for free tier
const freeCapabilities = getCapabilitiesByTier('free');

// Estimate query cost
const queryCapabilities = ['fft_analysis', 'z_score_anomaly', 'arima_forecast'];
const cost = estimateQueryCost(queryCapabilities); // Returns: 1 + 1 + 5 = 7

// Check if can run in parallel
const canParallel = canRunInParallel(queryCapabilities); // Returns: false (ARIMA is non-deterministic)
```

### Tier Gating

```typescript
import { getCapabilitiesByTier } from '@/config/analytics-registry';

function checkCapabilityAccess(capabilityId: string, userTier: 'free' | 'basic' | 'pro' | 'enterprise'): boolean {
  const capability = getCapabilityById(capabilityId);
  if (!capability) return false;
  
  const tierHierarchy = {
    free: ['free'],
    basic: ['free', 'basic'],
    pro: ['free', 'basic', 'pro'],
    enterprise: ['free', 'basic', 'pro', 'enterprise'],
  };
  
  return tierHierarchy[userTier].includes(capability.defaultTier);
}

// Usage
const canUseLSTM = checkCapabilityAccess('lstm_forecast', 'basic'); // false
const canUseFFT = checkCapabilityAccess('fft_analysis', 'basic'); // true
```

### Auto-UI Generation

```typescript
import { generateUIMetadata } from '@/config/analytics-registry';

function renderCapabilityCard(capabilityId: string) {
  const metadata = generateUIMetadata(capabilityId);
  if (!metadata) return null;
  
  return (
    <Card className={`border-${metadata.color}-500`}>
      <CardHeader>
        <CardTitle>
          {metadata.icon} {metadata.displayName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <h4>Requirements:</h4>
          <ul>
            {metadata.requiresInput.map(req => (
              <li key={req}>{req}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## Visualization Decision Mapping

### Basic Usage

```typescript
import {
  getVisualizationDecisionMap,
  getAvailableActions,
  createStateTransition
} from '@/config/visualization-decision-mapping';

// Get decision map for a component
const fftMap = getVisualizationDecisionMap('FrequencyDomainExplorer');
console.log(fftMap.primaryQuestion); // "What periodic patterns indicate manipulation?"
console.log(fftMap.decisionEnabled); // "Identify seller health risk through periodic behavior"

// Get available actions based on current state
const currentState = {
  manipulation_detected: true,
  high_drift: false
};

const actions = getAvailableActions('FrequencyDomainExplorer', currentState);
// Returns: [{ label: 'Flag Seller', action: 'flag_seller_risk' }, ...]

// Track state transition
const transition = createStateTransition(
  'FrequencyDomainExplorer',
  'fft_computed',
  'periodic_pattern_detected',
  { frequency: 0.5, amplitude: 2.3 }
);
```

### Implementing Action Buttons

```typescript
import { getVisualizationDecisionMap } from '@/config/visualization-decision-mapping';

function VisualizationWithActions({ componentName, currentState }) {
  const decisionMap = getVisualizationDecisionMap(componentName);
  const actions = getAvailableActions(componentName, currentState);
  
  const handleAction = (action: string) => {
    switch (action) {
      case 'flag_seller_risk':
        // Implement seller flagging logic
        break;
      case 'optimize_query':
        // Implement query optimization
        break;
      // ... other actions
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{decisionMap.primaryQuestion}</CardTitle>
        <CardDescription>{decisionMap.decisionEnabled}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Visualization content */}
      </CardContent>
      <CardFooter className="flex gap-2">
        {actions.map(action => (
          <Button
            key={action.action}
            onClick={() => handleAction(action.action)}
          >
            {action.label}
          </Button>
        ))}
      </CardFooter>
    </Card>
  );
}
```

### Tracking Insight Flow

```typescript
import { createStateTransition } from '@/config/visualization-decision-mapping';

// Track the full insight lifecycle
const transitions = [
  createStateTransition('FrequencyDomainExplorer', 'time_domain_data', 'fft_computed'),
  createStateTransition('FrequencyDomainExplorer', 'fft_computed', 'periodic_pattern_detected'),
  createStateTransition('FrequencyDomainExplorer', 'periodic_pattern_detected', 'manipulation_flagged'),
  createStateTransition('FrequencyDomainExplorer', 'manipulation_flagged', 'seller_health_risk_escalated'),
];

// Send to analytics
transitions.forEach(t => {
  analytics.track('insight_state_transition', t);
});
```

---

## User Feedback System

### Recording Feedback

```typescript
import {
  recordInsightConfirmation,
  recordInsightDismissal,
  recordInsightAction,
  recordFalsePositive
} from '@/services/insight-feedback';

// User confirmed insight was correct
recordInsightConfirmation(
  'insight-123',
  'anomaly',
  'seller-456',
  'user-789',
  { algorithm: 'z_score', threshold: 3.0, confidence: 0.85 }
);

// User dismissed insight
recordInsightDismissal(
  'insight-124',
  'prediction',
  'seller-456',
  'user-789',
  'Not relevant to my business',
  { algorithm: 'arima', confidence: 0.65 }
);

// User acted on insight
const timeToAction = Date.now() - insightShownTimestamp;
recordInsightAction(
  'insight-125',
  'health_risk',
  'seller-456',
  'user-789',
  timeToAction,
  { algorithm: 'health_score', confidence: 0.92 }
);

// User marked as false positive
recordFalsePositive(
  'insight-126',
  'fingerprint_drift',
  'seller-456',
  'user-789',
  'This was expected behavior',
  { algorithm: 'dtw_baseline', threshold: 0.7 }
);
```

### Using Adaptive Thresholds

```typescript
import {
  getAdjustedConfidence,
  shouldShowInsight
} from '@/services/insight-feedback';

// Get adjusted confidence based on historical performance
const originalConfidence = 0.75;
const adjustedConfidence = getAdjustedConfidence(
  'anomaly',
  'z_score',
  originalConfidence,
  'seller-456' // Optional: seller-specific tuning
);

// Check if insight should be shown
const score = 3.2;
const originalThreshold = 3.0;
const shouldShow = shouldShowInsight(
  'anomaly',
  'z_score',
  score,
  originalThreshold,
  'seller-456'
);

if (shouldShow) {
  // Display insight with adjusted confidence
  displayInsight({
    type: 'anomaly',
    confidence: adjustedConfidence,
    score: score
  });
}
```

### Generating Quality Reports

```typescript
import { generateInsightQualityReport } from '@/services/insight-feedback';

const report = generateInsightQualityReport();

console.log('Summary:', report.summary);
// {
//   totalInsightTypes: 15,
//   avgPrecisionScore: 0.78,
//   avgActionRate: 0.42,
//   avgFalsePositiveRate: 0.12
// }

console.log('Top Performers:', report.topPerformers);
// [
//   { insightType: 'health_risk', algorithm: 'health_score', actionRate: 0.85, ... },
//   ...
// ]

console.log('Needs Improvement:', report.needsImprovement);
// [
//   { insightType: 'prediction', algorithm: 'arima', precisionScore: 0.45, ... },
//   ...
// ]

console.log('Recommendations:', report.recommendations);
// [
//   "prediction (arima) has low precision (45.0%). Consider tuning or disabling.",
//   ...
// ]
```

### Implementing Feedback UI

```typescript
import {
  recordInsightConfirmation,
  recordInsightDismissal,
  recordFalsePositive
} from '@/services/insight-feedback';

function InsightCard({ insight, sellerId, userId }) {
  const [showFeedback, setShowFeedback] = useState(false);
  const shownTimestamp = useRef(Date.now());
  
  const handleConfirm = () => {
    recordInsightConfirmation(
      insight.id,
      insight.type,
      sellerId,
      userId,
      insight.metadata
    );
    setShowFeedback(true);
  };
  
  const handleDismiss = () => {
    recordInsightDismissal(
      insight.id,
      insight.type,
      sellerId,
      userId,
      undefined,
      insight.metadata
    );
    setShowFeedback(true);
  };
  
  const handleFalsePositive = () => {
    recordFalsePositive(
      insight.id,
      insight.type,
      sellerId,
      userId,
      'Marked as false positive',
      insight.metadata
    );
    setShowFeedback(true);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{insight.title}</CardTitle>
        <CardDescription>
          Confidence: {(insight.confidence * 100).toFixed(0)}%
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>{insight.description}</p>
      </CardContent>
      <CardFooter className="flex gap-2">
        {!showFeedback ? (
          <>
            <Button onClick={handleConfirm} variant="default">
              ✓ Helpful
            </Button>
            <Button onClick={handleDismiss} variant="outline">
              Dismiss
            </Button>
            <Button onClick={handleFalsePositive} variant="destructive">
              False Positive
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Thank you for your feedback!
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
```

---

## Integration Example: Complete Flow

```typescript
import { getCapabilityById, estimateQueryCost } from '@/config/analytics-registry';
import { getVisualizationDecisionMap, createStateTransition } from '@/config/visualization-decision-mapping';
import { shouldShowInsight, recordInsightAction } from '@/services/insight-feedback';

async function runAnalyticsWithFeedback(
  sellerId: string,
  userId: string,
  capabilityId: string
) {
  // 1. Check capability access
  const capability = getCapabilityById(capabilityId);
  if (!capability) throw new Error('Capability not found');
  
  // 2. Estimate cost
  const cost = estimateQueryCost([capabilityId]);
  console.log(`Estimated cost: ${cost}`);
  
  // 3. Run analytics
  const result = await runAnalytics(capabilityId, sellerId);
  
  // 4. Check if insight should be shown (adaptive threshold)
  const shouldShow = shouldShowInsight(
    'anomaly',
    capability.id,
    result.score,
    result.threshold,
    sellerId
  );
  
  if (!shouldShow) {
    console.log('Insight suppressed due to low historical precision');
    return null;
  }
  
  // 5. Track state transition
  const transition = createStateTransition(
    'AnomalyAlert',
    'normal_operation',
    'anomaly_detected',
    { score: result.score, threshold: result.threshold }
  );
  
  // 6. Get visualization decision map
  const decisionMap = getVisualizationDecisionMap('AnomalyAlert');
  
  // 7. Display insight with action buttons
  const insight = {
    id: `insight-${Date.now()}`,
    type: 'anomaly',
    title: decisionMap.primaryQuestion,
    description: decisionMap.decisionEnabled,
    confidence: result.confidence,
    metadata: {
      algorithm: capability.id,
      threshold: result.threshold,
      confidence: result.confidence
    }
  };
  
  // 8. When user acts on insight, record feedback
  const timeToAction = Date.now() - transition.timestamp;
  recordInsightAction(
    insight.id,
    'anomaly',
    sellerId,
    userId,
    timeToAction,
    insight.metadata
  );
  
  return insight;
}
```

---

## Best Practices

### 1. Always Use Registry for Capabilities
❌ **Don't**: Hardcode capability metadata
```typescript
const fftConfig = {
  minWindow: 128,
  costClass: 'medium',
  // ... hardcoded values
};
```

✅ **Do**: Use registry
```typescript
const fftCapability = getCapabilityById('fft_analysis');
const minWindow = fftCapability.inputRequirements.minWindow;
```

### 2. Track All Insight State Transitions
❌ **Don't**: Skip state tracking
```typescript
// Just show the insight
showInsight(insight);
```

✅ **Do**: Track the full lifecycle
```typescript
const transitions = [
  createStateTransition('AnomalyAlert', 'normal', 'detected'),
  createStateTransition('AnomalyAlert', 'detected', 'user_notified'),
];
transitions.forEach(t => analytics.track('transition', t));
showInsight(insight);
```

### 3. Always Collect User Feedback
❌ **Don't**: Show insights without feedback mechanism
```typescript
<Card>
  <CardContent>{insight.description}</CardContent>
</Card>
```

✅ **Do**: Include feedback buttons
```typescript
<Card>
  <CardContent>{insight.description}</CardContent>
  <CardFooter>
    <Button onClick={handleConfirm}>Helpful</Button>
    <Button onClick={handleDismiss}>Dismiss</Button>
    <Button onClick={handleFalsePositive}>False Positive</Button>
  </CardFooter>
</Card>
```

### 4. Use Adaptive Thresholds
❌ **Don't**: Use static thresholds
```typescript
if (score > 3.0) {
  showInsight(insight);
}
```

✅ **Do**: Use adaptive thresholds
```typescript
if (shouldShowInsight('anomaly', 'z_score', score, 3.0, sellerId)) {
  const adjustedConfidence = getAdjustedConfidence('anomaly', 'z_score', confidence, sellerId);
  showInsight({ ...insight, confidence: adjustedConfidence });
}
```

### 5. Generate Regular Quality Reports
```typescript
// Run weekly
setInterval(() => {
  const report = generateInsightQualityReport();
  
  // Alert on low precision
  if (report.summary.avgPrecisionScore < 0.6) {
    alertAdmin('Low insight precision detected', report);
  }
  
  // Log recommendations
  report.recommendations.forEach(rec => {
    console.warn('Recommendation:', rec);
  });
}, 7 * 24 * 60 * 60 * 1000); // Weekly
```

---

## Troubleshooting

### Issue: Insights not showing
**Check**:
1. Is the capability available for the user's tier?
2. Is the adaptive threshold suppressing it?
3. Is the data sufficient?

```typescript
const capability = getCapabilityById(capabilityId);
console.log('Tier:', capability.defaultTier);
console.log('Should show:', shouldShowInsight(...));
console.log('Data points:', dataPoints, 'Min required:', capability.inputRequirements.minWindow);
```

### Issue: High false positive rate
**Solution**: The system will automatically tune thresholds, but you can also:
1. Check the quality report
2. Manually adjust thresholds
3. Disable low-performing algorithms

```typescript
const report = generateInsightQualityReport();
const problematic = report.needsImprovement;
problematic.forEach(metric => {
  console.log(`${metric.insightType} (${metric.algorithm}): ${metric.falsePositiveRate * 100}% FP rate`);
});
```

### Issue: Low action rate
**Check**:
1. Are insights actionable?
2. Are action buttons visible?
3. Is the decision mapping clear?

```typescript
const decisionMap = getVisualizationDecisionMap(componentName);
console.log('Primary question:', decisionMap.primaryQuestion);
console.log('Decision enabled:', decisionMap.decisionEnabled);
console.log('Action buttons:', decisionMap.actionButtons);
```

---

## Performance Tips

1. **Cache capability lookups**:
```typescript
const capabilityCache = new Map();
function getCachedCapability(id: string) {
  if (!capabilityCache.has(id)) {
    capabilityCache.set(id, getCapabilityById(id));
  }
  return capabilityCache.get(id);
}
```

2. **Batch feedback recording**:
```typescript
const feedbackQueue = [];
function queueFeedback(feedback) {
  feedbackQueue.push(feedback);
  if (feedbackQueue.length >= 10) {
    flushFeedbackQueue();
  }
}
```

3. **Lazy load decision maps**:
```typescript
const decisionMapCache = new Map();
function getLazyDecisionMap(componentName: string) {
  if (!decisionMapCache.has(componentName)) {
    decisionMapCache.set(componentName, getVisualizationDecisionMap(componentName));
  }
  return decisionMapCache.get(componentName);
}
```

---

## Next Steps

1. **Persist feedback to database**: Currently in-memory, should be persisted
2. **Add UI components**: Create reusable feedback components
3. **Implement quality dashboard**: Visualize insight quality metrics
4. **A/B test thresholds**: Test different threshold strategies
5. **ML-based optimization**: Use ML to optimize thresholds

For more details, see `IMPLEMENTATION_SUMMARY_2026_01_21_FINAL.md`.
