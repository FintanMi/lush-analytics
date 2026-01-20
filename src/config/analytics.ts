// Centralized configuration constants
// All magic numbers should be defined here and loaded from database

export interface TierConfig {
  tier: 'free' | 'basic' | 'pro' | 'enterprise';
  apiCallsLimit: number;
  windowSize: number;
  cacheTtlSeconds: number;
  maxBatchSize: number;
  predictionSteps: number;
  features: {
    export?: boolean;
    realtime?: boolean;
    webhooks?: boolean;
    custom?: boolean;
  };
}

export interface AlertConfig {
  id: string;
  name: string;
  triggerType: 'anomaly_score' | 'health_score' | 'prediction_confidence' | 'data_sufficiency';
  thresholdMin: number | null;
  thresholdMax: number | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  messageTemplate: string;
  enabled: boolean;
}

export interface ThresholdConfig {
  key: string;
  value: number;
  description: string;
  category: string;
}

// Default configurations (fallback if database unavailable)
export const DEFAULT_TIER_CONFIG: Record<string, TierConfig> = {
  free: {
    tier: 'free',
    apiCallsLimit: 1000,
    windowSize: 256,
    cacheTtlSeconds: 60,
    maxBatchSize: 100,
    predictionSteps: 5,
    features: { export: false, realtime: false, webhooks: false },
  },
  basic: {
    tier: 'basic',
    apiCallsLimit: 10000,
    windowSize: 512,
    cacheTtlSeconds: 30,
    maxBatchSize: 500,
    predictionSteps: 10,
    features: { export: true, realtime: true, webhooks: false },
  },
  pro: {
    tier: 'pro',
    apiCallsLimit: 100000,
    windowSize: 512,
    cacheTtlSeconds: 10,
    maxBatchSize: 1000,
    predictionSteps: 20,
    features: { export: true, realtime: true, webhooks: true },
  },
  enterprise: {
    tier: 'enterprise',
    apiCallsLimit: -1, // unlimited
    windowSize: 1024,
    cacheTtlSeconds: 5,
    maxBatchSize: 5000,
    predictionSteps: 50,
    features: { export: true, realtime: true, webhooks: true, custom: true },
  },
};

export const DEFAULT_THRESHOLDS: Record<string, number> = {
  'anomaly.deviation_weight': 0.4,
  'anomaly.periodic_weight': 0.3,
  'anomaly.hfd_weight': 0.3,
  'health.volatility_weight': 0.25,
  'health.anomaly_weight': 0.35,
  'health.risk_weight': 0.25,
  'health.consistency_weight': 0.15,
  'data.insufficient_threshold': 50,
  'data.minimal_threshold': 100,
  'data.adequate_threshold': 300,
  'fingerprint.bot_hfd_threshold': 1.8,
  'fingerprint.bot_entropy_threshold': 0.1,
  'fingerprint.manipulation_hfd_threshold': 1.6,
  'prediction.min_confidence': 0.5,
  'trend.acceleration_threshold': 5,
};

// Helper functions
export function getDataSufficiency(dataPoints: number, thresholds = DEFAULT_THRESHOLDS): 'insufficient' | 'minimal' | 'adequate' | 'optimal' {
  if (dataPoints < thresholds['data.insufficient_threshold']) return 'insufficient';
  if (dataPoints < thresholds['data.minimal_threshold']) return 'minimal';
  if (dataPoints < thresholds['data.adequate_threshold']) return 'adequate';
  return 'optimal';
}

export function getConfidenceMessage(confidence: number, sufficiency: string): string {
  if (sufficiency === 'insufficient') {
    return 'Insufficient data for reliable predictions. Results may be inaccurate.';
  }
  if (sufficiency === 'minimal') {
    return 'Limited data available. Predictions have reduced accuracy.';
  }
  if (confidence < 0.5) {
    return 'Low confidence prediction. Consider collecting more data.';
  }
  if (confidence < 0.7) {
    return 'Moderate confidence. Predictions are reasonably reliable.';
  }
  return 'High confidence prediction based on sufficient data.';
}

export function getSufficiencyMessage(sufficiency: string, dataPoints: number, thresholds = DEFAULT_THRESHOLDS): string {
  switch (sufficiency) {
    case 'insufficient':
      return `Only ${dataPoints} events available. Need ${Math.ceil(thresholds['data.insufficient_threshold'] - dataPoints)} more for basic analysis.`;
    case 'minimal':
      return `${dataPoints} events available. ${Math.ceil(thresholds['data.minimal_threshold'] - dataPoints)} more recommended for better accuracy.`;
    case 'adequate':
      return `${dataPoints} events available. Good quality analysis.`;
    case 'optimal':
      return `${dataPoints} events available. Excellent data quality for analysis.`;
    default:
      return 'Unknown data quality.';
  }
}

export function evaluateAlert(value: number, config: AlertConfig): boolean {
  if (!config.enabled) return false;
  
  if (config.thresholdMin !== null && value < config.thresholdMin) return false;
  if (config.thresholdMax !== null && value >= config.thresholdMax) return false;
  if (config.thresholdMin === null && config.thresholdMax === null) return true;
  
  return true;
}

export function formatAlertMessage(template: string, values: Record<string, unknown>): string {
  let message = template;
  for (const [key, value] of Object.entries(values)) {
    message = message.replace(`{${key}}`, String(value));
  }
  return message;
}
