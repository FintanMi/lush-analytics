/**
 * Signal Quality & Edge Case Detection
 * 
 * Edge cases are NOT errors - they are low-confidence signal regimes.
 * This module treats degenerate patterns as signals about data quality,
 * not bugs to be fixed.
 * 
 * IMPORTANT: All thresholds MUST be fetched from database tables:
 * - signal_quality_rules: Pattern detection thresholds
 * - threshold_config: Quality score thresholds
 */

export const SIGNAL_QUALITY = {
  /**
   * Confidence regimes based on signal quality
   */
  REGIMES: {
    HIGH: 'high',           // Normal, organic data
    MEDIUM: 'medium',       // Some irregularities, still usable
    LOW: 'low',             // Significant issues, reduced confidence
    DEGENERATE: 'degenerate', // Unusable for reliable analytics
  } as const,
};

/**
 * Degenerate behavior patterns (signals, not errors)
 * 
 * IMPORTANT: Detection thresholds are stored in signal_quality_rules table.
 * These constants are for type definitions only.
 */
export const DEGENERATE_PATTERNS = {
  /**
   * Pattern types
   */
  TYPES: {
    CONSTANT_ZERO: 'constant_zero',           // All or most values are zero
    PERFECT_PERIODICITY: 'perfect_periodicity', // Exact repeating pattern (bot)
    IMPOSSIBLE_REGULARITY: 'impossible_regularity', // Too regular for organic behavior
    BOT_SIGNATURE: 'bot_signature',           // Automated behavior patterns
    SYNTHETIC_DATA: 'synthetic_data',         // Artificially generated data
  } as const,
};

/**
 * Systemic anomalies (system health, not seller analytics)
 */
export const SYSTEMIC_ANOMALIES = {
  /**
   * Anomaly types
   */
  TYPES: {
    SCHEMA_CHANGE: 'schema_change',           // Database schema modified
    TIMESTAMP_DRIFT: 'timestamp_drift',       // Clock skew detected
    INGESTION_BURST: 'ingestion_burst',       // Sudden spike in events
    RATE_LIMIT_BREACH: 'rate_limit_breach',   // Rate limit exceeded
    CACHE_THRASHING: 'cache_thrashing',       // Cache invalidation storm
    COMPUTATION_TIMEOUT: 'computation_timeout', // Analytics computation failed
  } as const,

  /**
   * Severity levels
   */
  SEVERITY: {
    INFO: 'info',         // Informational, no action needed
    WARNING: 'warning',   // Potential issue, monitor
    CRITICAL: 'critical', // Immediate attention required
  } as const,

  /**
   * Impact on analytics
   */
  IMPACT: {
    schema_change: 'May affect data consistency. Review recent changes.',
    timestamp_drift: 'Time-based analytics may be inaccurate. Check system clocks.',
    ingestion_burst: 'Sudden traffic spike. May indicate bot attack or viral event.',
    rate_limit_breach: 'API limits exceeded. Some data may be dropped.',
    cache_thrashing: 'Performance degraded. Analytics may be delayed.',
    computation_timeout: 'Complex analytics failed. Reduce data window or complexity.',
  } as const,
};

/**
 * Encryption policies
 */
export const ENCRYPTION_POLICIES = {
  /**
   * Data encrypted at rest
   */
  AT_REST: {
    REQUIRED: [
      'events.value',
      'config_versions.config_data',
      'config_snapshots.*',
      'export_history.file_url',
      'api_usage.endpoint',
      'weekly_reports.report_data',
    ],
    ALGORITHM: 'AES-256-GCM',
    KEY_ROTATION: '90_days',
  } as const,

  /**
   * Data encrypted in transit
   */
  IN_TRANSIT: {
    REQUIRED: [
      'API traffic',
      'Widget embeds',
      'Webhooks',
      'Database connections',
      'Internal service communication',
    ],
    PROTOCOL: 'TLS 1.3',
    NO_EXCEPTIONS: true,
  } as const,

  /**
   * Secrets and keys
   */
  KEY_MATERIAL: {
    REQUIRED: [
      'sellers.api_key',
      'embed_keys.key_hash',
      'decision_hooks.webhook_secret',
    ],
    ALGORITHM: 'AES-256-GCM',
    KEY_ROTATION: '30_days',
    PROPERTIES: {
      rotatable: true,
      scoped: true,
      revocable: true,
    },
  } as const,

  /**
   * Data NOT encrypted (performance optimization)
   */
  NOT_ENCRYPTED: {
    ALLOWED: [
      'Derived analytics',
      'Aggregated metrics',
      'Anomaly scores',
      'Health scores',
      'Prediction results',
      'Public configuration',
    ],
    REASON: 'Already aggregated/derived, no sensitive data',
  } as const,
};

/**
 * Signal quality assessment functions
 * All thresholds MUST be fetched from signal_quality_rules table
 */
