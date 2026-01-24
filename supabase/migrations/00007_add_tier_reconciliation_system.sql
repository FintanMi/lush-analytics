-- Tier state tracking table
CREATE TABLE IF NOT EXISTS tier_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  effective_tier TEXT NOT NULL CHECK (effective_tier IN ('free', 'basic', 'premium')),
  pricing_version TEXT NOT NULL,
  computed_at BIGINT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('scheduled', 'admin_reconcile', 'signup')),
  usage_snapshot JSONB NOT NULL DEFAULT '{}',
  applied_rules JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Entitlements table for exceptions
CREATE TABLE IF NOT EXISTS entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('webhook_bonus', 'prediction_bonus', 'event_bonus', 'retention_bonus')),
  amount INTEGER NOT NULL,
  expires_at TIMESTAMPTZ,
  reason TEXT NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tier reconciliation audit log
CREATE TABLE IF NOT EXISTS tier_reconciliation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  previous_tier TEXT,
  new_tier TEXT NOT NULL,
  pricing_version TEXT NOT NULL,
  source TEXT NOT NULL,
  triggered_by UUID REFERENCES auth.users(id),
  usage_metrics JSONB NOT NULL DEFAULT '{}',
  applied_rules JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pricing policy configuration
CREATE TABLE IF NOT EXISTS pricing_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL UNIQUE,
  config JSONB NOT NULL,
  effective_from TIMESTAMPTZ NOT NULL,
  effective_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default pricing policy
INSERT INTO pricing_policies (version, config, effective_from, is_active) VALUES (
  'v1.0.0',
  '{
    "tiers": {
      "free": {
        "events_per_month": 1000,
        "webhooks_per_month": 0,
        "data_retention_days": 7,
        "seller_accounts": 1
      },
      "basic": {
        "events_per_month": 50000,
        "webhooks_per_month": 5000,
        "data_retention_days": 30,
        "seller_accounts": 5
      },
      "premium": {
        "events_per_month": 500000,
        "webhooks_per_month": 50000,
        "data_retention_days": 90,
        "seller_accounts": 25
      }
    },
    "grace_period_days": 7,
    "overage_threshold": 1.1
  }'::jsonb,
  NOW(),
  true
) ON CONFLICT (version) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tier_states_user_id ON tier_states(user_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_user_id ON entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_expires_at ON entitlements(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tier_reconciliation_log_user_id ON tier_reconciliation_log(user_id);
CREATE INDEX IF NOT EXISTS idx_pricing_policies_active ON pricing_policies(is_active) WHERE is_active = true;

-- RLS Policies
ALTER TABLE tier_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_reconciliation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_policies ENABLE ROW LEVEL SECURITY;

-- Users can view their own tier state
CREATE POLICY "Users can view own tier state" ON tier_states
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view their own entitlements
CREATE POLICY "Users can view own entitlements" ON entitlements
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view their own reconciliation log
CREATE POLICY "Users can view own reconciliation log" ON tier_reconciliation_log
  FOR SELECT USING (auth.uid() = user_id);

-- Everyone can view active pricing policies
CREATE POLICY "Anyone can view active pricing policies" ON pricing_policies
  FOR SELECT USING (is_active = true);

-- Admin policies (service role only for modifications)
CREATE POLICY "Service role full access tier_states" ON tier_states
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access entitlements" ON entitlements
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access reconciliation_log" ON tier_reconciliation_log
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access pricing_policies" ON pricing_policies
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');