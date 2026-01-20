export interface Seller {
  id: string;
  name: string;
  email: string | null;
  created_at: string;
  api_key?: string;
  pricing_tier?: 'free' | 'basic' | 'pro' | 'enterprise';
  api_calls_count?: number;
  api_calls_limit?: number;
}

export interface Event {
  id: string;
  seller_id: string;
  timestamp: number;
  type: 'SALE' | 'CLICK' | 'VIEW';
  value: number;
  created_at: string;
}

export interface EventInput {
  sellerId: string;
  timestamp: number;
  type: 'SALE' | 'CLICK' | 'VIEW';
  value: number;
}

export interface BatchEventInput {
  events: EventInput[];
}

export interface AnomalyMetrics {
  periodicScore: number;
  hfd: number;
  dataPoints: number;
  timeWindowStart: number;
  timeWindowEnd: number;
  dataSufficiency: 'insufficient' | 'minimal' | 'adequate' | 'optimal';
}

export interface AnomalyResponse {
  anomalyScore: number;
  metrics: AnomalyMetrics;
  message?: string;
  deterministic: boolean;
  computedAt: number;
}

export interface PredictionPoint {
  timestamp: number;
  predicted: number;
  confidence: number;
  upperBound?: number;
  lowerBound?: number;
}

export interface HistoricalPoint {
  timestamp: number;
  value: number;
}

export interface PredictionResponse {
  predictions: PredictionPoint[];
  historical: HistoricalPoint[];
  metadata: {
    dataPoints: number;
    predictionSteps: number;
    timeWindowStart: number;
    timeWindowEnd: number;
    dataSufficiency: 'insufficient' | 'minimal' | 'adequate' | 'optimal';
  };
  message?: string;
  deterministic: boolean;
  computedAt: number;
}

export interface MetricsCache {
  id: string;
  seller_id: string;
  metric_type: string;
  data: Record<string, unknown>;
  last_computed: string;
  ttl: number;
  created_at: string;
}

export interface InsightAttribution {
  factor: string;
  contribution: number;
  description: string;
}

export interface AutoInsight {
  type: 'anomaly' | 'trend' | 'pattern' | 'alert';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  attribution: InsightAttribution[];
  confidence: number;
  timestamp: number;
}

export interface SellerHealthScore {
  overall: number;
  volatility: number;
  anomalyFrequency: number;
  predictiveRisk: number;
  dataConsistency: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface BehaviorFingerprint {
  sellerId: string;
  fftSignature: number[];
  hfdPattern: number;
  timingEntropy: number;
  patternType: 'normal' | 'bot' | 'manipulation' | 'irregular';
  confidence: number;
}

export interface PredictiveAlert {
  type: 'trend_acceleration' | 'phase_misalignment' | 'confidence_decay';
  severity: 'low' | 'medium' | 'high';
  message: string;
  predictedImpact: number;
  timeToImpact: number;
}

export interface DecisionHook {
  id: string;
  seller_id: string;
  trigger_type: 'anomaly_threshold' | 'health_score' | 'prediction_alert';
  threshold_value: number;
  action: 'email' | 'webhook' | 'sms' | 'slack';
  action_config: Record<string, unknown>;
  enabled: boolean;
  created_at: string;
}

export interface WeeklyReport {
  id: string;
  seller_id: string;
  week_start: string;
  week_end: string;
  total_events: number;
  anomaly_count: number;
  avg_health_score: number;
  top_insights: AutoInsight[];
  generated_at: string;
}

export interface RateLimitStatus {
  current: number;
  limit: number;
  remaining: number;
  resetAt: number;
  tier: 'free' | 'basic' | 'pro' | 'enterprise';
}

export interface ApiUsageStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  avgResponseTime: number;
  lastCallAt: number;
}
