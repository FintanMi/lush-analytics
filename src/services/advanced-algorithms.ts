/**
 * Advanced Time-Series Analysis Service
 * 
 * Implements sophisticated algorithms for pattern detection, anomaly identification,
 * and signal quality assessment.
 */

import {
  MatrixProfileResult,
  BayesianChangePoint,
  SeasonalHybridESDResult,
  CopulaDependencyDrift,
  DTWDistanceToBaseline,
  SignalToNoiseRatio,
  EffectiveSampleSize,
  WindowStabilityScore,
  TemporalCoverage,
  EntropyDrift,
} from '@/types/analytics';
import { ADVANCED_ALGORITHMS_CONFIG } from '@/config/advanced-algorithms';

/**
 * Matrix Profile Implementation (Simplified)
 * Detects motifs (repeating patterns) and discords (anomalies)
 */
export function computeMatrixProfile(
  data: number[],
  sellerId: string,
  metricType: string
): MatrixProfileResult {
  const { windowSize, minMotifSimilarity, discordThreshold } = ADVANCED_ALGORITHMS_CONFIG.matrixProfile;
  
  if (data.length < windowSize * 2) {
    return {
      seller_id: sellerId,
      metric_type: metricType,
      motifs: [],
      discords: [],
      computed_at: Date.now(),
    };
  }

  const motifs: MatrixProfileResult['motifs'] = [];
  const discords: MatrixProfileResult['discords'] = [];

  // Simplified sliding window comparison
  for (let i = 0; i < data.length - windowSize; i++) {
    const window1 = data.slice(i, i + windowSize);
    let minDistance = Number.POSITIVE_INFINITY;
    let maxDistance = 0;

    for (let j = i + windowSize; j < data.length - windowSize; j++) {
      const window2 = data.slice(j, j + windowSize);
      const distance = euclideanDistance(window1, window2);
      
      minDistance = Math.min(minDistance, distance);
      maxDistance = Math.max(maxDistance, distance);

      // Detect motifs (similar patterns)
      if (distance < (1 - minMotifSimilarity) * windowSize) {
        motifs.push({
          start_index: i,
          end_index: i + windowSize,
          similarity_score: 1 - distance / windowSize,
        });
      }
    }

    // Detect discords (anomalies)
    if (minDistance > discordThreshold * windowSize) {
      discords.push({
        index: i,
        discord_score: minDistance / windowSize,
        is_anomaly: true,
      });
    }
  }

  return {
    seller_id: sellerId,
    metric_type: metricType,
    motifs: motifs.slice(0, 10), // Top 10 motifs
    discords: discords.slice(0, 10), // Top 10 discords
    computed_at: Date.now(),
  };
}

/**
 * Bayesian Online Change Point Detection
 * Detects regime shifts in time series data
 */
export function detectChangePoints(
  data: number[],
  sellerId: string,
  metricType: string
): BayesianChangePoint {
  const { hazardRate, changePointThreshold } = ADVANCED_ALGORITHMS_CONFIG.bocpd;
  
  const changePoints: BayesianChangePoint['change_points'] = [];
  let currentRegime = 'stable';
  
  // Simplified change point detection using variance shifts
  const windowSize = 20;
  for (let i = windowSize; i < data.length - windowSize; i++) {
    const before = data.slice(i - windowSize, i);
    const after = data.slice(i, i + windowSize);
    
    const varBefore = variance(before);
    const varAfter = variance(after);
    const meanBefore = mean(before);
    const meanAfter = mean(after);
    
    const varianceRatio = Math.abs(varAfter - varBefore) / (varBefore + 1e-10);
    const meanShift = Math.abs(meanAfter - meanBefore) / (Math.abs(meanBefore) + 1e-10);
    
    const probability = Math.min(1, (varianceRatio + meanShift) / 2);
    
    if (probability > changePointThreshold) {
      const regimeBefore = varBefore < varAfter ? 'stable' : 'volatile';
      const regimeAfter = varAfter > varBefore ? 'volatile' : 'stable';
      
      changePoints.push({
        timestamp: i,
        probability,
        regime_before: regimeBefore,
        regime_after: regimeAfter,
      });
      
      currentRegime = regimeAfter;
    }
  }

  return {
    seller_id: sellerId,
    metric_type: metricType,
    change_points: changePoints,
    current_regime: currentRegime,
    confidence: changePoints.length > 0 ? changePoints[changePoints.length - 1].probability : 0.5,
  };
}

/**
 * Seasonal Hybrid ESD (Extreme Studentized Deviate)
 * Robust anomaly detection with seasonality handling
 */
