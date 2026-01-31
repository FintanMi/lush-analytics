/**
 * Canonical Analytics Capability Registry
 * 
 * This registry serves as the "pg_catalog" for analytics capabilities,
 * enabling:
 * - Auto-UI generation
 * - Tier gating
 * - Cost-based query planning
 * - Future ML insertion without chaos
 * - Discoverability of 40+ analytics types
 */

export type AnalyticsCategory = 
  | 'DSP'              // Digital Signal Processing
  | 'Statistical'      // Statistical Analysis
  | 'Dependency'       // Dependency/Correlation Analysis
  | 'Forecast'         // Forecasting/Prediction
  | 'Fingerprint';     // Behavioral Fingerprinting

export type CostClass = 'cheap' | 'medium' | 'heavy';

export type DeterministicGuarantee = true | 'partial' | false;

export type ExplainabilityLevel = 'high' | 'medium' | 'low';

export type DefaultTier = 'free' | 'basic' | 'pro' | 'enterprise';

export interface InputRequirements {
  minWindow: number;           // Minimum data points required
  seasonality?: boolean;        // Requires seasonal data
  multivariate?: boolean;       // Requires multiple variables
  minSamplingRate?: number;     // Minimum sampling rate (Hz)
  requiresLabels?: boolean;     // Requires labeled data
}

export interface AnalyticsCapability {
  id: string;
  name: string;
  category: AnalyticsCategory;
  description: string;
  inputRequirements: InputRequirements;
  deterministicGuarantee: DeterministicGuarantee;
  costClass: CostClass;
  explainabilityLevel: ExplainabilityLevel;
  defaultTier: DefaultTier;
  
  // Decision mapping
  primaryQuestion: string;
  decisionEnabled: string;
  apiEndpoint?: string;
  alertSpawning: boolean;
  insightStateTransitions: string[];
  
  // Metadata
  tags: string[];
  relatedCapabilities?: string[];
}

/**
 * Comprehensive Analytics Capability Registry
 * 40+ analytics types with full metadata
 */
