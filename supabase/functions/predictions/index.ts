import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple Linear Regression for trend prediction
function linearRegression(x: number[], y: number[]): { slope: number; intercept: number } {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

// Exponential Moving Average for smoothing
function exponentialMovingAverage(data: number[], alpha = 0.3): number[] {
  const ema: number[] = [data[0]];
  for (let i = 1; i < data.length; i++) {
    ema.push(alpha * data[i] + (1 - alpha) * ema[i - 1]);
  }
  return ema;
}

// Generate predictions
function generatePredictions(
  timestamps: number[],
  values: number[],
  steps = 10
): Array<{ timestamp: number; predicted: number; confidence: number; upperBound: number; lowerBound: number }> {
  if (values.length < 5) {
    return [];
  }

  const smoothed = exponentialMovingAverage(values, 0.3);
  
  const x = Array.from({ length: values.length }, (_, i) => i);
  const { slope, intercept } = linearRegression(x, smoothed);

  const lastTimestamp = timestamps[timestamps.length - 1];
  const avgTimeDiff = timestamps.length > 1
    ? (timestamps[timestamps.length - 1] - timestamps[0]) / (timestamps.length - 1)
    : 3600000;

  const stdDev = Math.sqrt(
    smoothed.reduce((sum, val, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(val - predicted, 2);
    }, 0) / smoothed.length
  );

  const predictions: Array<{ timestamp: number; predicted: number; confidence: number; upperBound: number; lowerBound: number }> = [];

  for (let i = 1; i <= steps; i++) {
    const futureX = values.length + i;
    const predicted = slope * futureX + intercept;
    const futureTimestamp = lastTimestamp + avgTimeDiff * i;
    
    const confidence = Math.max(0.5, 1 - (i / steps) * 0.5);
    
    const uncertaintyGrowth = 1 + (i / steps) * 2;
    const margin = stdDev * uncertaintyGrowth * 1.96;

    predictions.push({
      timestamp: futureTimestamp,
      predicted: Math.max(0, predicted),
      confidence: Number(confidence.toFixed(2)),
      upperBound: Math.max(0, predicted + margin),
      lowerBound: Math.max(0, predicted - margin),
    });
  }

  return predictions;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const url = new URL(req.url);
    const sellerId = url.searchParams.get('sellerId');
    const metricType = url.searchParams.get('type') || 'SALE';
    const steps = parseInt(url.searchParams.get('steps') || '10', 10);

    if (!sellerId) {
      return new Response(
        JSON.stringify({ error: 'Missing sellerId parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cacheKey = `prediction_${metricType}_${steps}`;
    const { data: cachedData } = await supabaseClient
      .from('metrics_cache')
      .select('*')
      .eq('seller_id', sellerId)
      .eq('metric_type', cacheKey)
      .maybeSingle();

    const now = new Date();
    if (cachedData) {
      const lastComputed = new Date(cachedData.last_computed);
      const ttlMs = cachedData.ttl * 1000;
      if (now.getTime() - lastComputed.getTime() < ttlMs) {
        return new Response(
          JSON.stringify(cachedData.data),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const { data: events, error } = await supabaseClient
      .from('events')
      .select('value, timestamp')
      .eq('seller_id', sellerId)
      .eq('type', metricType)
      .order('timestamp', { ascending: true })
      .limit(512);

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch events', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!events || events.length < 5) {
      return new Response(
        JSON.stringify({ predictions: [], message: 'Insufficient data for predictions' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const timestamps = events.map(e => Number(e.timestamp));
    const values = events.map(e => Number(e.value));

    const predictions = generatePredictions(timestamps, values, steps);

    const result = {
      predictions,
      historical: events.slice(-20).map(e => ({
        timestamp: Number(e.timestamp),
        value: Number(e.value),
      })),
      metadata: {
        dataPoints: events.length,
        predictionSteps: steps,
      },
    };

    const ttl = events.length > 100 ? 5 : 15;

    await supabaseClient
      .from('metrics_cache')
      .upsert({
        seller_id: sellerId,
        metric_type: cacheKey,
        data: result,
        last_computed: now.toISOString(),
        ttl: ttl,
      });

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
