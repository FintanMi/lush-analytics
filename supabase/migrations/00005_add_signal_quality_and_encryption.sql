-- Signal quality tracking (edge cases as low-confidence regimes, not errors)
CREATE TABLE IF NOT EXISTS signal_quality (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('SALE', 'CLICK', 'VIEW')),
  quality_score DECIMAL NOT NULL CHECK (quality_score >= 0 AND quality_score <= 1),
  confidence_regime TEXT NOT NULL CHECK (confidence_regime IN ('high', 'medium', 'low', 'degenerate')),
  detected_patterns JSONB NOT NULL DEFAULT '{}',
  time_window_start TIMESTAMPTZ NOT NULL,
  time_window_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signal_quality_seller ON signal_quality(seller_id);
CREATE INDEX IF NOT EXISTS idx_signal_quality_regime ON signal_quality(confidence_regime);
CREATE INDEX IF NOT EXISTS idx_signal_quality_time ON signal_quality(time_window_start, time_window_end);

-- Degenerate behavior patterns (signals, not errors)
CREATE TABLE IF NOT EXISTS degenerate_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('constant_zero', 'perfect_periodicity', 'impossible_regularity', 'bot_signature', 'synthetic_data')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  confidence DECIMAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  evidence JSONB NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  impact_on_analytics TEXT NOT NULL DEFAULT 'low_confidence_regime'
);

CREATE INDEX IF NOT EXISTS idx_degenerate_patterns_seller ON degenerate_patterns(seller_id);
CREATE INDEX IF NOT EXISTS idx_degenerate_patterns_type ON degenerate_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_degenerate_patterns_unresolved ON degenerate_patterns(resolved_at) WHERE resolved_at IS NULL;

-- Systemic anomalies (system health, not seller analytics)
CREATE TABLE IF NOT EXISTS systemic_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anomaly_type TEXT NOT NULL CHECK (anomaly_type IN ('schema_change', 'timestamp_drift', 'ingestion_burst', 'rate_limit_breach', 'cache_thrashing', 'computation_timeout')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  affected_component TEXT NOT NULL,
  details JSONB NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_systemic_anomalies_type ON systemic_anomalies(anomaly_type);
CREATE INDEX IF NOT EXISTS idx_systemic_anomalies_severity ON systemic_anomalies(severity);
CREATE INDEX IF NOT EXISTS idx_systemic_anomalies_unresolved ON systemic_anomalies(resolved_at) WHERE resolved_at IS NULL;

-- Encryption metadata (track what's encrypted, not the keys themselves)
CREATE TABLE IF NOT EXISTS encryption_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  column_name TEXT,
  encryption_type TEXT NOT NULL CHECK (encryption_type IN ('at_rest', 'in_transit', 'key_material')),
  encryption_algorithm TEXT NOT NULL,
  key_rotation_policy TEXT NOT NULL,
  last_rotated_at TIMESTAMPTZ,
  next_rotation_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_encryption_metadata_table ON encryption_metadata(table_name);
CREATE INDEX IF NOT EXISTS idx_encryption_metadata_rotation ON encryption_metadata(next_rotation_at);

-- Insert encryption policies
INSERT INTO encryption_metadata (table_name, column_name, encryption_type, encryption_algorithm, key_rotation_policy) VALUES
  -- At rest encryption
  ('events', 'value', 'at_rest', 'AES-256-GCM', '90_days'),
  ('config_versions', 'config_data', 'at_rest', 'AES-256-GCM', '90_days'),
  ('config_snapshots', 'tier_config', 'at_rest', 'AES-256-GCM', '90_days'),
  ('config_snapshots', 'alert_config', 'at_rest', 'AES-256-GCM', '90_days'),
  ('config_snapshots', 'threshold_config', 'at_rest', 'AES-256-GCM', '90_days'),
  ('export_history', 'file_url', 'at_rest', 'AES-256-GCM', '30_days'),
  ('api_usage', 'endpoint', 'at_rest', 'AES-256-GCM', '90_days'),
  ('weekly_reports', 'report_data', 'at_rest', 'AES-256-GCM', '90_days'),
  
  -- Key material encryption
  ('sellers', 'api_key', 'key_material', 'AES-256-GCM', '30_days'),
  ('embed_keys', 'key_hash', 'key_material', 'SHA-256', 'never'),
  ('decision_hooks', 'webhook_secret', 'key_material', 'AES-256-GCM', '30_days')
ON CONFLICT DO NOTHING;

-- Signal quality rules (codified patterns)
CREATE TABLE IF NOT EXISTS signal_quality_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL UNIQUE,
  pattern_type TEXT NOT NULL,
  detection_threshold DECIMAL NOT NULL,
  confidence_impact TEXT NOT NULL CHECK (confidence_impact IN ('none', 'minor', 'moderate', 'severe')),
  description TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert signal quality rules
INSERT INTO signal_quality_rules (rule_name, pattern_type, detection_threshold, confidence_impact, description) VALUES
  ('constant_zero_values', 'constant_zero', 0.95, 'severe', 'More than 95% of values are exactly zero - indicates no real activity'),
  ('perfect_periodicity', 'perfect_periodicity', 0.99, 'severe', 'Values repeat with >99% regularity - likely bot or synthetic data'),
  ('impossible_regularity', 'impossible_regularity', 0.98, 'moderate', 'Variance too low for organic behavior - suspicious pattern'),
  ('single_value_dominance', 'synthetic_data', 0.90, 'moderate', 'Single value appears in >90% of events - unnatural distribution'),
  ('timestamp_clustering', 'bot_signature', 0.85, 'moderate', 'Events clustered in <1ms intervals - automated behavior'),
  ('round_number_bias', 'synthetic_data', 0.80, 'minor', 'Values heavily biased toward round numbers - possible manual entry or bot'),
  ('zero_entropy', 'degenerate', 1.0, 'severe', 'No variation in data - completely degenerate signal')
ON CONFLICT (rule_name) DO NOTHING;

-- RLS policies
ALTER TABLE signal_quality ENABLE ROW LEVEL SECURITY;
ALTER TABLE degenerate_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE systemic_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE encryption_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_quality_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their signal quality" ON signal_quality FOR SELECT USING (true);
CREATE POLICY "Users can view their degenerate patterns" ON degenerate_patterns FOR SELECT USING (true);
CREATE POLICY "Admins can view systemic anomalies" ON systemic_anomalies FOR SELECT USING (true);
CREATE POLICY "Anyone can view encryption metadata" ON encryption_metadata FOR SELECT USING (true);
CREATE POLICY "Anyone can view signal quality rules" ON signal_quality_rules FOR SELECT USING (true);

-- Add webhook_secret column to decision_hooks if not exists
ALTER TABLE decision_hooks ADD COLUMN IF NOT EXISTS webhook_secret TEXT;

-- Add encryption flag to tables that should be encrypted at rest
ALTER TABLE events ADD COLUMN IF NOT EXISTS encrypted BOOLEAN DEFAULT false;
ALTER TABLE export_history ADD COLUMN IF NOT EXISTS encrypted BOOLEAN DEFAULT false;
ALTER TABLE weekly_reports ADD COLUMN IF NOT EXISTS encrypted BOOLEAN DEFAULT false;