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

export interface TierConfig {
  tier: 'free' | 'basic' | 'pro' | 'enterprise';
  apiCallsLimit: number;
  windowSize: number;
  cacheTtlSeconds: number;
  maxBatchSize: number;
  predictionSteps: number;
  features: Record<string, boolean>;
}

export interface AlertConfig {
  id: string;
  name: string;
  triggerType: 'anomaly_score' | 'health_score' | 'prediction_confidence' | 'data_sufficiency';
  thresholdMin: number | null;
  thresholdMax: number | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  messageTemplate: string;
  enabled: boolean;
}

export interface ThresholdConfig {
  key: string;
  value: number;
  description: string;
  category: string;
}

export interface ExportRequest {
  sellerId: string;
  exportType: 'pdf' | 'csv' | 'json' | 'email';
  format: string;
  metadata?: Record<string, unknown>;
}

export interface ExportHistory {
  id: string;
  seller_id: string;
  export_type: 'pdf' | 'csv' | 'json' | 'email';
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  completed_at: string | null;
}

export interface InsightSummary {
  sellerId: string;
  period: string;
  overallHealth: number;
  anomalyCount: number;
  topIssue: string;
  recommendation: string;
  confidence: number;
  dataSufficiency: 'insufficient' | 'minimal' | 'adequate' | 'optimal';
}

export interface ConfigVersion {
  id: string;
  table_name: string;
  record_id: string;
  config_data: Record<string, unknown>;
  effective_since: string;
  effective_until: string | null;
  changed_by: string | null;
  change_reason: string | null;
  created_at: string;
}

export interface ConfigSnapshot {
  id: string;
  snapshot_type: 'weekly_report' | 'export' | 'audit';
  reference_id: string | null;
  tier_config: Record<string, unknown>;
  alert_config: Record<string, unknown>;
  threshold_config: Record<string, unknown>;
  created_at: string;
}

export interface InsightLifecycle {
  id: string;
  insight_id: string;
  seller_id: string;
  insight_data: Record<string, unknown>;
  state: 'generated' | 'confirmed' | 'expired' | 'superseded';
  generated_at: string;
  confirmed_at: string | null;
  expired_at: string | null;
  superseded_by: string | null;
  superseded_at: string | null;
  data_sufficiency: string;
  confidence_score: number;
  created_at: string;
}

export interface EmbedKey {
  id: string;
  seller_id: string;
  key_hash: string;
  key_prefix: string;
  widget_type: 'anomaly' | 'health' | 'prediction' | 'all';
  rate_limit_per_hour: number;
  scopes: string[];
  enabled: boolean;
  created_at: string;
  last_used_at: string | null;
  usage_count: number;
}

export interface SystemInvariant {
  id: string;
  category: 'determinism' | 'computation' | 'alerts' | 'data_minimization' | 'retention';
  invariant_name: string;
  description: string;
  enforcement_level: 'hard' | 'soft' | 'advisory';
  validation_query: string | null;
  created_at: string;
  updated_at: string;
}

export interface RetentionPolicy {
  id: string;
  tier: string;
  data_type: 'events' | 'metrics_cache' | 'insights' | 'exports' | 'api_usage';
  retention_days: number;
  decay_strategy: 'hard_delete' | 'soft_delete' | 'archive';
  last_cleanup_at: string | null;
  created_at: string;
}

export interface SignalQuality {
  id: string;
  seller_id: string;
  metric_type: 'SALE' | 'CLICK' | 'VIEW';
  quality_score: number;
  confidence_regime: 'high' | 'medium' | 'low' | 'degenerate';
  detected_patterns: Record<string, unknown>;
  time_window_start: string;
  time_window_end: string;
  created_at: string;
}

export interface DegeneratePattern {
  id: string;
  seller_id: string;
  pattern_type: 'constant_zero' | 'perfect_periodicity' | 'impossible_regularity' | 'bot_signature' | 'synthetic_data';
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  evidence: Record<string, unknown>;
  detected_at: string;
  resolved_at: string | null;
  impact_on_analytics: string;
}

export interface SystemicAnomaly {
  id: string;
  anomaly_type: 'schema_change' | 'timestamp_drift' | 'ingestion_burst' | 'rate_limit_breach' | 'cache_thrashing' | 'computation_timeout';
  severity: 'info' | 'warning' | 'critical';
  affected_component: string;
  details: Record<string, unknown>;
  detected_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
}

export interface EncryptionMetadata {
  id: string;
  table_name: string;
  column_name: string | null;
  encryption_type: 'at_rest' | 'in_transit' | 'key_material';
  encryption_algorithm: string;
  key_rotation_policy: string;
  last_rotated_at: string | null;
  next_rotation_at: string | null;
  created_at: string;
}

export interface SignalQualityRule {
  id: string;
  rule_name: string;
  pattern_type: string;
  detection_threshold: number;
  confidence_impact: 'none' | 'minor' | 'moderate' | 'severe';
  description: string;
  enabled: boolean;
  created_at: string;
}
