import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// FIR Smoothing - Simple Moving Average
function firSmoothing(data: number[], windowSize = 5): number[] {
  const smoothed: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(data.length, i + Math.ceil(windowSize / 2));
    const window = data.slice(start, end);
    const avg = window.reduce((sum, val) => sum + val, 0) / window.length;
    smoothed.push(avg);
  }
  return smoothed;
}

// Simplified FFT - Detect periodic spikes using autocorrelation
function detectPeriodicSpikes(data: number[]): number {
  if (data.length < 10) return 0;
  
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  
  if (variance === 0) return 0;
  
  let maxCorrelation = 0;
  const maxLag = Math.min(Math.floor(data.length / 4), 50);
  
  for (let lag = 1; lag < maxLag; lag++) {
    let correlation = 0;
    for (let i = 0; i < data.length - lag; i++) {
      correlation += (data[i] - mean) * (data[i + lag] - mean);
    }
    correlation = correlation / ((data.length - lag) * variance);
    maxCorrelation = Math.max(maxCorrelation, Math.abs(correlation));
  }
  
  return maxCorrelation;
}

// Higuchi Fractal Dimension - Measure complexity
function calculateHFD(data: number[], kMax = 5): number {
  if (data.length < 10) return 1.0;
  
  const N = data.length;
  const lk: number[] = [];
  
  for (let k = 1; k <= kMax; k++) {
    let lm = 0;
    for (let m = 0; m < k; m++) {
      let lkm = 0;
      const maxI = Math.floor((N - m - 1) / k);
      
      for (let i = 1; i <= maxI; i++) {
        lkm += Math.abs(data[m + i * k] - data[m + (i - 1) * k]);
      }
      
      lkm = (lkm * (N - 1)) / (maxI * k * k);
      lm += lkm;
    }
    lk.push(lm / k);
  }
  
  if (lk.length < 2) return 1.0;
  
  const logK = Array.from({ length: kMax }, (_, i) => Math.log(i + 1));
  const logLk = lk.map(l => Math.log(l));
  
  const n = logK.length;
  const sumX = logK.reduce((a, b) => a + b, 0);
  const sumY = logLk.reduce((a, b) => a + b, 0);
  const sumXY = logK.reduce((sum, x, i) => sum + x * logLk[i], 0);
  const sumX2 = logK.reduce((sum, x) => sum + x * x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  
  return -slope;
}

// Bayesian Anomaly Scoring
function calculateAnomalyScore(
  smoothedData: number[],
  periodicScore: number,
  hfd: number
): number {
  if (smoothedData.length === 0) return 0;
  
  const mean = smoothedData.reduce((sum, val) => sum + val, 0) / smoothedData.length;
  const stdDev = Math.sqrt(
    smoothedData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / smoothedData.length
  );
  
  const recentValues = smoothedData.slice(-10);
  const recentMean = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
  
  const deviationScore = stdDev > 0 ? Math.abs(recentMean - mean) / stdDev : 0;
  const normalizedDeviation = Math.min(deviationScore / 3, 1);
  
  const normalizedPeriodic = Math.min(periodicScore, 1);
  
  const normalizedHFD = Math.min(Math.max((hfd - 1) / 1.5, 0), 1);
  
  const anomalyScore = (
    normalizedDeviation * 0.4 +
    normalizedPeriodic * 0.3 +
    normalizedHFD * 0.3
  );
  
  return Math.min(Math.max(anomalyScore, 0), 1);
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

    if (!sellerId) {
      return new Response(
        JSON.stringify({ error: 'Missing sellerId parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cacheKey = `anomaly_${metricType}`;
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

    if (!events || events.length === 0) {
      return new Response(
        JSON.stringify({ anomalyScore: 0, message: 'No data available' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const values = events.map(e => Number(e.value));
    
    const smoothed = firSmoothing(values, 5);
    const periodicScore = detectPeriodicSpikes(values);
    const hfd = calculateHFD(values, 5);
    const anomalyScore = calculateAnomalyScore(smoothed, periodicScore, hfd);

    const result = {
      anomalyScore: Number(anomalyScore.toFixed(3)),
      metrics: {
        periodicScore: Number(periodicScore.toFixed(3)),
        hfd: Number(hfd.toFixed(3)),
        dataPoints: events.length,
      },
    };

    const ttl = events.length > 100 ? 1 : 10;

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