export const ANALYTICS_REGISTRY: Record<string, AnalyticsCapability> = {
  // ============ DSP (Digital Signal Processing) ============
  'fir_filter': {
    id: 'fir_filter',
    name: 'FIR Filter',
    category: 'DSP',
    description: 'Finite Impulse Response filter for noise reduction and trend extraction',
    inputRequirements: {
      minWindow: 64,
      seasonality: false,
      multivariate: false,
    },
    deterministicGuarantee: true,
    costClass: 'cheap',
    explainabilityLevel: 'high',
    defaultTier: 'free',
    primaryQuestion: 'What is the underlying trend without noise?',
    decisionEnabled: 'Identify true signal from noisy data',
    apiEndpoint: '/api/analytics/fir-filter',
    alertSpawning: false,
    insightStateTransitions: ['raw_data', 'filtered_signal'],
    tags: ['signal-processing', 'noise-reduction', 'trend'],
    relatedCapabilities: ['fft_analysis', 'wavelet_transform'],
  },
  
  'fft_analysis': {
    id: 'fft_analysis',
    name: 'FFT Analysis',
    category: 'DSP',
    description: 'Fast Fourier Transform for frequency domain analysis and periodicity detection',
    inputRequirements: {
      minWindow: 128,
      seasonality: false,
      multivariate: false,
      minSamplingRate: 1,
    },
    deterministicGuarantee: true,
    costClass: 'medium',
    explainabilityLevel: 'medium',
    defaultTier: 'free',
    primaryQuestion: 'What are the dominant periodic patterns?',
    decisionEnabled: 'Detect manipulation through periodic behavior',
    apiEndpoint: '/api/analytics/fft',
    alertSpawning: true,
    insightStateTransitions: ['time_domain', 'frequency_domain', 'periodic_anomaly'],
    tags: ['frequency-analysis', 'periodicity', 'manipulation-detection'],
    relatedCapabilities: ['fir_filter', 'hfd_complexity'],
  },
  
  'hfd_complexity': {
    id: 'hfd_complexity',
    name: 'Higuchi Fractal Dimension',
    category: 'DSP',
    description: 'Fractal dimension analysis for complexity and bot detection',
    inputRequirements: {
      minWindow: 100,
      seasonality: false,
      multivariate: false,
    },
    deterministicGuarantee: true,
    costClass: 'medium',
    explainabilityLevel: 'low',
    defaultTier: 'basic',
    primaryQuestion: 'Is this behavior too regular to be human?',
    decisionEnabled: 'Flag bot-like patterns and automated behavior',
    apiEndpoint: '/api/analytics/hfd',
    alertSpawning: true,
    insightStateTransitions: ['behavior_analysis', 'bot_detection', 'seller_health_risk'],
    tags: ['fractal-analysis', 'bot-detection', 'complexity'],
    relatedCapabilities: ['fft_analysis', 'entropy_analysis'],
  },
  
  'wavelet_transform': {
    id: 'wavelet_transform',
    name: 'Wavelet Transform',
    category: 'DSP',
    description: 'Multi-resolution time-frequency analysis for transient detection',
    inputRequirements: {
      minWindow: 256,
      seasonality: false,
      multivariate: false,
    },
    deterministicGuarantee: true,
    costClass: 'heavy',
    explainabilityLevel: 'low',
    defaultTier: 'pro',
    primaryQuestion: 'Where are the sudden changes in behavior?',
    decisionEnabled: 'Detect transient anomalies and regime changes',
    apiEndpoint: '/api/analytics/wavelet',
    alertSpawning: true,
    insightStateTransitions: ['time_series', 'wavelet_coefficients', 'transient_detected'],
    tags: ['time-frequency', 'transient-detection', 'multi-resolution'],
    relatedCapabilities: ['fft_analysis', 'changepoint_detection'],
  },
  
  // ============ Statistical Analysis ============
  'z_score_anomaly': {
    id: 'z_score_anomaly',
    name: 'Z-Score Anomaly Detection',
    category: 'Statistical',
    description: 'Standard deviation-based anomaly detection',
    inputRequirements: {
      minWindow: 30,
      seasonality: false,
      multivariate: false,
    },
    deterministicGuarantee: true,
    costClass: 'cheap',
    explainabilityLevel: 'high',
    defaultTier: 'free',
    primaryQuestion: 'Which data points are statistical outliers?',
    decisionEnabled: 'Flag unusual spikes or drops in metrics',
    apiEndpoint: '/api/analytics/z-score',
    alertSpawning: true,
    insightStateTransitions: ['normal_data', 'outlier_detected', 'alert_triggered'],
    tags: ['anomaly-detection', 'outlier', 'statistical'],
    relatedCapabilities: ['iqr_outlier', 'mad_outlier'],
  },
  
  'iqr_outlier': {
    id: 'iqr_outlier',
    name: 'IQR Outlier Detection',
    category: 'Statistical',
    description: 'Interquartile range-based robust outlier detection',
    inputRequirements: {
      minWindow: 50,
      seasonality: false,
      multivariate: false,
    },
    deterministicGuarantee: true,
    costClass: 'cheap',
    explainabilityLevel: 'high',
    defaultTier: 'free',
    primaryQuestion: 'Which values are extreme compared to the distribution?',
    decisionEnabled: 'Identify robust outliers resistant to extreme values',
    apiEndpoint: '/api/analytics/iqr',
    alertSpawning: true,
    insightStateTransitions: ['distribution_analysis', 'outlier_flagged'],
    tags: ['outlier-detection', 'robust-statistics', 'quartiles'],
    relatedCapabilities: ['z_score_anomaly', 'mad_outlier'],
  },
  
  'mad_outlier': {
    id: 'mad_outlier',
    name: 'MAD Outlier Detection',
    category: 'Statistical',
    description: 'Median Absolute Deviation for robust outlier detection',
    inputRequirements: {
      minWindow: 50,
      seasonality: false,
      multivariate: false,
    },
    deterministicGuarantee: true,
    costClass: 'cheap',
    explainabilityLevel: 'high',
    defaultTier: 'free',
    primaryQuestion: 'What are the robust outliers using median-based statistics?',
    decisionEnabled: 'Detect outliers without being influenced by extreme values',
    apiEndpoint: '/api/analytics/mad',
    alertSpawning: true,
    insightStateTransitions: ['median_analysis', 'robust_outlier_detected'],
    tags: ['outlier-detection', 'robust-statistics', 'median'],
    relatedCapabilities: ['z_score_anomaly', 'iqr_outlier'],
  },
  
  'seasonal_decomposition': {
    id: 'seasonal_decomposition',
    name: 'Seasonal Decomposition',
    category: 'Statistical',
    description: 'Decompose time series into trend, seasonal, and residual components',
    inputRequirements: {
      minWindow: 200,
      seasonality: true,
      multivariate: false,
    },
    deterministicGuarantee: true,
    costClass: 'medium',
    explainabilityLevel: 'high',
    defaultTier: 'basic',
    primaryQuestion: 'What are the trend and seasonal patterns?',
    decisionEnabled: 'Separate long-term trends from seasonal effects',
    apiEndpoint: '/api/analytics/seasonal-decomposition',
    alertSpawning: false,
    insightStateTransitions: ['raw_series', 'decomposed_components'],
    tags: ['seasonality', 'trend-analysis', 'decomposition'],
    relatedCapabilities: ['stl_decomposition', 'trend_analysis'],
  },
  
  'stl_decomposition': {
    id: 'stl_decomposition',
    name: 'STL Decomposition',
    category: 'Statistical',
    description: 'Seasonal-Trend decomposition using LOESS',
    inputRequirements: {
      minWindow: 300,
      seasonality: true,
      multivariate: false,
    },
    deterministicGuarantee: true,
    costClass: 'medium',
    explainabilityLevel: 'high',
    defaultTier: 'basic',
    primaryQuestion: 'What are the robust seasonal and trend components?',
    decisionEnabled: 'Extract seasonal patterns robust to outliers',
    apiEndpoint: '/api/analytics/stl',
    alertSpawning: false,
    insightStateTransitions: ['time_series', 'stl_components'],
    tags: ['seasonality', 'loess', 'robust-decomposition'],
    relatedCapabilities: ['seasonal_decomposition', 's_h_esd'],
  },
  
  's_h_esd': {
    id: 's_h_esd',
    name: 'Seasonal Hybrid ESD',
    category: 'Statistical',
    description: 'Seasonal Hybrid Extreme Studentized Deviate for anomaly detection',
    inputRequirements: {
      minWindow: 200,
      seasonality: true,
      multivariate: false,
    },
    deterministicGuarantee: true,
    costClass: 'medium',
    explainabilityLevel: 'medium',
    defaultTier: 'basic',
    primaryQuestion: 'Which anomalies account for seasonality?',
    decisionEnabled: 'Detect anomalies while respecting seasonal patterns',
    apiEndpoint: '/api/analytics/s-h-esd',
    alertSpawning: true,
    insightStateTransitions: ['seasonal_data', 'seasonal_anomaly_detected'],
    tags: ['seasonal-anomaly', 'esd', 'twitter-algorithm'],
    relatedCapabilities: ['stl_decomposition', 'z_score_anomaly'],
  },
  
  // ============ Dependency Analysis ============
  'pearson_correlation': {
    id: 'pearson_correlation',
    name: 'Pearson Correlation',
    category: 'Dependency',
    description: 'Linear correlation analysis between variables',
    inputRequirements: {
      minWindow: 30,
      seasonality: false,
      multivariate: true,
    },
    deterministicGuarantee: true,
    costClass: 'cheap',
    explainabilityLevel: 'high',
    defaultTier: 'free',
    primaryQuestion: 'How strongly are these metrics linearly related?',
    decisionEnabled: 'Identify correlated metrics for attribution',
    apiEndpoint: '/api/analytics/pearson',
    alertSpawning: false,
    insightStateTransitions: ['multivariate_data', 'correlation_matrix'],
    tags: ['correlation', 'linear-relationship', 'attribution'],
    relatedCapabilities: ['spearman_correlation', 'granger_causality'],
  },
  
  'spearman_correlation': {
    id: 'spearman_correlation',
    name: 'Spearman Correlation',
    category: 'Dependency',
    description: 'Rank-based correlation for non-linear relationships',
    inputRequirements: {
      minWindow: 30,
      seasonality: false,
      multivariate: true,
    },
    deterministicGuarantee: true,
    costClass: 'cheap',
    explainabilityLevel: 'high',
    defaultTier: 'free',
    primaryQuestion: 'What is the monotonic relationship between metrics?',
    decisionEnabled: 'Detect non-linear dependencies',
    apiEndpoint: '/api/analytics/spearman',
    alertSpawning: false,
    insightStateTransitions: ['multivariate_data', 'rank_correlation'],
    tags: ['correlation', 'non-linear', 'rank-based'],
    relatedCapabilities: ['pearson_correlation', 'kendall_tau'],
  },
  
  'granger_causality': {
    id: 'granger_causality',
    name: 'Granger Causality',
    category: 'Dependency',
    description: 'Test if one time series predicts another',
    inputRequirements: {
      minWindow: 100,
      seasonality: false,
      multivariate: true,
    },
    deterministicGuarantee: 'partial',
    costClass: 'medium',
    explainabilityLevel: 'medium',
    defaultTier: 'basic',
    primaryQuestion: 'Does metric A predict metric B?',
    decisionEnabled: 'Establish predictive relationships for attribution',
    apiEndpoint: '/api/analytics/granger',
    alertSpawning: false,
    insightStateTransitions: ['time_series_pair', 'causality_test', 'attribution_waterfall'],
    tags: ['causality', 'prediction', 'attribution'],
    relatedCapabilities: ['transfer_entropy', 'ccm'],
  },
  
  'transfer_entropy': {
    id: 'transfer_entropy',
    name: 'Transfer Entropy',
    category: 'Dependency',
    description: 'Information-theoretic measure of directed information flow',
    inputRequirements: {
      minWindow: 200,
      seasonality: false,
      multivariate: true,
    },
    deterministicGuarantee: 'partial',
    costClass: 'heavy',
    explainabilityLevel: 'low',
    defaultTier: 'pro',
    primaryQuestion: 'How much information flows from A to B?',
    decisionEnabled: 'Quantify directed influence between metrics',
    apiEndpoint: '/api/analytics/transfer-entropy',
    alertSpawning: false,
    insightStateTransitions: ['multivariate_series', 'information_flow', 'causal_graph'],
    tags: ['information-theory', 'causality', 'directed-influence'],
    relatedCapabilities: ['granger_causality', 'mutual_information'],
  },
  
  'copula_dependency': {
    id: 'copula_dependency',
    name: 'Copula Dependency Drift',
    category: 'Dependency',
    description: 'Detect changes in dependency structure using copulas',
    inputRequirements: {
      minWindow: 300,
      seasonality: false,
      multivariate: true,
    },
    deterministicGuarantee: 'partial',
    costClass: 'heavy',
    explainabilityLevel: 'low',
    defaultTier: 'pro',
    primaryQuestion: 'Has the relationship between metrics changed?',
    decisionEnabled: 'Detect dependency drift and structural breaks',
    apiEndpoint: '/api/analytics/copula-drift',
    alertSpawning: true,
    insightStateTransitions: ['dependency_baseline', 'drift_detected', 'structural_break'],
    tags: ['copula', 'dependency-drift', 'structural-change'],
    relatedCapabilities: ['pearson_correlation', 'changepoint_detection'],
  },
  
  // ============ Forecasting ============
  'arima_forecast': {
    id: 'arima_forecast',
    name: 'ARIMA Forecast',
    category: 'Forecast',
    description: 'AutoRegressive Integrated Moving Average forecasting',
    inputRequirements: {
      minWindow: 100,
      seasonality: false,
      multivariate: false,
    },
    deterministicGuarantee: 'partial',
    costClass: 'medium',
    explainabilityLevel: 'medium',
    defaultTier: 'basic',
    primaryQuestion: 'What will the metric be in the next N periods?',
    decisionEnabled: 'Forecast future values for planning',
    apiEndpoint: '/api/analytics/arima',
    alertSpawning: true,
    insightStateTransitions: ['historical_data', 'forecast_generated', 'prediction_alert'],
    tags: ['forecasting', 'arima', 'time-series'],
    relatedCapabilities: ['sarima_forecast', 'exponential_smoothing'],
  },
  
  'sarima_forecast': {
    id: 'sarima_forecast',
    name: 'SARIMA Forecast',
    category: 'Forecast',
    description: 'Seasonal ARIMA for forecasting with seasonality',
    inputRequirements: {
      minWindow: 200,
      seasonality: true,
      multivariate: false,
    },
    deterministicGuarantee: 'partial',
    costClass: 'medium',
    explainabilityLevel: 'medium',
    defaultTier: 'basic',
    primaryQuestion: 'What will the seasonal metric be in the future?',
    decisionEnabled: 'Forecast seasonal patterns',
    apiEndpoint: '/api/analytics/sarima',
    alertSpawning: true,
    insightStateTransitions: ['seasonal_history', 'seasonal_forecast'],
    tags: ['forecasting', 'sarima', 'seasonality'],
    relatedCapabilities: ['arima_forecast', 'prophet_forecast'],
  },
  
  'exponential_smoothing': {
    id: 'exponential_smoothing',
    name: 'Exponential Smoothing',
    category: 'Forecast',
    description: 'Weighted average forecasting with exponential decay',
    inputRequirements: {
      minWindow: 50,
      seasonality: false,
      multivariate: false,
    },
    deterministicGuarantee: true,
    costClass: 'cheap',
    explainabilityLevel: 'high',
    defaultTier: 'free',
    primaryQuestion: 'What is the smoothed trend forecast?',
    decisionEnabled: 'Generate simple trend forecasts',
    apiEndpoint: '/api/analytics/exp-smoothing',
    alertSpawning: false,
    insightStateTransitions: ['raw_data', 'smoothed_forecast'],
    tags: ['forecasting', 'smoothing', 'simple'],
    relatedCapabilities: ['arima_forecast', 'moving_average'],
  },
  
  'prophet_forecast': {
    id: 'prophet_forecast',
    name: 'Prophet Forecast',
    category: 'Forecast',
    description: 'Facebook Prophet for robust forecasting with holidays',
    inputRequirements: {
      minWindow: 300,
      seasonality: true,
      multivariate: false,
    },
    deterministicGuarantee: 'partial',
    costClass: 'heavy',
    explainabilityLevel: 'medium',
    defaultTier: 'pro',
    primaryQuestion: 'What is the forecast accounting for holidays and events?',
    decisionEnabled: 'Generate robust forecasts with external regressors',
    apiEndpoint: '/api/analytics/prophet',
    alertSpawning: true,
    insightStateTransitions: ['historical_data', 'prophet_forecast', 'confidence_intervals'],
    tags: ['forecasting', 'prophet', 'holidays'],
    relatedCapabilities: ['sarima_forecast', 'lstm_forecast'],
  },
  
  'lstm_forecast': {
    id: 'lstm_forecast',
    name: 'LSTM Forecast',
    category: 'Forecast',
    description: 'Long Short-Term Memory neural network forecasting',
    inputRequirements: {
      minWindow: 500,
      seasonality: false,
      multivariate: true,
    },
    deterministicGuarantee: false,
    costClass: 'heavy',
    explainabilityLevel: 'low',
    defaultTier: 'enterprise',
    primaryQuestion: 'What is the deep learning forecast?',
    decisionEnabled: 'Generate complex non-linear forecasts',
    apiEndpoint: '/api/analytics/lstm',
    alertSpawning: true,
    insightStateTransitions: ['training_data', 'model_trained', 'forecast_generated'],
    tags: ['forecasting', 'deep-learning', 'lstm'],
    relatedCapabilities: ['prophet_forecast', 'transformer_forecast'],
  },
  
  // ============ Fingerprinting ============
  'behavior_fingerprint': {
    id: 'behavior_fingerprint',
    name: 'Behavior Fingerprint',
    category: 'Fingerprint',
    description: 'Generate unique behavioral signature for sellers',
    inputRequirements: {
      minWindow: 200,
      seasonality: false,
      multivariate: true,
    },
    deterministicGuarantee: true,
    costClass: 'medium',
    explainabilityLevel: 'medium',
    defaultTier: 'basic',
    primaryQuestion: 'What is the unique behavioral signature?',
    decisionEnabled: 'Identify seller patterns and detect drift',
    apiEndpoint: '/api/analytics/fingerprint',
    alertSpawning: true,
    insightStateTransitions: ['behavior_data', 'fingerprint_generated', 'drift_monitoring'],
    tags: ['fingerprinting', 'behavior-analysis', 'drift-detection'],
    relatedCapabilities: ['entropy_analysis', 'hfd_complexity'],
  },
  
  'entropy_analysis': {
    id: 'entropy_analysis',
    name: 'Entropy Analysis',
    category: 'Fingerprint',
    description: 'Measure randomness and predictability of behavior',
    inputRequirements: {
      minWindow: 100,
      seasonality: false,
      multivariate: false,
    },
    deterministicGuarantee: true,
    costClass: 'cheap',
    explainabilityLevel: 'medium',
    defaultTier: 'free',
    primaryQuestion: 'How predictable is this behavior?',
    decisionEnabled: 'Detect bot-like low-entropy patterns',
    apiEndpoint: '/api/analytics/entropy',
    alertSpawning: true,
    insightStateTransitions: ['event_sequence', 'entropy_calculated', 'bot_flag'],
    tags: ['entropy', 'bot-detection', 'predictability'],
    relatedCapabilities: ['hfd_complexity', 'behavior_fingerprint'],
  },
  
  'dtw_baseline': {
    id: 'dtw_baseline',
    name: 'DTW Baseline Comparison',
    category: 'Fingerprint',
    description: 'Dynamic Time Warping distance from baseline behavior',
    inputRequirements: {
      minWindow: 150,
      seasonality: false,
      multivariate: false,
    },
    deterministicGuarantee: true,
    costClass: 'medium',
    explainabilityLevel: 'medium',
    defaultTier: 'basic',
    primaryQuestion: 'How different is current behavior from baseline?',
    decisionEnabled: 'Detect behavioral drift and anomalies',
    apiEndpoint: '/api/analytics/dtw',
    alertSpawning: true,
    insightStateTransitions: ['baseline_behavior', 'current_behavior', 'drift_score'],
    tags: ['dtw', 'drift-detection', 'baseline-comparison'],
    relatedCapabilities: ['behavior_fingerprint', 'matrix_profile'],
  },
  
  'matrix_profile': {
    id: 'matrix_profile',
    name: 'Matrix Profile (STOMP)',
    category: 'Fingerprint',
    description: 'Find repeated patterns and anomalies using matrix profile',
    inputRequirements: {
      minWindow: 200,
      seasonality: false,
      multivariate: false,
    },
    deterministicGuarantee: true,
    costClass: 'heavy',
    explainabilityLevel: 'medium',
    defaultTier: 'pro',
    primaryQuestion: 'What are the repeated patterns and anomalies?',
    decisionEnabled: 'Discover motifs and discord in behavior',
    apiEndpoint: '/api/analytics/matrix-profile',
    alertSpawning: true,
    insightStateTransitions: ['time_series', 'matrix_profile', 'motif_discord_detected'],
    tags: ['matrix-profile', 'motif-discovery', 'discord'],
    relatedCapabilities: ['dtw_baseline', 'behavior_fingerprint'],
  },
  
  // ============ Advanced Algorithms ============
  'bocpd': {
    id: 'bocpd',
    name: 'Bayesian Online Changepoint Detection',
    category: 'Statistical',
    description: 'Online detection of distribution changes',
    inputRequirements: {
      minWindow: 100,
      seasonality: false,
      multivariate: false,
    },
    deterministicGuarantee: 'partial',
    costClass: 'medium',
    explainabilityLevel: 'low',
    defaultTier: 'basic',
    primaryQuestion: 'When did the distribution change?',
    decisionEnabled: 'Detect regime changes in real-time',
    apiEndpoint: '/api/analytics/bocpd',
    alertSpawning: true,
    insightStateTransitions: ['streaming_data', 'changepoint_detected', 'regime_shift'],
    tags: ['changepoint', 'bayesian', 'online-learning'],
    relatedCapabilities: ['cusum', 'wavelet_transform'],
  },
  
  'cusum': {
    id: 'cusum',
    name: 'CUSUM',
    category: 'Statistical',
    description: 'Cumulative Sum control chart for change detection',
    inputRequirements: {
      minWindow: 50,
      seasonality: false,
      multivariate: false,
    },
    deterministicGuarantee: true,
    costClass: 'cheap',
    explainabilityLevel: 'high',
    defaultTier: 'free',
    primaryQuestion: 'Has the mean shifted?',
    decisionEnabled: 'Detect sustained shifts in metrics',
    apiEndpoint: '/api/analytics/cusum',
    alertSpawning: true,
    insightStateTransitions: ['baseline_mean', 'cusum_chart', 'shift_detected'],
    tags: ['control-chart', 'mean-shift', 'quality-control'],
    relatedCapabilities: ['bocpd', 'z_score_anomaly'],
  },
  
  'isolation_forest': {
    id: 'isolation_forest',
    name: 'Isolation Forest',
    category: 'Statistical',
    description: 'Tree-based anomaly detection',
    inputRequirements: {
      minWindow: 100,
      seasonality: false,
      multivariate: true,
    },
    deterministicGuarantee: false,
    costClass: 'medium',
    explainabilityLevel: 'low',
    defaultTier: 'basic',
    primaryQuestion: 'Which multivariate points are anomalous?',
    decisionEnabled: 'Detect complex multivariate anomalies',
    apiEndpoint: '/api/analytics/isolation-forest',
    alertSpawning: true,
    insightStateTransitions: ['multivariate_data', 'anomaly_score', 'outlier_flagged'],
    tags: ['anomaly-detection', 'tree-based', 'multivariate'],
    relatedCapabilities: ['lof', 'autoencoder_anomaly'],
  },
  
  'lof': {
    id: 'lof',
    name: 'Local Outlier Factor',
    category: 'Statistical',
    description: 'Density-based local outlier detection',
    inputRequirements: {
      minWindow: 100,
      seasonality: false,
      multivariate: true,
    },
    deterministicGuarantee: true,
    costClass: 'medium',
    explainabilityLevel: 'medium',
    defaultTier: 'basic',
    primaryQuestion: 'Which points have unusual local density?',
    decisionEnabled: 'Detect local anomalies in multivariate space',
    apiEndpoint: '/api/analytics/lof',
    alertSpawning: true,
    insightStateTransitions: ['density_analysis', 'local_outlier_detected'],
    tags: ['outlier-detection', 'density-based', 'local-anomaly'],
    relatedCapabilities: ['isolation_forest', 'dbscan'],
  },
  
  'autoencoder_anomaly': {
    id: 'autoencoder_anomaly',
    name: 'Autoencoder Anomaly Detection',
    category: 'Statistical',
    description: 'Neural network reconstruction error for anomaly detection',
    inputRequirements: {
      minWindow: 500,
      seasonality: false,
      multivariate: true,
    },
    deterministicGuarantee: false,
    costClass: 'heavy',
    explainabilityLevel: 'low',
    defaultTier: 'enterprise',
    primaryQuestion: 'Which patterns cannot be reconstructed?',
    decisionEnabled: 'Detect complex non-linear anomalies',
    apiEndpoint: '/api/analytics/autoencoder',
    alertSpawning: true,
    insightStateTransitions: ['training_data', 'model_trained', 'reconstruction_error', 'anomaly_detected'],
    tags: ['deep-learning', 'anomaly-detection', 'autoencoder'],
    relatedCapabilities: ['isolation_forest', 'vae_anomaly'],
  },
  
  // ============ Health & Risk Scoring ============
  'health_score': {
    id: 'health_score',
    name: 'Seller Health Score',
    category: 'Statistical',
    description: 'Composite health score from multiple signals',
    inputRequirements: {
      minWindow: 100,
      seasonality: false,
      multivariate: true,
    },
    deterministicGuarantee: true,
    costClass: 'medium',
    explainabilityLevel: 'high',
    defaultTier: 'free',
    primaryQuestion: 'How healthy is this seller overall?',
    decisionEnabled: 'Prioritize seller interventions and support',
    apiEndpoint: '/api/analytics/health-score',
    alertSpawning: true,
    insightStateTransitions: ['multi_signal', 'health_calculated', 'risk_assessment'],
    tags: ['health-score', 'composite-metric', 'risk-assessment'],
    relatedCapabilities: ['risk_score', 'behavior_fingerprint'],
  },
  
  'risk_score': {
    id: 'risk_score',
    name: 'Risk Score',
    category: 'Statistical',
    description: 'Fraud and manipulation risk assessment',
    inputRequirements: {
      minWindow: 150,
      seasonality: false,
      multivariate: true,
    },
    deterministicGuarantee: 'partial',
    costClass: 'medium',
    explainabilityLevel: 'medium',
    defaultTier: 'basic',
    primaryQuestion: 'What is the fraud/manipulation risk?',
    decisionEnabled: 'Flag high-risk sellers for review',
    apiEndpoint: '/api/analytics/risk-score',
    alertSpawning: true,
    insightStateTransitions: ['behavior_signals', 'risk_calculated', 'fraud_alert'],
    tags: ['risk-assessment', 'fraud-detection', 'manipulation'],
    relatedCapabilities: ['health_score', 'behavior_fingerprint'],
  },
  
  // ============ Funnel & Attribution ============
  'funnel_analysis': {
    id: 'funnel_analysis',
    name: 'Funnel Analysis',
    category: 'Statistical',
    description: 'Conversion funnel analysis and drop-off detection',
    inputRequirements: {
      minWindow: 100,
      seasonality: false,
      multivariate: false,
      requiresLabels: true,
    },
    deterministicGuarantee: true,
    costClass: 'cheap',
    explainabilityLevel: 'high',
    defaultTier: 'free',
    primaryQuestion: 'Where are users dropping off in the funnel?',
    decisionEnabled: 'Optimize conversion paths',
    apiEndpoint: '/api/analytics/funnel',
    alertSpawning: true,
    insightStateTransitions: ['event_sequence', 'funnel_calculated', 'drop_off_alert'],
    tags: ['funnel', 'conversion', 'drop-off'],
    relatedCapabilities: ['attribution_waterfall', 'cohort_analysis'],
  },
  
  'attribution_waterfall': {
    id: 'attribution_waterfall',
    name: 'Attribution Waterfall',
    category: 'Dependency',
    description: 'Multi-touch attribution analysis',
    inputRequirements: {
      minWindow: 200,
      seasonality: false,
      multivariate: true,
    },
    deterministicGuarantee: 'partial',
    costClass: 'medium',
    explainabilityLevel: 'high',
    defaultTier: 'basic',
    primaryQuestion: 'Which factors contributed to the outcome?',
    decisionEnabled: 'Allocate credit to contributing factors',
    apiEndpoint: '/api/analytics/attribution',
    alertSpawning: false,
    insightStateTransitions: ['multi_touch_data', 'attribution_calculated', 'waterfall_visualization'],
    tags: ['attribution', 'multi-touch', 'contribution'],
    relatedCapabilities: ['granger_causality', 'shapley_values'],
  },
  
  'cohort_analysis': {
    id: 'cohort_analysis',
    name: 'Cohort Analysis',
    category: 'Statistical',
    description: 'Group-based behavior analysis over time',
    inputRequirements: {
      minWindow: 200,
      seasonality: false,
      multivariate: false,
      requiresLabels: true,
    },
    deterministicGuarantee: true,
    costClass: 'cheap',
    explainabilityLevel: 'high',
    defaultTier: 'free',
    primaryQuestion: 'How do different cohorts behave over time?',
    decisionEnabled: 'Identify cohort-specific patterns and retention',
    apiEndpoint: '/api/analytics/cohort',
    alertSpawning: false,
    insightStateTransitions: ['cohort_data', 'retention_calculated', 'cohort_comparison'],
    tags: ['cohort', 'retention', 'group-analysis'],
    relatedCapabilities: ['funnel_analysis', 'survival_analysis'],
  },
  
  // ============ Signal Quality ============
  'snr_calculation': {
    id: 'snr_calculation',
    name: 'Signal-to-Noise Ratio',
    category: 'DSP',
    description: 'Measure signal quality and data reliability',
    inputRequirements: {
      minWindow: 50,
      seasonality: false,
      multivariate: false,
    },
    deterministicGuarantee: true,
    costClass: 'cheap',
    explainabilityLevel: 'high',
    defaultTier: 'free',
    primaryQuestion: 'How reliable is this data?',
    decisionEnabled: 'Gate analytics on data quality',
    apiEndpoint: '/api/analytics/snr',
    alertSpawning: true,
    insightStateTransitions: ['raw_signal', 'snr_calculated', 'quality_gate'],
    tags: ['signal-quality', 'data-reliability', 'snr'],
    relatedCapabilities: ['entropy_analysis', 'data_sufficiency'],
  },
  
  'data_sufficiency': {
    id: 'data_sufficiency',
    name: 'Data Sufficiency Check',
    category: 'Statistical',
    description: 'Assess if data is sufficient for analysis',
    inputRequirements: {
      minWindow: 1,
      seasonality: false,
      multivariate: false,
    },
    deterministicGuarantee: true,
    costClass: 'cheap',
    explainabilityLevel: 'high',
    defaultTier: 'free',
    primaryQuestion: 'Is there enough data for reliable analysis?',
    decisionEnabled: 'Gate analytics and show confidence warnings',
    apiEndpoint: '/api/analytics/data-sufficiency',
    alertSpawning: false,
    insightStateTransitions: ['data_check', 'sufficiency_assessed'],
    tags: ['data-quality', 'sufficiency', 'confidence'],
    relatedCapabilities: ['snr_calculation', 'effective_sample_size'],
  },
};

