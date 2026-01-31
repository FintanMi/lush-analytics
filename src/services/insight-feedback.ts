/**
 * User Confirmation / Dismissal Signals
 * Post-Insight Outcome Tracking
 * Insight Precision Score (internal)
 * 
 * This system enables:
 * - Tune thresholds per seller
 * - Reduce alert fatigue
 * - Surface which algorithms actually help
 */

export type InsightOutcome = 
  | 'confirmed'        // User confirmed insight was correct
  | 'dismissed'        // User dismissed as not relevant
  | 'false_positive'   // User marked as false positive
  | 'acted_upon'       // User took action based on insight
  | 'ignored'          // User saw but took no action
  | 'expired';         // Insight expired without user interaction

export type InsightType =
  | 'anomaly'
  | 'prediction'
  | 'health_risk'
  | 'fingerprint_drift'
  | 'quality_warning'
  | 'rate_limit'
  | 'optimization_suggestion'
  | 'attribution'
  | 'funnel_drop_off';

export interface InsightFeedback {
  insightId: string;
  insightType: InsightType;
  sellerId: string;
  userId: string;
  outcome: InsightOutcome;
  timestamp: number;
  timeToAction?: number;  // Milliseconds from insight shown to action
  confidence: number;     // Original insight confidence (0-1)
  metadata?: {
    algorithm?: string;
    threshold?: number;
    severity?: string;
    [key: string]: any;
  };
  userComment?: string;
}

export interface InsightPrecisionMetrics {
  insightType: InsightType;
  algorithm: string;
  totalInsights: number;
  confirmed: number;
  dismissed: number;
  falsePositives: number;
  actedUpon: number;
  ignored: number;
  expired: number;
  
  // Calculated metrics
  precisionScore: number;      // (confirmed + actedUpon) / (confirmed + actedUpon + falsePositives)
  actionRate: number;          // actedUpon / totalInsights
  dismissalRate: number;       // dismissed / totalInsights
  falsePositiveRate: number;   // falsePositives / totalInsights
  avgTimeToAction?: number;    // Average milliseconds to action
  
  // Per-seller metrics
  sellerMetrics?: Map<string, SellerInsightMetrics>;
}

export interface SellerInsightMetrics {
  sellerId: string;
  totalInsights: number;
  confirmed: number;
  dismissed: number;
  falsePositives: number;
  precisionScore: number;
  
  // Adaptive thresholds
  recommendedThreshold?: number;
  confidenceAdjustment?: number;  // Multiplier to apply to confidence scores
}

export interface ThresholdTuning {
  insightType: InsightType;
  algorithm: string;
  sellerId?: string;  // If null, applies globally
  originalThreshold: number;
  tunedThreshold: number;
  confidenceMultiplier: number;
  basedOnSamples: number;
  lastUpdated: number;
}

/**
 * In-memory store for insight feedback (should be persisted to database)
 */
class InsightFeedbackStore {
  private feedbacks: Map<string, InsightFeedback> = new Map();
  private precisionMetrics: Map<string, InsightPrecisionMetrics> = new Map();
  private thresholdTunings: Map<string, ThresholdTuning> = new Map();
  
  /**
   * Record user feedback on an insight
   */
  recordFeedback(feedback: InsightFeedback): void {
    this.feedbacks.set(feedback.insightId, feedback);
    this.updatePrecisionMetrics(feedback);
    this.updateThresholdTuning(feedback);
  }
  
  /**
   * Get feedback for a specific insight
   */
  getFeedback(insightId: string): InsightFeedback | undefined {
    return this.feedbacks.get(insightId);
  }
  
  /**
   * Get all feedbacks for a seller
   */
  getSellerFeedbacks(sellerId: string): InsightFeedback[] {
    return Array.from(this.feedbacks.values()).filter(
      f => f.sellerId === sellerId
    );
  }
  
  /**
   * Get precision metrics for an insight type and algorithm
   */
  getPrecisionMetrics(insightType: InsightType, algorithm: string): InsightPrecisionMetrics | undefined {
    const key = `${insightType}:${algorithm}`;
    return this.precisionMetrics.get(key);
  }
  
  /**
   * Get all precision metrics
   */
  getAllPrecisionMetrics(): InsightPrecisionMetrics[] {
    return Array.from(this.precisionMetrics.values());
  }
  
