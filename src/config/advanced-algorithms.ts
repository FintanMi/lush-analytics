/**
 * Advanced Time-Series Algorithm Configurations
 * 
 * Implements cutting-edge algorithms for anomaly detection, pattern recognition,
 * and signal quality assessment.
 */

// Matrix Profile Configuration (STOMP/SCRIMP++)
export const MATRIX_PROFILE_CONFIG = {
  windowSize: 50,
  minMotifSimilarity: 0.85,
  discordThreshold: 2.5,
  useFFTAcceleration: true,
  maxComputationTimeMs: 5000,
} as const;

// Bayesian Online Change Point Detection (BOCPD)
export const BOCPD_CONFIG = {
  hazardRate: 0.01,
  priorMean: 0,
  priorVariance: 1,
  observationVariance: 1,
  changePointThreshold: 0.7,
  maxRunLength: 200,
} as const;

// Seasonal Hybrid ESD (S-H-ESD)
export const SEASONAL_HYBRID_ESD_CONFIG = {
  maxAnomalies: 10,
  alpha: 0.05,
  seasonalityPeriods: [24, 168, 720], // hourly, weekly, monthly
  hybridThreshold: 3.0,
  minSeasonalStrength: 0.6,
} as const;

// Copula-Based Dependency Drift
export const COPULA_CONFIG = {
  copulaType: 'gaussian' as const,
  dependencyThreshold: 0.3,
  driftThreshold: 0.2,
  windowSize: 100,
  metricPairs: [
    ['CLICK', 'VIEW'],
    ['VIEW', 'SALE'],
    ['CHECKOUT_STARTED', 'PAYMENT_SUCCEEDED'],
  ],
} as const;

// Dynamic Time Warping (DTW)
export const DTW_CONFIG = {
  windowSize: 50,
  distanceMetric: 'euclidean' as const,
  normalizeSignatures: true,
  similarityThreshold: 0.75,
  aggregationResolution: 'hourly' as const,
} as const;

// Signal-to-Noise Ratio (SNR) Thresholds
export const SNR_THRESHOLDS = {
  optimal: 20, // dB
  adequate: 10,
  minimal: 5,
  insufficient: 0,
} as const;

// Effective Sample Size (ESS) Configuration
export const ESS_CONFIG = {
  minEffectiveSize: 30,
  autocorrelationLag: 10,
  adjustmentMethod: 'kish' as const, // Kish's effective sample size
} as const;

// Window Stability Configuration
export const WINDOW_STABILITY_CONFIG = {
  rollingWindowSize: 20,
  stabilityThreshold: 0.8,
  maxContentChangeRate: 0.3,
} as const;

// Temporal Coverage Configuration
export const TEMPORAL_COVERAGE_CONFIG = {
  expectedBucketSize: 3600, // 1 hour in seconds
  minCoveragePercentage: 70,
  maxGapSize: 7200, // 2 hours
} as const;

// Entropy Drift Configuration
export const ENTROPY_DRIFT_CONFIG = {
  baselineWindowSize: 100,
  currentWindowSize: 20,
  driftThreshold: 0.3,
  timingBins: 24, // hourly bins
  valueBins: 10,
} as const;

// Query Execution Monitoring
export const QUERY_EXECUTION_CONFIG = {
  costDeltaThreshold: 0.5, // 50% deviation
  skewRatioThreshold: 3.0,
  minParallelismEfficiency: 0.7,
  cacheHitRatioTarget: 0.8,
  partialResultYieldTarget: 100, // ms
} as const;

// Reproducibility Configuration
export const REPRODUCIBILITY_CONFIG = {
  maxDriftRate: 0.01, // 1% of computations
  maxDriftMagnitude: 0.05, // 5% output difference
  configVersionTracking: true,
  deterministicMode: true,
} as const;

// Invariant Violation Severity Mapping
export const INVARIANT_SEVERITY_MAP = {
  determinism_violation: 'critical',
  computation_timeout: 'high',
  data_sufficiency_breach: 'medium',
  cache_inconsistency: 'low',
} as const;

// User Engagement Thresholds
export const ENGAGEMENT_THRESHOLDS = {
  minConfidenceMessageReadRate: 0.5,
  minAttributionPanelUsage: 3,
  maxQueryConsoleAbandonmentRate: 0.3,
  minVisualizationInteractionDepth: 2,
  minSessionDurationMs: 60000, // 1 minute
} as const;