/**
 * Helper functions for registry operations
 */

export function getCapabilityById(id: string): AnalyticsCapability | undefined {
  return ANALYTICS_REGISTRY[id];
}

export function getCapabilitiesByCategory(category: AnalyticsCategory): AnalyticsCapability[] {
  return Object.values(ANALYTICS_REGISTRY).filter(cap => cap.category === category);
}

export function getCapabilitiesByTier(tier: DefaultTier): AnalyticsCapability[] {
  const tierHierarchy: Record<DefaultTier, DefaultTier[]> = {
    free: ['free'],
    basic: ['free', 'basic'],
    pro: ['free', 'basic', 'pro'],
    enterprise: ['free', 'basic', 'pro', 'enterprise'],
  };
  
  const allowedTiers = tierHierarchy[tier];
  return Object.values(ANALYTICS_REGISTRY).filter(cap => 
    allowedTiers.includes(cap.defaultTier)
  );
}

export function getCapabilitiesByCostClass(costClass: CostClass): AnalyticsCapability[] {
  return Object.values(ANALYTICS_REGISTRY).filter(cap => cap.costClass === costClass);
}

export function searchCapabilities(query: string): AnalyticsCapability[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(ANALYTICS_REGISTRY).filter(cap =>
    cap.name.toLowerCase().includes(lowerQuery) ||
    cap.description.toLowerCase().includes(lowerQuery) ||
    cap.tags.some(tag => tag.includes(lowerQuery))
  );
}