  /**
   * Get tuned threshold for a specific context
   */
  getTunedThreshold(
    insightType: InsightType,
    algorithm: string,
    sellerId?: string
  ): ThresholdTuning | undefined {
    // Try seller-specific first
    if (sellerId) {
      const sellerKey = `${insightType}:${algorithm}:${sellerId}`;
      const sellerTuning = this.thresholdTunings.get(sellerKey);
      if (sellerTuning) return sellerTuning;
    }
    
    // Fall back to global
    const globalKey = `${insightType}:${algorithm}:global`;
    return this.thresholdTunings.get(globalKey);
  }
  
  /**
   * Update precision metrics based on new feedback
   */
  private updatePrecisionMetrics(feedback: InsightFeedback): void {
    const algorithm = feedback.metadata?.algorithm || 'unknown';
    const key = `${feedback.insightType}:${algorithm}`;
    
    let metrics = this.precisionMetrics.get(key);
    if (!metrics) {
      metrics = {
        insightType: feedback.insightType,
        algorithm,
        totalInsights: 0,
        confirmed: 0,
        dismissed: 0,
        falsePositives: 0,
        actedUpon: 0,
        ignored: 0,
        expired: 0,
        precisionScore: 0,
        actionRate: 0,
        dismissalRate: 0,
        falsePositiveRate: 0,
        sellerMetrics: new Map(),
      };
    }
    
    // Update counts
    metrics.totalInsights++;
    switch (feedback.outcome) {
      case 'confirmed':
        metrics.confirmed++;
        break;
      case 'dismissed':
        metrics.dismissed++;
        break;
      case 'false_positive':
        metrics.falsePositives++;
        break;
      case 'acted_upon':
        metrics.actedUpon++;
        break;
      case 'ignored':
        metrics.ignored++;
        break;
      case 'expired':
        metrics.expired++;
        break;
    }
    
    // Recalculate metrics
    const positives = metrics.confirmed + metrics.actedUpon;
    const negatives = metrics.falsePositives;
    metrics.precisionScore = positives / (positives + negatives) || 0;
    metrics.actionRate = metrics.actedUpon / metrics.totalInsights;
    metrics.dismissalRate = metrics.dismissed / metrics.totalInsights;
    metrics.falsePositiveRate = metrics.falsePositives / metrics.totalInsights;
    
    // Update time to action
    if (feedback.timeToAction) {
      const currentAvg = metrics.avgTimeToAction || 0;
      const count = metrics.actedUpon;
      metrics.avgTimeToAction = (currentAvg * (count - 1) + feedback.timeToAction) / count;
    }
    
    // Update seller-specific metrics
    this.updateSellerMetrics(metrics, feedback);
    
    this.precisionMetrics.set(key, metrics);
  }
  
  /**
   * Update seller-specific metrics
   */
  private updateSellerMetrics(
    metrics: InsightPrecisionMetrics,
    feedback: InsightFeedback
  ): void {
    if (!metrics.sellerMetrics) {
      metrics.sellerMetrics = new Map();
    }
    
    let sellerMetrics = metrics.sellerMetrics.get(feedback.sellerId);
    if (!sellerMetrics) {
      sellerMetrics = {
        sellerId: feedback.sellerId,
        totalInsights: 0,
        confirmed: 0,
        dismissed: 0,
        falsePositives: 0,
        precisionScore: 0,
      };
    }
    
    sellerMetrics.totalInsights++;
    switch (feedback.outcome) {
      case 'confirmed':
      case 'acted_upon':
        sellerMetrics.confirmed++;
        break;
      case 'dismissed':
        sellerMetrics.dismissed++;
        break;
      case 'false_positive':
        sellerMetrics.falsePositives++;
        break;
    }
    
    // Recalculate seller precision
    const positives = sellerMetrics.confirmed;
    const negatives = sellerMetrics.falsePositives;
    sellerMetrics.precisionScore = positives / (positives + negatives) || 0;
    
    metrics.sellerMetrics.set(feedback.sellerId, sellerMetrics);
  }
  