export function detectSeasonalAnomalies(
  data: number[],
  timestamps: number[],
  sellerId: string,
  metricType: string
): SeasonalHybridESDResult {
  const { maxAnomalies, hybridThreshold, minSeasonalStrength } = ADVANCED_ALGORITHMS_CONFIG.seasonalHybridESD;
  
  // Detect seasonality
  const seasonality = detectSeasonality(data);
  const seasonalityDetected = seasonality.strength > minSeasonalStrength;
  
  // Deseasonalize if needed
  const deseasonalized = seasonalityDetected ? removeSeasonality(data, seasonality.period) : data;
  
  // Detect anomalies using ESD
  const anomalies: SeasonalHybridESDResult['anomalies'] = [];
  const dataMean = mean(deseasonalized);
  const dataStd = standardDeviation(deseasonalized);
  
  for (let i = 0; i < deseasonalized.length && anomalies.length < maxAnomalies; i++) {
    const zScore = Math.abs((deseasonalized[i] - dataMean) / (dataStd + 1e-10));
    
    if (zScore > hybridThreshold) {
      anomalies.push({
        timestamp: timestamps[i],
        value: data[i],
        expected_value: dataMean,
        deviation: zScore,
      });
    }
  }

  return {
    seller_id: sellerId,
    metric_type: metricType,
    anomalies,
    seasonality_detected: seasonalityDetected,
    period: seasonalityDetected ? seasonality.period : null,
  };
}

/**
 * Copula-Based Dependency Drift Detection
 * Detects when relationships between metrics break down
 */
export function detectDependencyDrift(
  metric1: number[],
  metric2: number[],
  sellerId: string,
  metricPair: [string, string]
): CopulaDependencyDrift {
  const { dependencyThreshold, driftThreshold, windowSize } = ADVANCED_ALGORITHMS_CONFIG.copula;
  
  // Calculate baseline dependency (correlation)
  const baselineDep = correlation(
    metric1.slice(0, Math.min(windowSize, metric1.length)),
    metric2.slice(0, Math.min(windowSize, metric2.length))
  );
  
  // Calculate current dependency
  const currentDep = correlation(
    metric1.slice(-windowSize),
    metric2.slice(-windowSize)
  );
  
  const driftMagnitude = Math.abs(currentDep - baselineDep);
  const relationshipBroken = driftMagnitude > driftThreshold;

  return {
    seller_id: sellerId,
    metric_pair: metricPair,
    baseline_dependency: baselineDep,
    current_dependency: currentDep,
    drift_magnitude: driftMagnitude,
    relationship_broken: relationshipBroken,
  };
}

/**
 * Dynamic Time Warping Distance to Baseline
 * Compares current behavior signature to normal baseline
 */
export function computeDTWDistance(
  current: number[],
  baseline: number[],
  sellerId: string,
  metricType: string
): DTWDistanceToBaseline {
  const { similarityThreshold } = ADVANCED_ALGORITHMS_CONFIG.dtw;
  
  // Normalize signatures
  const currentNorm = normalize(current);
  const baselineNorm = normalize(baseline);
  
  // Simplified DTW distance calculation
  const distance = dtwDistance(currentNorm, baselineNorm);
  const maxDistance = Math.max(currentNorm.length, baselineNorm.length);
  const similarityScore = 1 - Math.min(1, distance / maxDistance);

  return {
    seller_id: sellerId,
    metric_type: metricType,
    dtw_distance: distance,
    baseline_signature: baselineNorm,
    current_signature: currentNorm,
    similarity_score: similarityScore,
  };
}

/**
 * Signal-to-Noise Ratio Calculation
 */
export function calculateSNR(
  data: number[],
  sellerId: string,
  metricType: string,
  windowStart: number,
  windowEnd: number
): SignalToNoiseRatio {
  const dataMean = mean(data);
  const dataVar = variance(data);
  
  // Estimate signal power (variance of smoothed data)
  const smoothed = movingAverage(data, 5);
  const signalPower = variance(smoothed);
  
  // Estimate noise power (variance of residuals)
  const residuals = data.map((val, i) => val - smoothed[i]);
  const noisePower = variance(residuals);
  
  // Calculate SNR in dB
  const snr = 10 * Math.log10((signalPower + 1e-10) / (noisePower + 1e-10));
  
  const { optimal, adequate, minimal } = ADVANCED_ALGORITHMS_CONFIG.snr;
  let confidenceImpact: SignalToNoiseRatio['confidence_impact'] = 'none';
  if (snr < minimal) confidenceImpact = 'severe';
  else if (snr < adequate) confidenceImpact = 'moderate';
  else if (snr < optimal) confidenceImpact = 'minor';

  return {
    metric_type: metricType,
    seller_id: sellerId,
    window_start: windowStart,
    window_end: windowEnd,
    snr,
    signal_power: signalPower,
    noise_power: noisePower,
    confidence_impact: confidenceImpact,
  };
}

