-- Add API key and pricing tier to sellers
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS api_key TEXT UNIQUE;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS pricing_tier TEXT DEFAULT 'free' CHECK (pricing_tier IN ('free', 'basic', 'pro', 'enterprise'));
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS api_calls_count INTEGER DEFAULT 0;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS api_calls_limit INTEGER DEFAULT 1000;

-- Create decision hooks table
CREATE TABLE IF NOT EXISTS decision_hooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('anomaly_threshold', 'health_score', 'prediction_alert')),
  threshold_value DECIMAL NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('email', 'webhook', 'sms', 'slack')),
  action_config JSONB NOT NULL DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create weekly reports table
CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  week_start TIMESTAMPTZ NOT NULL,
  week_end TIMESTAMPTZ NOT NULL,
  total_events INTEGER NOT NULL,
  anomaly_count INTEGER NOT NULL,
  avg_health_score DECIMAL NOT NULL,
  top_insights JSONB NOT NULL DEFAULT '[]',
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(seller_id, week_start)
);

-- Create API usage tracking table
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER NOT NULL,
  called_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_decision_hooks_seller ON decision_hooks(seller_id);
CREATE INDEX IF NOT EXISTS idx_decision_hooks_enabled ON decision_hooks(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_weekly_reports_seller ON weekly_reports(seller_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_week ON weekly_reports(week_start, week_end);
CREATE INDEX IF NOT EXISTS idx_api_usage_seller ON api_usage(seller_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_called_at ON api_usage(called_at);

-- Generate API keys for existing sellers
UPDATE sellers SET api_key = encode(gen_random_bytes(32), 'hex') WHERE api_key IS NULL;

-- RLS policies for decision_hooks
ALTER TABLE decision_hooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own decision hooks"
  ON decision_hooks FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own decision hooks"
  ON decision_hooks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own decision hooks"
  ON decision_hooks FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their own decision hooks"
  ON decision_hooks FOR DELETE
  USING (true);

-- RLS policies for weekly_reports
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own weekly reports"
  ON weekly_reports FOR SELECT
  USING (true);

-- RLS policies for api_usage
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own API usage"
  ON api_usage FOR SELECT
  USING (true);