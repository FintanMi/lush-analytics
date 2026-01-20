-- Configuration versioning and audit trail
CREATE TABLE IF NOT EXISTS config_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  config_data JSONB NOT NULL,
  effective_since TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_until TIMESTAMPTZ,
  changed_by TEXT,
  change_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_config_versions_table ON config_versions(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_config_versions_effective ON config_versions(effective_since, effective_until);

-- Config snapshots for reports
CREATE TABLE IF NOT EXISTS config_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_type TEXT NOT NULL CHECK (snapshot_type IN ('weekly_report', 'export', 'audit')),
  reference_id UUID,
  tier_config JSONB NOT NULL,
  alert_config JSONB NOT NULL,
  threshold_config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_config_snapshots_type ON config_snapshots(snapshot_type);
CREATE INDEX IF NOT EXISTS idx_config_snapshots_reference ON config_snapshots(reference_id);

-- Insight lifecycle management
CREATE TABLE IF NOT EXISTS insight_lifecycle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_id UUID NOT NULL,
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  insight_data JSONB NOT NULL,
  state TEXT NOT NULL DEFAULT 'generated' CHECK (state IN ('generated', 'confirmed', 'expired', 'superseded')),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  superseded_by UUID REFERENCES insight_lifecycle(id),
  superseded_at TIMESTAMPTZ,
  data_sufficiency TEXT NOT NULL,
  confidence_score DECIMAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insight_lifecycle_seller ON insight_lifecycle(seller_id);
CREATE INDEX IF NOT EXISTS idx_insight_lifecycle_state ON insight_lifecycle(state);
CREATE INDEX IF NOT EXISTS idx_insight_lifecycle_generated ON insight_lifecycle(generated_at);

-- Embed keys for widget access control
CREATE TABLE IF NOT EXISTS embed_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  widget_type TEXT NOT NULL CHECK (widget_type IN ('anomaly', 'health', 'prediction', 'all')),
  rate_limit_per_hour INTEGER NOT NULL DEFAULT 100,
  scopes TEXT[] NOT NULL DEFAULT ARRAY['read'],
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_embed_keys_seller ON embed_keys(seller_id);
CREATE INDEX IF NOT EXISTS idx_embed_keys_hash ON embed_keys(key_hash);

-- Embed usage tracking
CREATE TABLE IF NOT EXISTS embed_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  embed_key_id UUID NOT NULL REFERENCES embed_keys(id) ON DELETE CASCADE,
  widget_type TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  hour_bucket TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(embed_key_id, widget_type, hour_bucket)
);

CREATE INDEX IF NOT EXISTS idx_embed_usage_key ON embed_usage(embed_key_id);
CREATE INDEX IF NOT EXISTS idx_embed_usage_hour ON embed_usage(hour_bucket);

-- System invariants documentation (stored as data)
CREATE TABLE IF NOT EXISTS system_invariants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('determinism', 'computation', 'alerts', 'data_minimization', 'retention')),
  invariant_name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  enforcement_level TEXT NOT NULL CHECK (enforcement_level IN ('hard', 'soft', 'advisory')),
  validation_query TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert system invariants
INSERT INTO system_invariants (category, invariant_name, description, enforcement_level) VALUES
  ('determinism', 'same_input_same_output', 'Same input data must always produce identical output scores', 'hard'),
  ('determinism', 'no_random_seeds', 'No random number generation in analytics algorithms', 'hard'),
  ('computation', 'no_silent_recomputation', 'All recomputations must be logged with timestamps', 'hard'),
  ('computation', 'explicit_cache_invalidation', 'Cache invalidation must be explicit and traceable', 'hard'),
  ('alerts', 'reference_data_sufficiency', 'All alerts must include data sufficiency level', 'hard'),
  ('alerts', 'single_primary_trigger', 'Each alert type has exactly one primary trigger condition', 'hard'),
  ('alerts', 'no_hidden_thresholds', 'All thresholds must be in threshold_config table', 'hard'),
  ('data_minimization', 'no_pii_in_analytics', 'No names, emails, or addresses in analytics data paths', 'hard'),
  ('data_minimization', 'opaque_seller_ids', 'Seller IDs must be UUIDs, never sequential integers', 'hard'),
  ('data_minimization', 'behavioral_signals_only', 'Event payloads contain only behavioral signals (type, value, timestamp)', 'hard'),
  ('data_minimization', 'aggregation_first', 'Analytics computed on aggregates, never individual events', 'soft'),
  ('retention', 'tier_based_retention', 'Data retention periods determined by pricing tier', 'hard'),
  ('retention', 'explicit_expiry', 'All data has explicit expiry timestamp', 'hard'),
  ('retention', 'automatic_decay', 'Old data automatically removed, no manual cleanup required', 'hard')