// Alert Fatigue Detection
export const ALERT_FATIGUE_CONFIG = {
  stormThreshold: 10, // alerts per hour
  stormWindowMs: 3600000, // 1 hour
  maxFalsePositiveRate: 0.3,
  fatigueScoreThreshold: 0.7,
} as const;

// Tier Saturation Configuration
export const TIER_SATURATION_CONFIG = {
  warningThreshold: 0.8, // 80% usage
  criticalThreshold: 0.95, // 95% usage
  projectionWindowDays: 30,
  upgradeRecommendationThreshold: 0.85,
} as const;

// Revenue at Risk Estimation
export const REVENUE_RISK_CONFIG = {
  minConfidenceForAlert: 0.7,
  riskCategories: {
    low: { multiplier: 0.1, threshold: 100 },
    medium: { multiplier: 0.3, threshold: 1000 },
    high: { multiplier: 0.6, threshold: 10000 },
    critical: { multiplier: 1.0, threshold: 50000 },
  },
  interventionThreshold: 0.8,
} as const;

// Algorithm Selection Strategy
export interface AlgorithmStrategy {
  dataPoints: number;
  tier: string;
  algorithms: string[];
  fallbackChain: string[];
}

export const ALGORITHM_SELECTION_STRATEGIES: Record<string, AlgorithmStrategy> = {
  insufficient_data: {
    dataPoints: 30,
    tier: 'basic',
    algorithms: ['seasonal_hybrid_esd'],
    fallbackChain: ['simple_threshold'],
  },
  minimal_data: {
    dataPoints: 100,
    tier: 'basic',
    algorithms: ['seasonal_hybrid_esd', 'dtw'],
    fallbackChain: ['seasonal_hybrid_esd', 'simple_threshold'],
  },
  adequate_data: {
    dataPoints: 500,
    tier: 'pro',
    algorithms: ['matrix_profile', 'bocpd', 'seasonal_hybrid_esd', 'copula'],
    fallbackChain: ['seasonal_hybrid_esd', 'dtw'],
  },
  optimal_data: {
    dataPoints: 1000,
    tier: 'enterprise',
    algorithms: ['matrix_profile', 'bocpd', 'seasonal_hybrid_esd', 'copula', 'dtw'],
    fallbackChain: ['matrix_profile', 'seasonal_hybrid_esd'],
  },
} as const;

// Visualization Configuration
export const VISUALIZATION_CONFIG = {
  liveDAGUpdateIntervalMs: 1000,
  timeToInsightMaxStages: 6,
  attributionWaterfallMaxComponents: 10,
  frequencyDomainMaxFrequencies: 100,
  signalQualityOverlayResolution: 'minute' as const,
  heatmapColorScheme: {
    low: 'hsl(var(--chart-1))',
    medium: 'hsl(var(--chart-3))',
    high: 'hsl(var(--chart-5))',
  },
} as const;

// Export all configurations
export const ADVANCED_ALGORITHMS_CONFIG = {
  matrixProfile: MATRIX_PROFILE_CONFIG,
  bocpd: BOCPD_CONFIG,
  seasonalHybridESD: SEASONAL_HYBRID_ESD_CONFIG,
  copula: COPULA_CONFIG,
  dtw: DTW_CONFIG,
  snr: SNR_THRESHOLDS,
  ess: ESS_CONFIG,
  windowStability: WINDOW_STABILITY_CONFIG,
  temporalCoverage: TEMPORAL_COVERAGE_CONFIG,
  entropyDrift: ENTROPY_DRIFT_CONFIG,
  queryExecution: QUERY_EXECUTION_CONFIG,
  reproducibility: REPRODUCIBILITY_CONFIG,
  invariantSeverity: INVARIANT_SEVERITY_MAP,
  engagement: ENGAGEMENT_THRESHOLDS,
  alertFatigue: ALERT_FATIGUE_CONFIG,
  tierSaturation: TIER_SATURATION_CONFIG,
  revenueRisk: REVENUE_RISK_CONFIG,
  algorithmSelection: ALGORITHM_SELECTION_STRATEGIES,
  visualization: VISUALIZATION_CONFIG,
} as const;

export type AdvancedAlgorithmsConfig = typeof ADVANCED_ALGORITHMS_CONFIG;
