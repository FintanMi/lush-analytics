export interface Seller {
  id: string;
  name: string;
  email: string | null;
  created_at: string;
}

export interface Event {
  id: string;
  seller_id: string;
  timestamp: number;
  type: 'SALE' | 'CLICK' | 'VIEW';
  value: number;
  created_at: string;
}

export interface EventInput {
  sellerId: string;
  timestamp: number;
  type: 'SALE' | 'CLICK' | 'VIEW';
  value: number;
}

export interface BatchEventInput {
  events: EventInput[];
}

export interface AnomalyMetrics {
  periodicScore: number;
  hfd: number;
  dataPoints: number;
}

export interface AnomalyResponse {
  anomalyScore: number;
  metrics: AnomalyMetrics;
  message?: string;
}

export interface PredictionPoint {
  timestamp: number;
  predicted: number;
  confidence: number;
  upperBound?: number;
  lowerBound?: number;
}

export interface HistoricalPoint {
  timestamp: number;
  value: number;
}

export interface PredictionResponse {
  predictions: PredictionPoint[];
  historical: HistoricalPoint[];
  metadata: {
    dataPoints: number;
    predictionSteps: number;
  };
  message?: string;
}

export interface MetricsCache {
  id: string;
  seller_id: string;
  metric_type: string;
  data: Record<string, unknown>;
  last_computed: string;
  ttl: number;
  created_at: string;
}

export interface InsightAttribution {
  factor: string;
  contribution: number;
  description: string;
}

export interface AutoInsight {
  type: 'anomaly' | 'trend' | 'pattern' | 'alert';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  attribution: InsightAttribution[];
  confidence: number;
  timestamp: number;
}

export interface SellerHealthScore {
  overall: number;
  volatility: number;
  anomalyFrequency: number;
  predictiveRisk: number;
  dataConsistency: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface BehaviorFingerprint {
  sellerId: string;
  fftSignature: number[];
  hfdPattern: number;
  timingEntropy: number;
  patternType: 'normal' | 'bot' | 'manipulation' | 'irregular';
  confidence: number;
}

export interface PredictiveAlert {
  type: 'trend_acceleration' | 'phase_misalignment' | 'confidence_decay';
  severity: 'low' | 'medium' | 'high';
  message: string;
  predictedImpact: number;
  timeToImpact: number;
}