export const assessSignalQuality = {
  /**
   * Detect constant zero values
   * @param values - Array of numeric values
   * @param threshold - Detection threshold from signal_quality_rules
   */
  detectConstantZero(values: number[], threshold: number): { detected: boolean; ratio: number } {
    const zeroCount = values.filter(v => v === 0).length;
    const ratio = zeroCount / values.length;
    return {
      detected: ratio > threshold,
      ratio,
    };
  },

  /**
   * Detect perfect periodicity
   * @param values - Array of numeric values
   * @param threshold - Detection threshold from signal_quality_rules
   */
  detectPerfectPeriodicity(values: number[], threshold: number): { detected: boolean; confidence: number } {
    if (values.length < 4) return { detected: false, confidence: 0 };

    // Check for repeating patterns
    const diffs = values.slice(1).map((v, i) => v - values[i]);
    const uniqueDiffs = new Set(diffs);
    const confidence = 1 - (uniqueDiffs.size / diffs.length);

    return {
      detected: confidence > threshold,
      confidence,
    };
  },

  /**
   * Detect impossible regularity
   * @param values - Array of numeric values
   * @param threshold - Detection threshold from signal_quality_rules
   */
  detectImpossibleRegularity(values: number[], threshold: number): { detected: boolean; variance: number } {
    if (values.length < 2) return { detected: false, variance: 0 };

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const coefficientOfVariation = Math.sqrt(variance) / (mean || 1);

    return {
      detected: coefficientOfVariation < (1 - threshold),
      variance: coefficientOfVariation,
    };
  },

  /**
   * Detect bot signature (timestamp clustering)
   * @param timestamps - Array of timestamps
   * @param threshold - Detection threshold from signal_quality_rules
   */
  detectBotSignature(timestamps: number[], threshold: number): { detected: boolean; clusterRatio: number } {
    if (timestamps.length < 2) return { detected: false, clusterRatio: 0 };

    const sorted = [...timestamps].sort((a, b) => a - b);
    const diffs = sorted.slice(1).map((t, i) => t - sorted[i]);
    const clustered = diffs.filter(d => d < 1000).length; // <1 second apart
    const clusterRatio = clustered / diffs.length;

    return {
      detected: clusterRatio > threshold,
      clusterRatio,
    };
  },

  /**
   * Calculate overall signal quality score based on detected patterns
   * @param patterns - Detected pattern flags
   * @param rules - Signal quality rules from database with confidence_impact
   */
  calculateQualityScore(
    patterns: Record<string, boolean>,
    rules: { pattern_type: string; confidence_impact: string }[]
  ): number {
    let score = 1.0;

    const impactWeights: Record<string, number> = {
      severe: 0.5,
      moderate: 0.3,
      minor: 0.2,
      none: 0,
    };

    Object.entries(patterns).forEach(([patternType, detected]) => {
      if (detected) {
        const rule = rules.find(r => r.pattern_type === patternType);
        const impact = rule?.confidence_impact || 'moderate';
        score -= impactWeights[impact] || 0.3;
      }
    });

    return Math.max(0, score);
  },

  /**
   * Determine confidence regime based on quality score
   * @param qualityScore - Calculated quality score (0-1)
   * @param thresholds - Thresholds from threshold_config table
   */
  getConfidenceRegime(
    qualityScore: number,
    thresholds: { name: string; value: number }[]
  ): 'high' | 'medium' | 'low' | 'degenerate' {
    const highQuality = thresholds.find(t => t.name === 'quality_high')?.value ?? 0.8;
    const mediumQuality = thresholds.find(t => t.name === 'quality_medium')?.value ?? 0.5;
    const lowQuality = thresholds.find(t => t.name === 'quality_low')?.value ?? 0.3;

    if (qualityScore >= highQuality) return 'high';
    if (qualityScore >= mediumQuality) return 'medium';
    if (qualityScore >= lowQuality) return 'low';
    return 'degenerate';
  },

  /**
   * Get message for confidence regime
   */
  getRegimeMessage(regime: string): string {
    switch (regime) {
      case 'high':
        return 'High quality signal. Analytics are reliable.';
      case 'medium':
        return 'Moderate quality signal. Some irregularities detected.';
      case 'low':
        return 'Low quality signal. Significant issues detected. Use with caution.';
      case 'degenerate':
        return 'Degenerate signal. Data unsuitable for reliable analytics.';
      default:
        return 'Unknown signal quality.';
    }
  },
};

/**
 * Systemic anomaly detection
 */
export const detectSystemicAnomalies = {
  /**
   * Detect timestamp drift
   */
  detectTimestampDrift(serverTime: number, clientTime: number): { detected: boolean; drift: number } {
    const drift = Math.abs(serverTime - clientTime);
    return {
      detected: drift > 60000, // >1 minute drift
      drift,
    };
  },

  /**
   * Detect ingestion burst
   */
  detectIngestionBurst(currentRate: number, baselineRate: number): { detected: boolean; ratio: number } {
    const ratio = currentRate / baselineRate;
    return {
      detected: ratio > 10, // 10x normal rate
      ratio,
    };
  },

  /**
   * Detect cache thrashing
   */
  detectCacheThrashing(invalidationRate: number): { detected: boolean; rate: number } {
    return {
      detected: invalidationRate > 100, // >100 invalidations/minute
      rate: invalidationRate,
    };
  },
};