/**
 * Effective Sample Size Calculation
 * Adjusts raw count by autocorrelation
 */
export function calculateEffectiveSampleSize(
  data: number[],
  sellerId: string,
  metricType: string
): EffectiveSampleSize {
  const { autocorrelationLag } = ADVANCED_ALGORITHMS_CONFIG.ess;
  
  const rawCount = data.length;
  const autocorr = autocorrelation(data, autocorrelationLag);
  
  // Kish's effective sample size formula
  const adjustmentFactor = 1 / (1 + 2 * autocorr);
  const effectiveCount = Math.floor(rawCount * adjustmentFactor);

  return {
    metric_type: metricType,
    seller_id: sellerId,
    raw_count: rawCount,
    effective_count: effectiveCount,
    autocorrelation: autocorr,
    adjustment_factor: adjustmentFactor,
  };
}

/**
 * Window Stability Score
 * Measures how much the rolling window content changes
 */
export function calculateWindowStability(
  data: number[],
  sellerId: string,
  metricType: string
): WindowStabilityScore {
  const { rollingWindowSize } = ADVANCED_ALGORITHMS_CONFIG.windowStability;
  
  let totalChange = 0;
  let changeCount = 0;
  
  for (let i = rollingWindowSize; i < data.length; i++) {
    const oldWindow = data.slice(i - rollingWindowSize, i);
    const newWindow = data.slice(i - rollingWindowSize + 1, i + 1);
    
    const oldMean = mean(oldWindow);
    const newMean = mean(newWindow);
    
    const change = Math.abs(newMean - oldMean) / (Math.abs(oldMean) + 1e-10);
    totalChange += change;
    changeCount++;
  }
  
  const contentChangeRate = changeCount > 0 ? totalChange / changeCount : 0;
  const rollingVar = variance(data.slice(-rollingWindowSize));
  const stabilityScore = 1 / (1 + contentChangeRate);

  return {
    seller_id: sellerId,
    metric_type: metricType,
    stability_score: stabilityScore,
    content_change_rate: contentChangeRate,
    rolling_variance: rollingVar,
    window_size: rollingWindowSize,
  };
}

/**
 * Temporal Coverage Analysis
 * Measures % of expected time buckets populated
 */
export function analyzeTemporalCoverage(
  timestamps: number[],
  sellerId: string,
  metricType: string
): TemporalCoverage {
  const { expectedBucketSize, maxGapSize } = ADVANCED_ALGORITHMS_CONFIG.temporalCoverage;
  
  if (timestamps.length === 0) {
    return {
      seller_id: sellerId,
      metric_type: metricType,
      expected_buckets: 0,
      populated_buckets: 0,
      coverage_percentage: 0,
      gaps: [],
    };
  }
  
  const sortedTimestamps = [...timestamps].sort((a, b) => a - b);
  const minTime = sortedTimestamps[0];
  const maxTime = sortedTimestamps[sortedTimestamps.length - 1];
  const timeRange = maxTime - minTime;
  
  const expectedBuckets = Math.ceil(timeRange / expectedBucketSize);
  const buckets = new Set<number>();
  
  for (const ts of sortedTimestamps) {
    const bucket = Math.floor((ts - minTime) / expectedBucketSize);
    buckets.add(bucket);
  }
  
  const populatedBuckets = buckets.size;
  const coveragePercentage = (populatedBuckets / expectedBuckets) * 100;
  
  // Detect gaps
  const gaps: TemporalCoverage['gaps'] = [];
  for (let i = 1; i < sortedTimestamps.length; i++) {
    const gap = sortedTimestamps[i] - sortedTimestamps[i - 1];
    if (gap > maxGapSize) {
      gaps.push({
        start: sortedTimestamps[i - 1],
        end: sortedTimestamps[i],
      });
    }
  }

  return {
    seller_id: sellerId,
    metric_type: metricType,
    expected_buckets: expectedBuckets,
    populated_buckets: populatedBuckets,
    coverage_percentage: coveragePercentage,
    gaps,
  };
}

/**
 * Entropy Drift Detection
 * Measures change in timing/value entropy vs baseline
 */