ON CONFLICT (invariant_name) DO NOTHING;

-- Data retention policies
CREATE TABLE IF NOT EXISTS retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier TEXT NOT NULL REFERENCES tier_config(tier),
  data_type TEXT NOT NULL CHECK (data_type IN ('events', 'metrics_cache', 'insights', 'exports', 'api_usage')),
  retention_days INTEGER NOT NULL,
  decay_strategy TEXT NOT NULL CHECK (decay_strategy IN ('hard_delete', 'soft_delete', 'archive')),
  last_cleanup_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tier, data_type)
);

-- Insert default retention policies
INSERT INTO retention_policies (tier, data_type, retention_days, decay_strategy) VALUES
  ('free', 'events', 7, 'hard_delete'),
  ('free', 'metrics_cache', 1, 'hard_delete'),
  ('free', 'insights', 7, 'hard_delete'),
  ('free', 'exports', 1, 'hard_delete'),
  ('free', 'api_usage', 7, 'hard_delete'),
  ('basic', 'events', 30, 'hard_delete'),
  ('basic', 'metrics_cache', 7, 'hard_delete'),
  ('basic', 'insights', 30, 'hard_delete'),
  ('basic', 'exports', 7, 'hard_delete'),
  ('basic', 'api_usage', 30, 'hard_delete'),
  ('pro', 'events', 90, 'archive'),
  ('pro', 'metrics_cache', 30, 'hard_delete'),
  ('pro', 'insights', 90, 'archive'),
  ('pro', 'exports', 30, 'archive'),
  ('pro', 'api_usage', 90, 'archive'),
  ('enterprise', 'events', 365, 'archive'),
  ('enterprise', 'metrics_cache', 90, 'hard_delete'),
  ('enterprise', 'insights', 365, 'archive'),
  ('enterprise', 'exports', 90, 'archive'),
  ('enterprise', 'api_usage', 365, 'archive')
ON CONFLICT (tier, data_type) DO NOTHING;

-- Add expiry timestamps to existing tables
ALTER TABLE events ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE metrics_cache ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE export_history ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE api_usage ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Create indexes for expiry-based cleanup
CREATE INDEX IF NOT EXISTS idx_events_expires ON events(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_metrics_cache_expires ON metrics_cache(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_export_history_expires ON export_history(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_api_usage_expires ON api_usage(expires_at) WHERE expires_at IS NOT NULL;

-- Function to set expiry based on tier
CREATE OR REPLACE FUNCTION set_data_expiry()
RETURNS TRIGGER AS $$
DECLARE
  seller_tier TEXT;
  retention_days INTEGER;
BEGIN
  -- Get seller tier
  SELECT pricing_tier INTO seller_tier
  FROM sellers
  WHERE id = NEW.seller_id;
  
  -- Get retention policy
  SELECT rp.retention_days INTO retention_days
  FROM retention_policies rp
  WHERE rp.tier = COALESCE(seller_tier, 'free')
    AND rp.data_type = TG_ARGV[0];
  
  -- Set expiry
  NEW.expires_at := NOW() + (COALESCE(retention_days, 7) || ' days')::INTERVAL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic expiry
DROP TRIGGER IF EXISTS set_events_expiry ON events;
CREATE TRIGGER set_events_expiry
  BEFORE INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION set_data_expiry('events');

DROP TRIGGER IF EXISTS set_api_usage_expiry ON api_usage;
CREATE TRIGGER set_api_usage_expiry
  BEFORE INSERT ON api_usage
  FOR EACH ROW
  EXECUTE FUNCTION set_data_expiry('api_usage');

-- RLS policies
ALTER TABLE config_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE insight_lifecycle ENABLE ROW LEVEL SECURITY;
ALTER TABLE embed_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE embed_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_invariants ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view config versions" ON config_versions FOR SELECT USING (true);
CREATE POLICY "Anyone can view config snapshots" ON config_snapshots FOR SELECT USING (true);
CREATE POLICY "Users can view their insight lifecycle" ON insight_lifecycle FOR SELECT USING (true);
CREATE POLICY "Users can view their embed keys" ON embed_keys FOR SELECT USING (true);
CREATE POLICY "Users can create embed keys" ON embed_keys FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view system invariants" ON system_invariants FOR SELECT USING (true);
CREATE POLICY "Anyone can view retention policies" ON retention_policies FOR SELECT USING (true);