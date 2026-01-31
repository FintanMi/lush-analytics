export interface Seller {
  id: string;
  name: string;
  email: string | null;
  created_at: string;
  api_key?: string;
  pricing_tier?: 'free' | 'basic' | 'pro' | 'enterprise';
  api_calls_count?: number;
  api_calls_limit?: number;
  currency?: string;
}

export interface Event {
  id: string;
  seller_id: string;
  timestamp: number;
  type: 'SALE' | 'CLICK' | 'VIEW' | 'CHECKOUT_STARTED' | 'PAYMENT_SUCCEEDED';
  value: number;
  created_at: string;
}

export interface EventInput {
  sellerId: string;
  timestamp: number;
  type: 'SALE' | 'CLICK' | 'VIEW' | 'CHECKOUT_STARTED' | 'PAYMENT_SUCCEEDED';
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
  backpressure?: {
    queueDepth: number;
    avgProcessingTime: number;
    rejectionRate: number;
    throttledRequests: number;
  };
  quota?: {
    used: number;
    total: number;
    percentageUsed: number;
  };
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

// Webhook Types
export type WebhookEventType = 
  | 'anomaly_detected'
  | 'alert_triggered'
  | 'prediction_updated'
  | 'insight_state_changed'
  | 'weekly_report_ready'
  | 'pricing_tier_changed';

export interface WebhookRegistration {
  id: string;
  seller_id: string;
  url: string;
  event_types: WebhookEventType[];
  secret: string;
  enabled: boolean;
  retry_config: {
    maxRetries: number;
    backoffMs: number[];
  };
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface WebhookPayload {
  event_type: WebhookEventType;
  seller_id: string;
  timestamp: number;
  data: Record<string, unknown>;
  reproducibility_hash: string;
  config_version: string;
  time_window: {
    start: number;
    end: number;
  };
  data_sufficiency: 'insufficient' | 'minimal' | 'sufficient' | 'high';
  signal_quality: number;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: WebhookEventType;
  payload: WebhookPayload;
  reproducibility_hash: string;
  config_version: string;
  time_window: Record<string, unknown>;
  data_sufficiency: string;
  signal_quality: number;
  status: 'pending' | 'success' | 'failed' | 'dead_letter';
  attempts: number;
  last_attempt_at: string | null;
  response_code: number | null;
  response_body: string | null;
  error_message: string | null;
  created_at: string;
  delivered_at: string | null;
}

export interface WebhookDeadLetter {
  id: string;
  delivery_id: string;
  webhook_id: string;
  event_type: WebhookEventType;
  payload: WebhookPayload;
  final_error: string;
  attempts: number;
  created_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
}

export interface WebhookTestResult {
  success: boolean;
  status_code?: number;
  response_time_ms: number;
  error?: string;
}

// Funnel Types
export interface FunnelStep {
  type: Event['type'];
  order: number;
  label: string;
}

export interface FunnelTemplate {
  id: string;
  name: string;
  description: string | null;
  tier: 'free' | 'basic' | 'pro' | 'enterprise';
  steps: FunnelStep[];
  min_data_points: number;
  max_step_timeout_ms: number;
  window_alignment: 'hour' | 'day' | 'week';
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface FunnelConfig {
  id: string;
  seller_id: string;
  template_id: string;
  name: string;
  enabled: boolean;
  custom_steps: FunnelStep[] | null;
  window_hours: number;
  created_at: string;
  updated_at: string;
}

export interface FunnelStepResult {
  step: number;
  type: Event['type'];
  label: string;
  count: number;
  dropoff: number;
  dropoff_rate: number;
  sufficiency: 'insufficient' | 'minimal' | 'sufficient' | 'high';
  avg_time_from_previous_ms: number | null;
}

export interface FunnelDropOffAttribution {
  from_step: number;
  to_step: number;
  count: number;
  rate: number;
  reasons: Array<{
    reason: string;
    contribution: number;
  }>;
}

export interface FunnelResult {
  id: string;
  funnel_config_id: string;
  seller_id: string;
  window_start: string;
  window_end: string;
  total_entries: number;
  step_results: FunnelStepResult[];
  drop_off_attribution: FunnelDropOffAttribution[];
  confidence: number;
  data_sufficiency: 'insufficient' | 'minimal' | 'sufficient' | 'high';
  reproducibility_hash: string;
  config_version: string;
  computed_at: string;
}

export interface FunnelAnalysisRequest {
  funnel_config_id: string;
  window_hours?: number;
  force_recompute?: boolean;
}

// Advanced Signal Quality Metrics
export interface SignalToNoiseRatio {
  metric_type: string;
  seller_id: string;
  window_start: number;
  window_end: number;
  snr: number;
  signal_power: number;
  noise_power: number;
  confidence_impact: 'none' | 'minor' | 'moderate' | 'severe';
}

export interface EffectiveSampleSize {
  metric_type: string;
  seller_id: string;
  raw_count: number;
  effective_count: number;
  autocorrelation: number;
  adjustment_factor: number;
}

export interface WindowStabilityScore {
  seller_id: string;
  metric_type: string;
  stability_score: number;
  content_change_rate: number;
  rolling_variance: number;
  window_size: number;
}

export interface TemporalCoverage {
  seller_id: string;
  metric_type: string;
  expected_buckets: number;
  populated_buckets: number;
  coverage_percentage: number;
  gaps: Array<{ start: number; end: number }>;
}

export interface EntropyDrift {
  seller_id: string;
  metric_type: string;
  current_entropy: number;
  baseline_entropy: number;
  drift_magnitude: number;
  drift_direction: 'increasing' | 'decreasing' | 'stable';
  timing_entropy: number;
  value_entropy: number;
}

// Query Execution Metrics
export interface QueryPlanCostAccuracy {
  query_id: string;
  estimated_cost: number;
  actual_cost: number;
  delta: number;
  delta_percentage: number;
  plan_type: string;
}

export interface NodeExecutionSkew {
  query_id: string;
  node_id: string;
  execution_time_ms: number;
  median_time_ms: number;
  skew_ratio: number;
  is_bottleneck: boolean;
}

export interface ParallelismEfficiency {
  query_id: string;
  planned_parallelism: number;
  actual_parallelism: number;
  cpu_utilization: number;
  efficiency_score: number;
}

export interface CacheContributionRatio {
  query_id: string;
  total_result_size: number;
  cached_size: number;
  computed_size: number;
  cache_hit_ratio: number;
  time_saved_ms: number;
}

export interface PartialResultYieldTime {
  query_id: string;
  first_result_ms: number;
  total_time_ms: number;
  yield_efficiency: number;
  streaming_enabled: boolean;
}

// Reproducibility & Configuration Metrics
export interface ReproducibilityDriftRate {
  seller_id: string;
  metric_type: string;
  total_computations: number;
  drift_count: number;
  drift_rate: number;
  max_drift_magnitude: number;
  config_versions_tested: string[];
}

export interface ConfigSensitivityIndex {
  config_key: string;
  sensitivity_score: number;
  output_variance: number;
  tested_values: Array<{ value: any; output_delta: number }>;
}

export interface InvariantViolation {
  id: string;
  invariant_id: string;
  seller_id: string;
  query_id: string | null;
  tier: string;
  violation_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, unknown>;
  detected_at: string;
  resolved_at: string | null;
}

// User Engagement & Business Metrics
export interface InsightActionMetrics {
  seller_id: string;
  total_insights: number;
  acted_upon: number;
  action_rate: number;
  avg_action_latency_ms: number;
  action_types: Record<string, number>;
}

export interface AlertToActionLatency {
  alert_id: string;
  seller_id: string;
  alert_triggered_at: number;
  action_taken_at: number | null;
  latency_ms: number | null;
  action_type: string | null;
}

export interface FalsePositiveTolerance {
  seller_id: string;
  total_alerts: number;
  dismissed_alerts: number;
  false_positive_rate: number;
  alert_fatigue_score: number;
}

export interface RevenueAtRisk {
  seller_id: string;
  detected_issue: string;
  estimated_revenue_impact: number;
  currency: string;
  confidence: number;
  time_to_impact_hours: number;
  intervention_recommended: boolean;
}

export interface TierSaturationIndex {
  seller_id: string;
  tier: string;
  usage_percentage: number;
  saturation_score: number;
  projected_limit_breach_days: number | null;
  upgrade_recommended: boolean;
}

export interface AlertCostEfficiency {
  tier: string;
  period_start: string;
  period_end: string;
  total_alerts_delivered: number;
  tier_cost: number;
  cost_per_alert: number;
  value_score: number;
}

export interface UpgradeTriggerCorrelation {
  feature_name: string;
  usage_count: number;
  upgrade_count: number;
  correlation_score: number;
  avg_days_to_upgrade: number;
}

export interface ChurnAfterAlertStorms {
  seller_id: string;
  alert_storm_detected_at: string;
  alert_count_in_storm: number;
  churned: boolean;
  churned_at: string | null;
  days_to_churn: number | null;
}

// UI/UX Engagement Metrics
export interface UIEngagementMetrics {
  seller_id: string;
  confidence_message_read_rate: number;
  attribution_panel_usage_count: number;
  query_console_abandonment_rate: number;
  visualization_interaction_depth: number;
  avg_session_duration_ms: number;
}

// Time-Series Algorithm Results
export interface MatrixProfileResult {
  seller_id: string;
  metric_type: string;
  motifs: Array<{
    start_index: number;
    end_index: number;
    similarity_score: number;
  }>;
  discords: Array<{
    index: number;
    discord_score: number;
    is_anomaly: boolean;
  }>;
  computed_at: number;
}

export interface BayesianChangePoint {
  seller_id: string;
  metric_type: string;
  change_points: Array<{
    timestamp: number;
    probability: number;
    regime_before: string;
    regime_after: string;
  }>;
  current_regime: string;
  confidence: number;
}

export interface SeasonalHybridESDResult {
  seller_id: string;
  metric_type: string;
  anomalies: Array<{
    timestamp: number;
    value: number;
    expected_value: number;
    deviation: number;
  }>;
  seasonality_detected: boolean;
  period: number | null;
}

export interface CopulaDependencyDrift {
  seller_id: string;
  metric_pair: [string, string];
  baseline_dependency: number;
  current_dependency: number;
  drift_magnitude: number;
  relationship_broken: boolean;
}

export interface DTWDistanceToBaseline {
  seller_id: string;
  metric_type: string;
  dtw_distance: number;
  baseline_signature: number[];
  current_signature: number[];
  similarity_score: number;
}

// Visualization Data Structures
export interface LiveDAGNode {
  node_id: string;
  node_type: string;
  latency_ms: number;
  cost: number;
  cache_usage: number;
  invariants_checked: string[];
  reproducibility_hash: string;
  data_sufficiency: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface LiveDAGEdge {
  from_node: string;
  to_node: string;
  data_flow_mb: number;
  latency_contribution_ms: number;
}

export interface LiveDAGHeatmap {
  query_id: string;
  nodes: LiveDAGNode[];
  edges: LiveDAGEdge[];
  total_latency_ms: number;
  bottleneck_nodes: string[];
}

export interface TimeToInsightTimeline {
  query_id: string;
  seller_id: string;
  stages: Array<{
    stage: 'ingestion' | 'computation' | 'anomaly_detection' | 'insight_generation' | 'alert_delivery' | 'user_action';
    start_ms: number;
    end_ms: number;
    duration_ms: number;
    status: 'completed' | 'failed' | 'skipped';
  }>;
  total_time_to_insight_ms: number;
  total_time_to_action_ms: number | null;
}

export interface AttributionWaterfall {
  insight_id: string;
  components: Array<{
    component: string;
    raw_score: number;
    smoothed_score: number;
    contribution_percentage: number;
  }>;
  total_score: number;
  confidence: number;
}

export interface FrequencyDomainData {
  seller_id: string;
  metric_type: string;
  frequencies: number[];
  magnitudes: number[];
  phases: number[];
  dominant_frequency: number;
  bot_fingerprint_match: boolean;
  bot_confidence: number;
}

export interface SignalQualityOverlay {
  timestamp: number;
  confidence_band_upper: number;
  confidence_band_lower: number;
  sufficiency_score: number;
  degraded_mode: boolean;
  quality_indicators: {
    snr: number;
    ess: number;
    stability: number;
    coverage: number;
  };
}