export function getRelatedCapabilities(id: string): AnalyticsCapability[] {
  const capability = getCapabilityById(id);
  if (!capability || !capability.relatedCapabilities) return [];
  
  return capability.relatedCapabilities
    .map(relatedId => getCapabilityById(relatedId))
    .filter((cap): cap is AnalyticsCapability => cap !== undefined);
}

/**
 * Cost estimation for query planning
 */
export function estimateQueryCost(capabilityIds: string[]): number {
  const costMap: Record<CostClass, number> = {
    cheap: 1,
    medium: 5,
    heavy: 20,
  };
  
  return capabilityIds.reduce((total, id) => {
    const cap = getCapabilityById(id);
    return total + (cap ? costMap[cap.costClass] : 0);
  }, 0);
}

/**
 * Check if capabilities can run in parallel
 */
export function canRunInParallel(capabilityIds: string[]): boolean {
  const capabilities = capabilityIds
    .map(id => getCapabilityById(id))
    .filter((cap): cap is AnalyticsCapability => cap !== undefined);
  
  // All must be deterministic for parallel execution
  return capabilities.every(cap => cap.deterministicGuarantee === true);
}

/**
 * Generate UI metadata for auto-generation
 */
export interface UIMetadata {
  displayName: string;
  icon: string;
  color: string;
  requiresInput: string[];
  outputFormat: string;
}

export function generateUIMetadata(id: string): UIMetadata | null {
  const cap = getCapabilityById(id);
  if (!cap) return null;
  
  const categoryIcons: Record<AnalyticsCategory, string> = {
    DSP: '📊',
    Statistical: '📈',
    Dependency: '🔗',
    Forecast: '🔮',
    Fingerprint: '🔍',
  };
  
  const categoryColors: Record<AnalyticsCategory, string> = {
    DSP: 'blue',
    Statistical: 'green',
    Dependency: 'purple',
    Forecast: 'orange',
    Fingerprint: 'red',
  };
  
  return {
    displayName: cap.name,
    icon: categoryIcons[cap.category],
    color: categoryColors[cap.category],
    requiresInput: [
      `${cap.inputRequirements.minWindow} data points`,
      ...(cap.inputRequirements.seasonality ? ['Seasonal data'] : []),
      ...(cap.inputRequirements.multivariate ? ['Multiple variables'] : []),
    ],
    outputFormat: cap.explainabilityLevel === 'high' ? 'detailed' : 'summary',
  };
}
