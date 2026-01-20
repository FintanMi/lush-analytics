import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

function assessDataSufficiency(dataPoints: number): string {
  if (dataPoints < 50) return 'insufficient';
  if (dataPoints < 100) return 'minimal';
  if (dataPoints < 300) return 'adequate';
  return 'optimal';
}

function firSmoothing(data: number[], windowSize = 5): number[] {
  const smoothed: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(data.length, i + Math.ceil(windowSize / 2));
    const window = data.slice(start, end);
    smoothed.push(window.reduce((sum, val) => sum + val, 0) / window.length);
  }
  return smoothed;
}

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

function calculateHFD(data: number[], kMax = 5): number {
  if (data.length < 10) return 1.0;
  const N = data.length;
  const lk: number[] = [];
  const logK: number[] = [];
  
  for (let k = 2; k <= Math.min(kMax, Math.floor(N / 4)); k++) {
    let Lk = 0;
    for (let m = 0; m < k; m++) {
      let Lmk = 0;
      const indices: number[] = [];
      for (let i = m; i < N; i += k) indices.push(i);
      if (indices.length < 2) continue;
      
      for (let j = 1; j < indices.length; j++) {
        Lmk += Math.abs(data[indices[j]] - data[indices[j - 1]]);
      }
      const normFactor = (N - 1) / (Math.floor((N - m) / k) * k);
      Lmk = (Lmk * normFactor) / k;
      Lk += Lmk;
    }
    Lk = Lk / k;
    if (Lk > 0) {
      lk.push(Lk);
      logK.push(Math.log(k));
    }
  }
  
  if (lk.length < 2) return 1.0;
  const logL = lk.map(l => Math.log(l));
  const n = logK.length;
  const sumX = logK.reduce((a, b) => a + b, 0);
  const sumY = logL.reduce((a, b) => a + b, 0);
  const sumXY = logK.reduce((sum, x, i) => sum + x * logL[i], 0);
  const sumX2 = logK.reduce((sum, x) => sum + x * x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return Math.abs(slope);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const url = new URL(req.url);
    const sellerId = url.searchParams.get('sellerId');
    const metricType = url.searchParams.get('type') || 'SALE';
    const apiKey = req.headers.get('x-api-key');

    if (!sellerId) {
      return new Response(
        JSON.stringify({ error: 'Missing sellerId parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (apiKey) {
      const { data: seller } = await supabaseClient
        .from('sellers')
        .select('id, api_calls_count, api_calls_limit, pricing_tier')
        .eq('api_key', apiKey)
        .single();

      if (seller) {
        const callsCount = seller.api_calls_count || 0;
        const callsLimit = seller.api_calls_limit || 1000;

        if (callsCount >= callsLimit) {
          return new Response(
            JSON.stringify({ 
              error: 'Rate limit exceeded',
              rateLimit: { current: callsCount, limit: callsLimit, remaining: 0, resetAt: Date.now() + 3600000, tier: seller.pricing_tier || 'free' }
            }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await supabaseClient.from('sellers').update({ api_calls_count: callsCount + 1 }).eq('id', seller.id);
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
        JSON.stringify({ error: 'Database error', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const timeWindowStart = events.length > 0 ? events[0].timestamp : Date.now();
    const timeWindowEnd = events.length > 0 ? events[events.length - 1].timestamp : Date.now();
    const dataSufficiency = assessDataSufficiency(events.length);

    if (!events || events.length < 10) {
      return new Response(
        JSON.stringify({ 
          anomalyScore: 0,
          metrics: { periodicScore: 0, hfd: 1.0, dataPoints: events?.length || 0, timeWindowStart, timeWindowEnd, dataSufficiency },
          message: 'Insufficient data for anomaly detection (minimum 10 events required)',
          deterministic: true,
          computedAt: Date.now()
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const values = events.map(e => Number(e.value));
    const smoothed = firSmoothing(values);
    const mean = smoothed.reduce((a, b) => a + b, 0) / smoothed.length;
    const stdDev = Math.sqrt(smoothed.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / smoothed.length);
    const deviationScore = stdDev / (mean || 1);
    const periodicScore = detectPeriodicSpikes(values);
    const hfd = calculateHFD(values);
    const anomalyScore = Math.min(1, Math.max(0, 0.4 * Math.min(1, deviationScore) + 0.3 * periodicScore + 0.3 * Math.min(1, (hfd - 1) / 1.5)));

    return new Response(
      JSON.stringify({
        anomalyScore: Number(anomalyScore.toFixed(4)),
        metrics: { periodicScore: Number(periodicScore.toFixed(4)), hfd: Number(hfd.toFixed(4)), dataPoints: events.length, timeWindowStart, timeWindowEnd, dataSufficiency },
        deterministic: true,
        computedAt: Date.now()
      }),
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
