-- Create sellers table
CREATE TABLE sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create events table for time series data
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  timestamp BIGINT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('SALE', 'CLICK', 'VIEW')),
  value NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient time-based queries
CREATE INDEX idx_events_seller_timestamp ON events(seller_id, timestamp DESC);
CREATE INDEX idx_events_type ON events(type);

-- Create metrics cache table for probabilistic caching
CREATE TABLE metrics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  data JSONB NOT NULL,
  last_computed TIMESTAMPTZ DEFAULT NOW(),
  ttl INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(seller_id, metric_type)
);

-- Create index for cache lookups
CREATE INDEX idx_metrics_cache_seller ON metrics_cache(seller_id, metric_type);

-- Insert sample sellers
INSERT INTO sellers (name, email) VALUES
  ('TechGadgets Store', 'contact@techgadgets.com'),
  ('Fashion Hub', 'info@fashionhub.com'),
  ('Home Essentials', 'support@homeessentials.com');

-- Enable Row Level Security
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_cache ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for demo purposes)
CREATE POLICY "Allow public read access to sellers" ON sellers FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to sellers" ON sellers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to sellers" ON sellers FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to events" ON events FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to events" ON events FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to metrics_cache" ON metrics_cache FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to metrics_cache" ON metrics_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to metrics_cache" ON metrics_cache FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to metrics_cache" ON metrics_cache FOR DELETE USING (true);