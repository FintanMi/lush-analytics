export interface Seller {
  id: string;
  name: string;
  email?: string;
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
  data: any;
  last_computed: string;
  ttl: number;
  created_at: string;
}