export function calculateEntropyDrift(
  data: number[],
  timestamps: number[],
  sellerId: string,
  metricType: string
): EntropyDrift {
  const { baselineWindowSize, currentWindowSize, driftThreshold, timingBins, valueBins } = 
    ADVANCED_ALGORITHMS_CONFIG.entropyDrift;
  
  // Calculate baseline entropy
  const baselineData = data.slice(0, Math.min(baselineWindowSize, data.length));
  const baselineTimestamps = timestamps.slice(0, Math.min(baselineWindowSize, timestamps.length));
  const baselineEntropy = calculateEntropy(baselineData, valueBins);
  
  // Calculate current entropy
  const currentData = data.slice(-currentWindowSize);
  const currentTimestamps = timestamps.slice(-currentWindowSize);
  const currentEntropy = calculateEntropy(currentData, valueBins);
  
  // Calculate timing entropy
  const timingEntropy = calculateTimingEntropy(currentTimestamps, timingBins);
  
  // Calculate value entropy
  const valueEntropy = currentEntropy;
  
  const driftMagnitude = Math.abs(currentEntropy - baselineEntropy);
  let driftDirection: EntropyDrift['drift_direction'] = 'stable';
  if (driftMagnitude > driftThreshold) {
    driftDirection = currentEntropy > baselineEntropy ? 'increasing' : 'decreasing';
  }

  return {
    seller_id: sellerId,
    metric_type: metricType,
    current_entropy: currentEntropy,
    baseline_entropy: baselineEntropy,
    drift_magnitude: driftMagnitude,
    drift_direction: driftDirection,
    timing_entropy: timingEntropy,
    value_entropy: valueEntropy,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) return Number.POSITIVE_INFINITY;
  return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
}

function mean(data: number[]): number {
  return data.length > 0 ? data.reduce((sum, val) => sum + val, 0) / data.length : 0;
}

function variance(data: number[]): number {
  const m = mean(data);
  return data.length > 0 ? data.reduce((sum, val) => sum + Math.pow(val - m, 2), 0) / data.length : 0;
}

function standardDeviation(data: number[]): number {
  return Math.sqrt(variance(data));
}

function correlation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;
  
  const meanX = mean(x);
  const meanY = mean(y);
  const stdX = standardDeviation(x);
  const stdY = standardDeviation(y);
  
  if (stdX === 0 || stdY === 0) return 0;
  
  let sum = 0;
  for (let i = 0; i < x.length; i++) {
    sum += ((x[i] - meanX) / stdX) * ((y[i] - meanY) / stdY);
  }
  
  return sum / x.length;
}

function autocorrelation(data: number[], lag: number): number {
  if (data.length <= lag) return 0;
  
  const x = data.slice(0, -lag);
  const y = data.slice(lag);
  
  return correlation(x, y);
}

function normalize(data: number[]): number[] {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  
  if (range === 0) return data.map(() => 0);
  
  return data.map(val => (val - min) / range);
}

function movingAverage(data: number[], windowSize: number): number[] {
  const result: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(data.length, i + Math.ceil(windowSize / 2));
    const window = data.slice(start, end);
    result.push(mean(window));
  }
  
  return result;
}

function dtwDistance(a: number[], b: number[]): number {
  const n = a.length;
  const m = b.length;
  const dtw: number[][] = Array(n + 1).fill(0).map(() => Array(m + 1).fill(Number.POSITIVE_INFINITY));
  
  dtw[0][0] = 0;
  
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = Math.abs(a[i - 1] - b[j - 1]);
      dtw[i][j] = cost + Math.min(dtw[i - 1][j], dtw[i][j - 1], dtw[i - 1][j - 1]);
    }
  }
  
  return dtw[n][m];
}

function detectSeasonality(data: number[]): { strength: number; period: number } {
  // Simplified autocorrelation-based seasonality detection
  const maxPeriod = Math.min(100, Math.floor(data.length / 2));
  let maxCorr = 0;
  let bestPeriod = 1;
  
  for (let period = 2; period < maxPeriod; period++) {
    const corr = Math.abs(autocorrelation(data, period));
    if (corr > maxCorr) {
      maxCorr = corr;
      bestPeriod = period;
    }
  }
  
  return { strength: maxCorr, period: bestPeriod };
}

function removeSeasonality(data: number[], period: number): number[] {
  const result: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const seasonalIndices: number[] = [];
    for (let j = i % period; j < data.length; j += period) {
      seasonalIndices.push(data[j]);
    }
    const seasonalMean = mean(seasonalIndices);
    result.push(data[i] - seasonalMean);
  }
  
  return result;
}

function calculateEntropy(data: number[], bins: number): number {
  if (data.length === 0) return 0;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  
  if (range === 0) return 0;
  
  const binCounts = new Array(bins).fill(0);
  
  for (const val of data) {
    const binIndex = Math.min(bins - 1, Math.floor(((val - min) / range) * bins));
    binCounts[binIndex]++;
  }
  
  let entropy = 0;
  for (const count of binCounts) {
    if (count > 0) {
      const p = count / data.length;
      entropy -= p * Math.log2(p);
    }
  }
  
  return entropy;
}

function calculateTimingEntropy(timestamps: number[], bins: number): number {
  if (timestamps.length === 0) return 0;
  
  // Convert timestamps to hour of day
  const hours = timestamps.map(ts => new Date(ts).getHours());
  
  return calculateEntropy(hours, bins);
}
