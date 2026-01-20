import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function calculateTrendSlope(values: number[]): number {
  if (values.length < 2) return 0;
  const n = values.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
}

function calculateVolatility(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance) / (mean || 1);
}

function calculateTimingEntropy(timestamps: number[]): number {
  if (timestamps.length < 2) return 0;
  const intervals = [];
  for (let i = 1; i < timestamps.length; i++) {
    intervals.push(timestamps[i] - timestamps[i - 1]);
  }
  const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance = intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intervals.length;
  return Math.sqrt(variance) / (mean || 1);
}

function generateAutoInsights(
  anomalyScore: number,
  periodicScore: number,
  hfd: number,
  trendSlope: number,
  volatility: number
): any[] {
  const insights = [];

  if (anomalyScore >= 0.7) {
    const attribution = [
      { factor: 'Deviation', contribution: 0.4, description: 'Significant deviation from baseline' },
      { factor: 'Periodicity', contribution: periodicScore * 0.3, description: 'Unusual periodic patterns detected' },
      { factor: 'Complexity', contribution: (hfd - 1) * 0.3, description: 'High time series complexity' },
    ];

    insights.push({
      type: 'anomaly',
      severity: 'critical',
      title: 'Critical Anomaly Detected',
      description: `Anomaly score of ${(anomalyScore * 100).toFixed(1)}% indicates severe irregularities in activity patterns.`,
      attribution,
      confidence: 0.9,
      timestamp: Date.now(),
    });
  } else if (anomalyScore >= 0.4) {
    insights.push({
      type: 'anomaly',
      severity: 'medium',
      title: 'Moderate Anomaly Detected',
      description: 'Some irregular patterns observed that warrant monitoring.',
      attribution: [
        { factor: 'Pattern Deviation', contribution: anomalyScore, description: 'Moderate deviation from normal' },
      ],
      confidence: 0.75,
      timestamp: Date.now(),
    });
  }

  if (Math.abs(trendSlope) > 5) {
    insights.push({
      type: 'trend',
      severity: trendSlope > 0 ? 'low' : 'medium',
      title: trendSlope > 0 ? 'Strong Upward Trend' : 'Declining Trend',
      description: `${trendSlope > 0 ? 'Positive' : 'Negative'} trend with slope of ${trendSlope.toFixed(2)}`,
      attribution: [
        { factor: 'Trend Acceleration', contribution: Math.abs(trendSlope) / 10, description: 'Rapid change in metrics' },
      ],
      confidence: 0.8,
      timestamp: Date.now(),
    });
  }

  if (periodicScore > 0.6) {
    insights.push({
      type: 'pattern',
      severity: 'low',
      title: 'Periodic Pattern Detected',
      description: 'Regular recurring patterns identified in the data',
      attribution: [
        { factor: 'FFT Periodicity', contribution: periodicScore, description: 'Strong periodic signal' },
      ],
      confidence: 0.85,
      timestamp: Date.now(),
    });
  }

  if (hfd > 1.8) {
    insights.push({
      type: 'alert',
      severity: 'high',
      title: 'High Complexity Detected',
      description: 'Time series shows high fractal dimension, possible bot activity',
      attribution: [
        { factor: 'HFD Complexity', contribution: (hfd - 1) / 1.5, description: 'Irregular behavior patterns' },
      ],
      confidence: 0.7,
      timestamp: Date.now(),
    });
  }

  if (volatility > 0.5) {
    insights.push({
      type: 'alert',
      severity: 'medium',
      title: 'High Volatility',
      description: 'Significant fluctuations in metrics detected',
      attribution: [
        { factor: 'Volatility', contribution: volatility, description: 'Unstable metric values' },
      ],
      confidence: 0.8,
      timestamp: Date.now(),
    });
  }

  return insights;
}

