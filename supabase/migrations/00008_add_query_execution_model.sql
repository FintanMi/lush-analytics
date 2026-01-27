-- ============================================================================
-- Migration: Add Query Execution Model
-- Description: Transform system from "API service" → "analytics engine"
--              with explicit query planning, execution tracking, and federation
-- ============================================================================

-- ============================================================================
-- 1. Query Execution Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS query_execution (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
  query_type TEXT NOT NULL CHECK (query_type IN ('ANOMALY', 'PREDICTION', 'INSIGHT', 'FUNNEL', 'CUSTOM')),
  query_plan JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPILING', 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'TIMEOUT')),
  
  -- Timing
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Results
  result_reference UUID, -- Link to anomalies/predictions/insights
  result_data JSONB,
  error TEXT,
  
  -- Execution stats
  nodes_executed INT DEFAULT 0,
  total_latency_ms INT,
  cache_hits INT DEFAULT 0,
  cache_misses INT DEFAULT 0,
  data_points_processed BIGINT DEFAULT 0,
  
  -- Reproducibility
  reproducibility_hash TEXT NOT NULL,
  config_version TEXT,
  
  -- Indexing
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_query_execution_seller ON query_execution(seller_id, submitted_at DESC);
CREATE INDEX idx_query_execution_status ON query_execution(status, submitted_at);
CREATE INDEX idx_query_execution_hash ON query_execution(reproducibility_hash);

COMMENT ON TABLE query_execution IS 'Tracks analytics computation DAGs for distributed query execution';

-- ============================================================================
-- 2. Query Execution Nodes (DAG tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS query_execution_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  execution_id UUID REFERENCES query_execution(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  node_type TEXT NOT NULL CHECK (node_type IN ('SOURCE', 'TRANSFORM', 'AGGREGATE', 'SCORE', 'OUTPUT', 'FILTER', 'JOIN')),
  node_config JSONB NOT NULL,
  dependencies TEXT[] DEFAULT '{}',
  
  -- Execution
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  latency_ms INT,
  
  -- Results
  output_data JSONB,
  error TEXT,
  
  -- Cost tracking
  estimated_cost NUMERIC,
  actual_cost NUMERIC,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_query_execution_nodes_execution ON query_execution_nodes(execution_id, node_type);
CREATE INDEX idx_query_execution_nodes_status ON query_execution_nodes(status);

-- ============================================================================
-- 3. Execution Budgets (per-seller resource limits)
-- ============================================================================

CREATE TABLE IF NOT EXISTS execution_budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE UNIQUE,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'basic', 'pro', 'enterprise')),
  
  -- Resource limits
  max_concurrent_queries INT NOT NULL DEFAULT 1,
  max_queue_depth INT NOT NULL DEFAULT 5,
  max_latency_ms INT NOT NULL DEFAULT 5000,
  max_compute_units INT NOT NULL DEFAULT 100,
  
  -- Current usage
  current_queries INT DEFAULT 0,
  queued_queries INT DEFAULT 0,
  compute_units_used INT DEFAULT 0,
  
  -- Reset timing
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  window_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_execution_budgets_seller ON execution_budgets(seller_id);
CREATE INDEX idx_execution_budgets_tier ON execution_budgets(tier);

-- Function to reset execution budgets
CREATE OR REPLACE FUNCTION reset_execution_budget(p_seller_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE execution_budgets
  SET 
    current_queries = 0,
    queued_queries = 0,
    compute_units_used = 0,
    window_start = NOW(),
    window_end = NOW() + INTERVAL '1 hour',
    updated_at = NOW()
  WHERE seller_id = p_seller_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. Data Source Registry (for federation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS data_source_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_type TEXT NOT NULL CHECK (source_type IN ('RING_BUFFER', 'AGGREGATE_STORE', 'HISTORICAL_COLD_STORE', 'EXTERNAL_WEBHOOK', 'CACHED_METRICS', 'REAL_TIME_STREAM')),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  
  -- Connection config
  config JSONB NOT NULL DEFAULT '{}',
  
  -- Capabilities
  supports_time_range BOOLEAN DEFAULT true,
  supports_filtering BOOLEAN DEFAULT true,
  supports_aggregation BOOLEAN DEFAULT false,
  supports_join BOOLEAN DEFAULT false,
  
  -- Performance characteristics
  avg_latency_ms INT DEFAULT 100,
  throughput_per_sec INT DEFAULT 1000,
  reliability NUMERIC DEFAULT 0.99 CHECK (reliability >= 0 AND reliability <= 1),
  
  -- Status
  enabled BOOLEAN DEFAULT true,
  last_health_check TIMESTAMPTZ,
  health_status TEXT DEFAULT 'unknown' CHECK (health_status IN ('healthy', 'degraded', 'unhealthy', 'unknown')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_data_source_registry_type ON data_source_registry(source_type);
CREATE INDEX idx_data_source_registry_enabled ON data_source_registry(enabled);

-- ============================================================================
-- 5. Query Cache (probabilistic caching)
-- ============================================================================

CREATE TABLE IF NOT EXISTS query_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query_hash TEXT NOT NULL,
  seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
  query_plan JSONB NOT NULL,
  result_data JSONB NOT NULL,
  
  -- Cache metadata
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ttl_seconds INT NOT NULL DEFAULT 30,
  expires_at TIMESTAMPTZ NOT NULL,
  hit_count INT DEFAULT 0,
  
  -- Invalidation
  invalidated_at TIMESTAMPTZ,
  invalidation_reason TEXT,
  
  -- Size tracking
  result_size_bytes INT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_query_cache_hash ON query_cache(query_hash, seller_id) WHERE invalidated_at IS NULL;
CREATE INDEX idx_query_cache_expires ON query_cache(expires_at) WHERE invalidated_at IS NULL;
CREATE INDEX idx_query_cache_seller ON query_cache(seller_id, cached_at DESC);

-- Function to get cached query result
CREATE OR REPLACE FUNCTION get_cached_query(p_query_hash TEXT, p_seller_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT result_data INTO v_result
  FROM query_cache
  WHERE query_hash = p_query_hash
    AND seller_id = p_seller_id
    AND expires_at > NOW()
    AND invalidated_at IS NULL
  ORDER BY cached_at DESC
  LIMIT 1;
  
  -- Increment hit count
  IF v_result IS NOT NULL THEN
    UPDATE query_cache
    SET hit_count = hit_count + 1
    WHERE query_hash = p_query_hash
      AND seller_id = p_seller_id
      AND expires_at > NOW()
      AND invalidated_at IS NULL;
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. Pipeline Versions (operator versioning)
-- ============================================================================

CREATE TABLE IF NOT EXISTS pipeline_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version TEXT NOT NULL UNIQUE,
  description TEXT,
  operators JSONB NOT NULL, -- Array of operator names
  
  -- Lifecycle
  effective_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deprecated_at TIMESTAMPTZ,
  
  -- Compatibility
  backward_compatible BOOLEAN DEFAULT true,
  migration_path TEXT,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pipeline_versions_effective ON pipeline_versions(effective_at DESC);
CREATE INDEX idx_pipeline_versions_version ON pipeline_versions(version);

-- ============================================================================
-- 7. Execution Queue (for scheduler)
-- ============================================================================

CREATE TABLE IF NOT EXISTS execution_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  execution_id UUID REFERENCES query_execution(id) ON DELETE CASCADE UNIQUE,
  queue_type TEXT NOT NULL CHECK (queue_type IN ('anomaly', 'prediction', 'insight', 'funnel', 'custom')),
  priority INT NOT NULL DEFAULT 5, -- Higher = more urgent
  
  -- Timing
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deadline TIMESTAMPTZ,
  dequeued_at TIMESTAMPTZ,
  
  -- Budget reference
  seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'DEQUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_execution_queue_status ON execution_queue(status, priority DESC, submitted_at);
CREATE INDEX idx_execution_queue_type ON execution_queue(queue_type, status);
CREATE INDEX idx_execution_queue_seller ON execution_queue(seller_id);

-- ============================================================================
-- 8. Worker Pool Stats (monitoring)
-- ============================================================================

CREATE TABLE IF NOT EXISTS worker_pool_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  queue_type TEXT NOT NULL CHECK (queue_type IN ('anomaly', 'prediction', 'insight', 'funnel', 'custom')),
  
  -- Pool configuration
  max_workers INT NOT NULL,
  active_workers INT DEFAULT 0,
  
  -- Queue metrics
  queue_depth INT DEFAULT 0,
  avg_processing_time_ms INT DEFAULT 0,
  
  -- Backpressure
  backpressure_enabled BOOLEAN DEFAULT false,
  backpressure_threshold INT DEFAULT 100,
  rejection_rate NUMERIC DEFAULT 0.0,
  
  -- Snapshot time
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_worker_pool_stats_queue ON worker_pool_stats(queue_type, measured_at DESC);

-- ============================================================================
-- 9. Execution Invariants (runtime contracts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS execution_invariants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('determinism', 'performance', 'correctness', 'resource')),
  description TEXT NOT NULL,
  enforcement_level TEXT NOT NULL CHECK (enforcement_level IN ('hard', 'soft', 'advisory')),
  
  -- Validation
  validator_function TEXT, -- Function name to call
  validator_sql TEXT, -- SQL query to run
  violation_action TEXT NOT NULL CHECK (violation_action IN ('reject', 'warn', 'log')),
  
  -- Status
  enabled BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_execution_invariants_category ON execution_invariants(category, enabled);

-- ============================================================================
-- 10. Aggregated Daily Events (materialized view for performance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS events_agg_daily (
  seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  day DATE NOT NULL,
  total_value NUMERIC NOT NULL DEFAULT 0,
  count BIGINT NOT NULL DEFAULT 0,
  avg_value NUMERIC,
  min_value NUMERIC,
  max_value NUMERIC,
  stddev_value NUMERIC,
  
  -- Analytics metadata
  anomaly_score_avg NUMERIC,
  data_sufficiency TEXT,
  
  PRIMARY KEY (seller_id, metric_type, day)
);

CREATE INDEX idx_events_agg_daily_seller ON events_agg_daily(seller_id, day DESC);
CREATE INDEX idx_events_agg_daily_metric ON events_agg_daily(metric_type, day DESC);

-- ============================================================================
-- 11. Ring Buffer History (for reproducibility)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ring_buffer_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  value NUMERIC NOT NULL,
  
  -- Metadata
  buffer_version TEXT,
  snapshot_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ring_buffer_history_seller ON ring_buffer_history(seller_id, metric_type, timestamp DESC);

-- Partition by month for efficient storage
-- (Note: Partitioning would be set up separately based on deployment needs)

-- ============================================================================
-- 12. Ingestion Batches (deduplication tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ingestion_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_uuid TEXT UNIQUE NOT NULL,
  seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
  event_count INT NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  
  -- Timing
  ingested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  
  -- Metadata
  source TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ingestion_batches_uuid ON ingestion_batches(batch_uuid);
CREATE INDEX idx_ingestion_batches_seller ON ingestion_batches(seller_id, ingested_at DESC);

-- ============================================================================
-- -- 13. RLS Policies
-- -- ============================================================================
-- 
-- -- Query execution: sellers can only see their own executions
-- ALTER TABLE query_execution ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY query_execution_seller_policy ON query_execution
--   FOR ALL
--   USING (
--     seller_id IN (
--       SELECT id FROM sellers WHERE user_id = auth.uid()
--     )
--   );
-- 
-- -- Execution budgets: sellers can view their own budgets
-- ALTER TABLE execution_budgets ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY execution_budgets_seller_policy ON execution_budgets
--   FOR SELECT
--   USING (
--     seller_id IN (
--       SELECT id FROM sellers WHERE user_id = auth.uid()
--     )
--   );
-- 
-- -- Query cache: sellers can only access their own cache
-- ALTER TABLE query_cache ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY query_cache_seller_policy ON query_cache
--   FOR SELECT
--   USING (
--     seller_id IN (
      SELECT id FROM sellers WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 14. Helper Functions
-- ============================================================================

-- Function to compile query plan from request
CREATE OR REPLACE FUNCTION compile_query_plan(p_request JSONB)
RETURNS JSONB AS $$
DECLARE
  v_plan JSONB;
BEGIN
  -- This would be implemented in the edge function
  -- Placeholder for now
  v_plan := jsonb_build_object(
    'id', uuid_generate_v4(),
    'version', '1.0',
    'nodes', '[]'::jsonb
  );
  
  RETURN v_plan;
END;
$$ LANGUAGE plpgsql;

-- Function to estimate query cost
CREATE OR REPLACE FUNCTION estimate_query_cost(p_plan JSONB)
RETURNS NUMERIC AS $$
DECLARE
  v_cost NUMERIC := 0;
  v_node JSONB;
BEGIN
  -- Simple cost model based on node count and types
  FOR v_node IN SELECT jsonb_array_elements(p_plan->'nodes')
  LOOP
    CASE v_node->>'type'
      WHEN 'SOURCE' THEN v_cost := v_cost + 1;
      WHEN 'TRANSFORM' THEN v_cost := v_cost + 5;
      WHEN 'AGGREGATE' THEN v_cost := v_cost + 3;
      WHEN 'SCORE' THEN v_cost := v_cost + 10;
      WHEN 'OUTPUT' THEN v_cost := v_cost + 1;
      ELSE v_cost := v_cost + 2;
    END CASE;
  END LOOP;
  
  RETURN v_cost;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 15. Seed Data
-- ============================================================================

-- Insert default data sources
INSERT INTO data_source_registry (source_type, name, description, config) VALUES
  ('RING_BUFFER', 'In-Memory Ring Buffer', 'Real-time event buffer (512 points)', '{"capacity": 512}'::jsonb),
  ('AGGREGATE_STORE', 'Daily Aggregates', 'Pre-computed daily metrics', '{}'::jsonb),
  ('CACHED_METRICS', 'Metrics Cache', 'Probabilistic cache layer', '{"ttl": 30}'::jsonb),
  ('HISTORICAL_COLD_STORE', 'Historical Events', 'Long-term event storage', '{}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Insert default pipeline version
INSERT INTO pipeline_versions (version, description, operators) VALUES
  ('1.0.0', 'Initial pipeline with DSP operators', '["FIR", "FFT", "HFD"]'::jsonb)
ON CONFLICT (version) DO NOTHING;

-- Insert execution invariants
INSERT INTO execution_invariants (name, category, description, enforcement_level, violation_action) VALUES
  ('deterministic_execution', 'determinism', 'All executions must be deterministic and reproducible', 'hard', 'reject'),
  ('max_latency_bound', 'performance', 'Queries must complete within tier latency limits', 'soft', 'warn'),
  ('data_sufficiency_check', 'correctness', 'Minimum data points required for analytics', 'soft', 'warn'),
  ('resource_budget_limit', 'resource', 'Execution must stay within allocated budget', 'hard', 'reject')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 16. Cleanup Jobs (for maintenance)
-- ============================================================================

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INT AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM query_cache
  WHERE expires_at < NOW() - INTERVAL '1 day';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old execution records
CREATE OR REPLACE FUNCTION cleanup_old_executions(p_retention_days INT DEFAULT 30)
RETURNS INT AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM query_execution
  WHERE completed_at < NOW() - (p_retention_days || ' days')::INTERVAL
    AND status IN ('COMPLETED', 'FAILED', 'CANCELLED');
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- Function to increment queued queries
CREATE OR REPLACE FUNCTION increment_queued_queries(p_seller_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE execution_budgets
  SET 
    queued_queries = queued_queries + 1,
    updated_at = NOW()
  WHERE seller_id = p_seller_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement current queries
CREATE OR REPLACE FUNCTION decrement_current_queries(p_seller_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE execution_budgets
  SET 
    current_queries = GREATEST(0, current_queries - 1),
    queued_queries = GREATEST(0, queued_queries - 1),
    updated_at = NOW()
  WHERE seller_id = p_seller_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE query_execution IS 'Core table for query execution model - tracks all analytics queries as explicit DAGs';
COMMENT ON TABLE execution_budgets IS 'Per-seller resource limits and usage tracking for fair scheduling';
COMMENT ON TABLE data_source_registry IS 'Registry of federated data sources for distributed query execution';
COMMENT ON TABLE query_cache IS 'Probabilistic cache for query results with adaptive TTL';
COMMENT ON TABLE pipeline_versions IS 'Versioning for analytics pipelines to ensure reproducibility';