  /**
   * Update threshold tuning based on feedback
   */
  private updateThresholdTuning(feedback: InsightFeedback): void {
    const algorithm = feedback.metadata?.algorithm || 'unknown';
    const originalThreshold = feedback.metadata?.threshold;
    
    if (!originalThreshold) return;
    
    // Update seller-specific tuning
    const sellerKey = `${feedback.insightType}:${algorithm}:${feedback.sellerId}`;
    this.updateThresholdForKey(sellerKey, feedback, originalThreshold, feedback.sellerId);
    
    // Update global tuning
    const globalKey = `${feedback.insightType}:${algorithm}:global`;
    this.updateThresholdForKey(globalKey, feedback, originalThreshold);
  }
  
  /**
   * Update threshold for a specific key
   */
  private updateThresholdForKey(
    key: string,
    feedback: InsightFeedback,
    originalThreshold: number,
    sellerId?: string
  ): void {
    let tuning = this.thresholdTunings.get(key);
    if (!tuning) {
      tuning = {
        insightType: feedback.insightType,
        algorithm: feedback.metadata?.algorithm || 'unknown',
        sellerId,
        originalThreshold,
        tunedThreshold: originalThreshold,
        confidenceMultiplier: 1.0,
        basedOnSamples: 0,
        lastUpdated: Date.now(),
      };
    }
    
    tuning.basedOnSamples++;
    
    // Adjust threshold based on feedback
    // If false positive, increase threshold (make it harder to trigger)
    // If confirmed/acted upon, slightly decrease threshold (make it easier to trigger)
    const learningRate = 0.05;
    
    switch (feedback.outcome) {
      case 'false_positive':
        tuning.tunedThreshold *= (1 + learningRate);
        tuning.confidenceMultiplier *= (1 - learningRate);
        break;
      case 'confirmed':
      case 'acted_upon':
        tuning.tunedThreshold *= (1 - learningRate * 0.5);
        tuning.confidenceMultiplier *= (1 + learningRate * 0.5);
        break;
      case 'dismissed':
        // Slight increase in threshold
        tuning.tunedThreshold *= (1 + learningRate * 0.3);
        break;
    }
    
    // Clamp values to reasonable ranges
    tuning.tunedThreshold = Math.max(
      originalThreshold * 0.5,
      Math.min(originalThreshold * 2.0, tuning.tunedThreshold)
    );
    tuning.confidenceMultiplier = Math.max(0.5, Math.min(1.5, tuning.confidenceMultiplier));
    
    tuning.lastUpdated = Date.now();
    this.thresholdTunings.set(key, tuning);
  }
  
  /**
   * Get insights with low precision scores (need attention)
   */
  getLowPrecisionInsights(threshold: number = 0.5): InsightPrecisionMetrics[] {
    return Array.from(this.precisionMetrics.values()).filter(
      m => m.precisionScore < threshold && m.totalInsights >= 10
    );
  }
  
  /**
   * Get insights with high false positive rates
   */
  getHighFalsePositiveInsights(threshold: number = 0.3): InsightPrecisionMetrics[] {
    return Array.from(this.precisionMetrics.values()).filter(
      m => m.falsePositiveRate > threshold && m.totalInsights >= 10
    );
  }
  
  /**
   * Get insights with high action rates (most useful)
   */
  getHighActionRateInsights(threshold: number = 0.5): InsightPrecisionMetrics[] {
    return Array.from(this.precisionMetrics.values()).filter(
      m => m.actionRate > threshold && m.totalInsights >= 10
    );
  }
  
  /**
   * Export metrics for analysis
   */
  exportMetrics(): {
    feedbacks: InsightFeedback[];
    precisionMetrics: InsightPrecisionMetrics[];
    thresholdTunings: ThresholdTuning[];
  } {
    return {
      feedbacks: Array.from(this.feedbacks.values()),
      precisionMetrics: Array.from(this.precisionMetrics.values()),
      thresholdTunings: Array.from(this.thresholdTunings.values()),
    };
  }
  
  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.feedbacks.clear();
    this.precisionMetrics.clear();
    this.thresholdTunings.clear();
  }
}

// Singleton instance
export const insightFeedbackStore = new InsightFeedbackStore();

/**
 * Helper functions for UI integration
 */

export function recordInsightConfirmation(
  insightId: string,
  insightType: InsightType,
  sellerId: string,
  userId: string,
  metadata?: Record<string, any>
): void {
  insightFeedbackStore.recordFeedback({
    insightId,
    insightType,
    sellerId,
    userId,
    outcome: 'confirmed',
    timestamp: Date.now(),
    confidence: metadata?.confidence || 0,
    metadata,
  });
}

