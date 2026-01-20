-- Configuration tables for data-driven system

-- Tier configuration
CREATE TABLE IF NOT EXISTS tier_config (
  tier TEXT PRIMARY KEY CHECK (tier IN ('free', 'basic', 'pro', 'enterprise')),
  api_calls_limit INTEGER NOT NULL,
  window_size INTEGER NOT NULL DEFAULT 512,
  cache_ttl_seconds INTEGER NOT NULL DEFAULT 30,
  max_batch_size INTEGER NOT NULL DEFAULT 1000,
  prediction_steps INTEGER NOT NULL DEFAULT 10,
  features JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default tier configurations
INSERT INTO tier_config (tier, api_calls_limit, window_size, cache_ttl_seconds, max_batch_size, prediction_steps, features) VALUES
  ('free', 1000, 256, 60, 100, 5, '{"export": false, "realtime": false, "webhooks": false}'),
  ('basic', 10000, 512, 30, 500, 10, '{"export": true, "realtime": true, "webhooks": false}'),
  ('pro', 100000, 512, 10, 1000, 20, '{"export": true, "realtime": true, "webhooks": true}'),
  ('enterprise', -1, 1024, 5, 5000, 50, '{"export": true, "realtime": true, "webhooks": true, "custom": true}')
ON CONFLICT (tier) DO NOTHING;

-- Alert level configuration
CREATE TABLE IF NOT EXISTS alert_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('anomaly_score', 'health_score', 'prediction_confidence', 'data_sufficiency')),
  threshold_min DECIMAL,
  threshold_max DECIMAL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message_template TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default alert configurations
INSERT INTO alert_config (name, trigger_type, threshold_min, threshold_max, severity, message_template) VALUES
  ('critical_anomaly', 'anomaly_score', 0.8, NULL, 'critical', 'Critical anomaly detected: Score {score}. Immediate attention required.'),
  ('high_anomaly', 'anomaly_score', 0.6, 0.8, 'high', 'High anomaly detected: Score {score}. Investigation recommended.'),
  ('moderate_anomaly', 'anomaly_score', 0.4, 0.6, 'medium', 'Moderate anomaly detected: Score {score}. Monitor closely.'),
  ('low_health', 'health_score', NULL, 0.4, 'high', 'Seller health is low: {score}. Action needed.'),
  ('declining_health', 'health_score', 0.4, 0.6, 'medium', 'Seller health declining: {score}. Review metrics.'),
  ('low_confidence', 'prediction_confidence', NULL, 0.5, 'medium', 'Prediction confidence low: {score}. Insufficient data.'),
  ('insufficient_data', 'data_sufficiency', NULL, NULL, 'high', 'Insufficient data for reliable analysis. Need {required} more events.')
ON CONFLICT (name) DO NOTHING;

-- Threshold configuration
CREATE TABLE IF NOT EXISTS threshold_config (
  key TEXT PRIMARY KEY,
  value DECIMAL NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default thresholds
INSERT INTO threshold_config (key, value, description, category) VALUES
  ('anomaly.deviation_weight', 0.4, 'Weight for deviation in anomaly score', 'anomaly'),
  ('anomaly.periodic_weight', 0.3, 'Weight for periodic patterns in anomaly score', 'anomaly'),
  ('anomaly.hfd_weight', 0.3, 'Weight for HFD in anomaly score', 'anomaly'),
  ('health.volatility_weight', 0.25, 'Weight for volatility in health score', 'health'),
  ('health.anomaly_weight', 0.35, 'Weight for anomaly frequency in health score', 'health'),
  ('health.risk_weight', 0.25, 'Weight for predictive risk in health score', 'health'),
  ('health.consistency_weight', 0.15, 'Weight for data consistency in health score', 'health'),
  ('data.insufficient_threshold', 50, 'Minimum events for minimal analysis', 'data'),
  ('data.minimal_threshold', 100, 'Minimum events for adequate analysis', 'data'),
  ('data.adequate_threshold', 300, 'Minimum events for optimal analysis', 'data'),
  ('fingerprint.bot_hfd_threshold', 1.8, 'HFD threshold for bot detection', 'fingerprint'),
  ('fingerprint.bot_entropy_threshold', 0.1, 'Entropy threshold for bot detection', 'fingerprint'),
  ('fingerprint.manipulation_hfd_threshold', 1.6, 'HFD threshold for manipulation detection', 'fingerprint'),
  ('prediction.min_confidence', 0.5, 'Minimum acceptable prediction confidence', 'prediction'),
  ('trend.acceleration_threshold', 5, 'Slope threshold for trend acceleration alert', 'trend')
ON CONFLICT (key) DO NOTHING;

-- Add lastComputedAt to metrics_cache for temporal locality
ALTER TABLE metrics_cache ADD COLUMN IF NOT EXISTS last_computed_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE metrics_cache ADD COLUMN IF NOT EXISTS computation_count INTEGER DEFAULT 0;

-- Create index for efficient temporal queries
CREATE INDEX IF NOT EXISTS idx_metrics_cache_last_computed ON metrics_cache(last_computed_at);

-- Export history table
CREATE TABLE IF NOT EXISTS export_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL CHECK (export_type IN ('pdf', 'csv', 'json', 'email')),
  format TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  file_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_export_history_seller ON export_history(seller_id);
CREATE INDEX IF NOT EXISTS idx_export_history_status ON export_history(status);

-- RLS policies
ALTER TABLE tier_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE threshold_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tier config" ON tier_config FOR SELECT USING (true);
CREATE POLICY "Anyone can view alert config" ON alert_config FOR SELECT USING (true);
CREATE POLICY "Anyone can view threshold config" ON threshold_config FOR SELECT USING (true);
CREATE POLICY "Users can view their export history" ON export_history FOR SELECT USING (true);
CREATE POLICY "Users can create exports" ON export_history FOR INSERT WITH CHECK (true);