function calculateHealthScore(
  volatility: number,
  anomalyScore: number,
  trendSlope: number,
  dataPoints: number
): any {
  const volatilityScore = Math.max(0, 1 - volatility);
  const anomalyFrequencyScore = Math.max(0, 1 - anomalyScore);
  const predictiveRiskScore = Math.max(0, 1 - Math.abs(trendSlope) / 10);
  const dataConsistencyScore = Math.min(1, dataPoints / 100);

  const overall = (
    volatilityScore * 0.25 +
    anomalyFrequencyScore * 0.35 +
    predictiveRiskScore * 0.25 +
    dataConsistencyScore * 0.15
  );

  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (trendSlope > 2) trend = 'improving';
  else if (trendSlope < -2) trend = 'declining';

  return {
    overall: Number(overall.toFixed(2)),
    volatility: Number(volatilityScore.toFixed(2)),
    anomalyFrequency: Number(anomalyFrequencyScore.toFixed(2)),
    predictiveRisk: Number(predictiveRiskScore.toFixed(2)),
    dataConsistency: Number(dataConsistencyScore.toFixed(2)),
    trend,
  };
}

function generateBehaviorFingerprint(
  sellerId: string,
  fftSignature: number[],
  hfd: number,
  timingEntropy: number
): any {
  let patternType: 'normal' | 'bot' | 'manipulation' | 'irregular' = 'normal';
  let confidence = 0.7;

  if (hfd > 1.8 && timingEntropy < 0.1) {
    patternType = 'bot';
    confidence = 0.9;
  } else if (hfd > 1.6 && fftSignature.some(v => v > 0.8)) {
    patternType = 'manipulation';
    confidence = 0.75;
  } else if (timingEntropy > 0.8) {
    patternType = 'irregular';
    confidence = 0.65;
  }

  return {
    sellerId,
    fftSignature: fftSignature.slice(0, 5),
    hfdPattern: Number(hfd.toFixed(2)),
    timingEntropy: Number(timingEntropy.toFixed(2)),
    patternType,
    confidence: Number(confidence.toFixed(2)),
  };
}

function generatePredictiveAlerts(
  trendSlope: number,
  periodicScore: number,
  confidence: number
): any[] {
  const alerts = [];

  if (Math.abs(trendSlope) > 5) {
    alerts.push({
      type: 'trend_acceleration',
      severity: Math.abs(trendSlope) > 10 ? 'high' : 'medium',
      message: `Rapid ${trendSlope > 0 ? 'growth' : 'decline'} detected. Expected to continue.`,
      predictedImpact: Math.abs(trendSlope) * 10,
      timeToImpact: 3600000,
    });
  }

  if (periodicScore > 0.7 && periodicScore < 0.9) {
    alerts.push({
      type: 'phase_misalignment',
      severity: 'low',
      message: 'Periodic pattern showing phase shift, monitor for disruption.',
      predictedImpact: 15,
      timeToImpact: 7200000,
    });
  }

  if (confidence < 0.6) {
    alerts.push({
      type: 'confidence_decay',
      severity: 'medium',
      message: 'Prediction confidence declining, data quality may be degrading.',
      predictedImpact: 20,
      timeToImpact: 1800000,
    });
  }

  return alerts;
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

    const { data: events, error } = await supabaseClient
      .from('events')
      .select('value, timestamp')
      .eq('seller_id', sellerId)
      .eq('type', metricType)
      .order('timestamp', { ascending: true })
      .limit(512);

    if (error || !events || events.length === 0) {
      return new Response(
        JSON.stringify({ 
          insights: [],
          healthScore: null,
          fingerprint: null,
          alerts: [],
          message: 'Insufficient data'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const values = events.map(e => Number(e.value));
    const timestamps = events.map(e => Number(e.timestamp));

    const trendSlope = calculateTrendSlope(values);
    const volatility = calculateVolatility(values);
    const timingEntropy = calculateTimingEntropy(timestamps);

    const anomalyScore = 0.5;
    const periodicScore = 0.3;
    const hfd = 1.2;

    const insights = generateAutoInsights(anomalyScore, periodicScore, hfd, trendSlope, volatility);
    const healthScore = calculateHealthScore(volatility, anomalyScore, trendSlope, events.length);
    const fingerprint = generateBehaviorFingerprint(sellerId, [periodicScore], hfd, timingEntropy);
    const alerts = generatePredictiveAlerts(trendSlope, periodicScore, 0.8);

    const result = {
      insights,
      healthScore,
      fingerprint,
      alerts,
      metadata: {
        dataPoints: events.length,
        analysisTimestamp: Date.now(),
      },
    };

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