export function recordInsightDismissal(
  insightId: string,
  insightType: InsightType,
  sellerId: string,
  userId: string,
  reason?: string,
  metadata?: Record<string, any>
): void {
  insightFeedbackStore.recordFeedback({
    insightId,
    insightType,
    sellerId,
    userId,
    outcome: 'dismissed',
    timestamp: Date.now(),
    confidence: metadata?.confidence || 0,
    metadata,
    userComment: reason,
  });
}

export function recordInsightAction(
  insightId: string,
  insightType: InsightType,
  sellerId: string,
  userId: string,
  timeToAction: number,
  metadata?: Record<string, any>
): void {
  insightFeedbackStore.recordFeedback({
    insightId,
    insightType,
    sellerId,
    userId,
    outcome: 'acted_upon',
    timestamp: Date.now(),
    timeToAction,
    confidence: metadata?.confidence || 0,
    metadata,
  });
}

export function recordFalsePositive(
  insightId: string,
  insightType: InsightType,
  sellerId: string,
  userId: string,
  reason?: string,
  metadata?: Record<string, any>
): void {
  insightFeedbackStore.recordFeedback({
    insightId,
    insightType,
    sellerId,
    userId,
    outcome: 'false_positive',
    timestamp: Date.now(),
    confidence: metadata?.confidence || 0,
    metadata,
    userComment: reason,
  });
}

/**
 * Get adjusted confidence score for an insight based on historical performance
 */
export function getAdjustedConfidence(
  insightType: InsightType,
  algorithm: string,
  originalConfidence: number,
  sellerId?: string
): number {
  const tuning = insightFeedbackStore.getTunedThreshold(insightType, algorithm, sellerId);
  if (!tuning) return originalConfidence;
  
  return Math.max(0, Math.min(1, originalConfidence * tuning.confidenceMultiplier));
}

/**
 * Check if insight should be shown based on tuned thresholds
 */
export function shouldShowInsight(
  insightType: InsightType,
  algorithm: string,
  score: number,
  originalThreshold: number,
  sellerId?: string
): boolean {
  const tuning = insightFeedbackStore.getTunedThreshold(insightType, algorithm, sellerId);
  const threshold = tuning?.tunedThreshold || originalThreshold;
  
  return score >= threshold;
}

/**
 * Generate insight quality report
 */
export function generateInsightQualityReport(): {
  summary: {
    totalInsightTypes: number;
    avgPrecisionScore: number;
    avgActionRate: number;
    avgFalsePositiveRate: number;
  };
  topPerformers: InsightPrecisionMetrics[];
  needsImprovement: InsightPrecisionMetrics[];
  recommendations: string[];
} {
  const allMetrics = insightFeedbackStore.getAllPrecisionMetrics();
  
  const summary = {
    totalInsightTypes: allMetrics.length,
    avgPrecisionScore: allMetrics.reduce((sum, m) => sum + m.precisionScore, 0) / allMetrics.length || 0,
    avgActionRate: allMetrics.reduce((sum, m) => sum + m.actionRate, 0) / allMetrics.length || 0,
    avgFalsePositiveRate: allMetrics.reduce((sum, m) => sum + m.falsePositiveRate, 0) / allMetrics.length || 0,
  };
  
  const topPerformers = insightFeedbackStore.getHighActionRateInsights(0.4)
    .sort((a, b) => b.actionRate - a.actionRate)
    .slice(0, 5);
  
  const needsImprovement = insightFeedbackStore.getLowPrecisionInsights(0.6)
    .sort((a, b) => a.precisionScore - b.precisionScore)
    .slice(0, 5);
  
  const recommendations: string[] = [];
  
  if (summary.avgFalsePositiveRate > 0.3) {
    recommendations.push('High false positive rate detected. Consider increasing thresholds globally.');
  }
  
  if (summary.avgActionRate < 0.2) {
    recommendations.push('Low action rate suggests insights may not be actionable. Review insight relevance.');
  }
  
  needsImprovement.forEach(metric => {
    recommendations.push(
      `${metric.insightType} (${metric.algorithm}) has low precision (${(metric.precisionScore * 100).toFixed(1)}%). Consider tuning or disabling.`
    );
  });
  
  return {
    summary,
    topPerformers,
    needsImprovement,
    recommendations,
  };
}
