-- Webhook Registration & Management
CREATE TABLE IF NOT EXISTS webhook_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  event_types TEXT[] NOT NULL, -- ['anomaly_detected', 'alert_triggered', etc.]
  secret TEXT NOT NULL, -- for HMAC signature
  enabled BOOLEAN DEFAULT true,
  retry_config JSONB DEFAULT '{"maxRetries": 3, "backoffMs": [1000, 5000, 15000]}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_event_types CHECK (
    event_types <@ ARRAY[
      'anomaly_detected',
      'alert_triggered', 
      'prediction_updated',
      'insight_state_changed',
      'weekly_report_ready',
      'pricing_tier_changed'
    ]::TEXT[]
  )
);

CREATE INDEX idx_webhook_registrations_seller ON webhook_registrations(seller_id);
CREATE INDEX idx_webhook_registrations_enabled ON webhook_registrations(enabled) WHERE enabled = true;

-- Webhook Delivery Audit Trail
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhook_registrations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  reproducibility_hash TEXT NOT NULL,
  config_version TEXT NOT NULL,
  time_window JSONB NOT NULL,
  data_sufficiency TEXT NOT NULL,
  signal_quality NUMERIC(3,2),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, success, failed, dead_letter
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  response_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'success', 'failed', 'dead_letter'))
);

CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_created ON webhook_deliveries(created_at DESC);

-- Webhook Dead Letter Queue
CREATE TABLE IF NOT EXISTS webhook_dead_letter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES webhook_deliveries(id) ON DELETE CASCADE,
  webhook_id UUID NOT NULL REFERENCES webhook_registrations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  final_error TEXT NOT NULL,
  attempts INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT
);

CREATE INDEX idx_webhook_dead_letter_webhook ON webhook_dead_letter(webhook_id);
CREATE INDEX idx_webhook_dead_letter_unresolved ON webhook_dead_letter(resolved_at) WHERE resolved_at IS NULL;

-- Funnel Templates (predefined per tier)
CREATE TABLE IF NOT EXISTS funnel_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  tier TEXT NOT NULL, -- 'free', 'basic', 'pro', 'enterprise'
  steps JSONB NOT NULL, -- [{"type": "VIEW", "order": 1}, {"type": "CLICK", "order": 2}, ...]
  min_data_points INTEGER DEFAULT 100,
  max_step_timeout_ms BIGINT DEFAULT 3600000, -- 1 hour default
  window_alignment TEXT DEFAULT 'hour', -- 'hour', 'day', 'week'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_tier CHECK (tier IN ('free', 'basic', 'pro', 'enterprise')),
  CONSTRAINT valid_window_alignment CHECK (window_alignment IN ('hour', 'day', 'week'))
);

CREATE INDEX idx_funnel_templates_tier ON funnel_templates(tier);

-- Seller Funnel Configurations
CREATE TABLE IF NOT EXISTS funnel_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES funnel_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  custom_steps JSONB, -- seller can customize within constraints
  window_hours INTEGER DEFAULT 24,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(seller_id, name)
);

CREATE INDEX idx_funnel_configs_seller ON funnel_configs(seller_id);
CREATE INDEX idx_funnel_configs_enabled ON funnel_configs(enabled) WHERE enabled = true;

-- Funnel Results (cached)
CREATE TABLE IF NOT EXISTS funnel_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_config_id UUID NOT NULL REFERENCES funnel_configs(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  total_entries INTEGER NOT NULL,
  step_results JSONB NOT NULL, -- [{"step": 1, "count": 100, "dropoff": 0, "sufficiency": "sufficient"}, ...]
  drop_off_attribution JSONB NOT NULL, -- {"step_1_to_2": {"count": 20, "rate": 0.2}, ...}
  confidence NUMERIC(3,2) NOT NULL,
  data_sufficiency TEXT NOT NULL,
  reproducibility_hash TEXT NOT NULL,
  config_version TEXT NOT NULL,
  computed_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_data_sufficiency CHECK (data_sufficiency IN ('insufficient', 'minimal', 'sufficient', 'high'))
);

CREATE INDEX idx_funnel_results_config ON funnel_results(funnel_config_id);
CREATE INDEX idx_funnel_results_seller ON funnel_results(seller_id);
CREATE INDEX idx_funnel_results_window ON funnel_results(window_start, window_end);

-- RLS Policies for Webhooks
ALTER TABLE webhook_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_dead_letter ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can manage their webhooks" ON webhook_registrations
  FOR ALL USING (true);

CREATE POLICY "Sellers can view their webhook deliveries" ON webhook_deliveries
  FOR SELECT USING (true);

CREATE POLICY "Sellers can view their dead letter queue" ON webhook_dead_letter
  FOR SELECT USING (true);

-- RLS Policies for Funnels
ALTER TABLE funnel_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view funnel templates" ON funnel_templates
  FOR SELECT USING (true);

CREATE POLICY "Sellers can manage their funnel configs" ON funnel_configs
  FOR ALL USING (true);

CREATE POLICY "Sellers can view their funnel results" ON funnel_results
  FOR SELECT USING (true);

-- Insert default funnel templates
INSERT INTO funnel_templates (name, description, tier, steps, min_data_points, max_step_timeout_ms) VALUES
  (
    'Basic Conversion Funnel',
    'View → Click → Sale',
    'free',
    '[
      {"type": "VIEW", "order": 1, "label": "Product View"},
      {"type": "CLICK", "order": 2, "label": "Click"},
      {"type": "SALE", "order": 3, "label": "Purchase"}
    ]'::jsonb,
    50,
    3600000
  ),
  (
    'E-commerce Checkout Funnel',
    'View → Click → Checkout → Payment → Sale',
    'basic',
    '[
      {"type": "VIEW", "order": 1, "label": "Product View"},
      {"type": "CLICK", "order": 2, "label": "Add to Cart"},
      {"type": "CHECKOUT_STARTED", "order": 3, "label": "Checkout Started"},
      {"type": "PAYMENT_SUCCEEDED", "order": 4, "label": "Payment Success"},
      {"type": "SALE", "order": 5, "label": "Order Complete"}
    ]'::jsonb,
    100,
    7200000
  ),
  (
    'Advanced Engagement Funnel',
    'Full customer journey with custom events',
    'pro',
    '[
      {"type": "VIEW", "order": 1, "label": "Landing"},
      {"type": "CLICK", "order": 2, "label": "Engagement"},
      {"type": "CHECKOUT_STARTED", "order": 3, "label": "Intent"},
      {"type": "PAYMENT_SUCCEEDED", "order": 4, "label": "Conversion"},
      {"type": "SALE", "order": 5, "label": "Completion"}
    ]'::jsonb,
    200,
    86400000
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_webhook_registrations_updated_at
  BEFORE UPDATE ON webhook_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_funnel_configs_updated_at
  BEFORE UPDATE ON funnel_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();