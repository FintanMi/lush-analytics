/**
 * Query Execution Model - Type Definitions
 * 
 * This module defines a typed analytics query DSL that transforms
 * the system from "API service" → "analytics engine"
 * 
 * Inspired by distributed query engines like Siren Federate
 */

// ============================================================================
// Query Plan DSL - Core Abstractions
// ============================================================================

/**
 * Base node type for query execution DAG
 * All nodes in the query plan extend this
 */
export type QueryNodeType = 
  | 'SOURCE'
  | 'TRANSFORM'
  | 'AGGREGATE'
  | 'SCORE'
  | 'OUTPUT'
  | 'FILTER'
  | 'JOIN';

/**
 * Base interface for all query plan nodes
 * Uses generics for type-safe node configuration
 */
export interface QueryNode<TConfig = unknown> {
  id: string;
  type: QueryNodeType;
  config: TConfig;
  dependencies: string[]; // IDs of nodes this depends on
  metadata?: {
    estimatedCost?: number;
    estimatedLatencyMs?: number;
    cacheable?: boolean;
  };
}

// ============================================================================
// Source Nodes - Data Ingestion
// ============================================================================

export type DataSourceType = 
  | 'RING_BUFFER'
  | 'AGGREGATE_STORE'
  | 'HISTORICAL_COLD_STORE'
  | 'EXTERNAL_WEBHOOK'
  | 'CACHED_METRICS'
  | 'REAL_TIME_STREAM';

export interface SourceNodeConfig {
  sourceType: DataSourceType;
  sellerId: string;
  metricType?: 'SALE' | 'CLICK' | 'VIEW' | 'CHECKOUT_STARTED' | 'PAYMENT_SUCCEEDED';
  timeWindow: {
    start: number;
    end: number;
  };
  sampling?: {
    enabled: boolean;
    rate: number; // 0.0 to 1.0
    strategy: 'uniform' | 'adaptive' | 'stratified';
  };
}

export type SourceNode = QueryNode<SourceNodeConfig>;

// ============================================================================
// Transform Nodes - DSP Operations
// ============================================================================

export type TransformOperator = 
  | 'FIR'        // Finite Impulse Response filter
  | 'FFT'        // Fast Fourier Transform
  | 'HFD'        // Higuchi Fractal Dimension
  | 'WAVELET'    // Wavelet transform
  | 'KALMAN'     // Kalman filter
  | 'NORMALIZE'  // Data normalization
  | 'DETREND'    // Trend removal
  | 'RESAMPLE';  // Time series resampling

export interface TransformNodeConfig {
  operator: TransformOperator;
  parameters: Record<string, unknown>;
  // Optimization hints
  reducedMode?: boolean; // Use reduced FFT/HFD for cost savings
  parallelizable?: boolean;
  deterministic: boolean; // Enforce deterministic execution
}

export type TransformNode = QueryNode<TransformNodeConfig>;

// ============================================================================
// Aggregate Nodes - Data Reduction
// ============================================================================

export type AggregateFunction = 
  | 'SUM'
  | 'AVG'
  | 'MIN'
  | 'MAX'
  | 'COUNT'
  | 'STDDEV'
  | 'PERCENTILE'
  | 'MEDIAN'
  | 'MODE';

export interface AggregateNodeConfig {
  function: AggregateFunction;
  groupBy?: string[];
  window?: {
    type: 'sliding' | 'tumbling' | 'session';
    size: number;
    unit: 'seconds' | 'minutes' | 'hours' | 'days';
  };
  // Merge semantics for distributed execution
  mergeStrategy: 'associative' | 'commutative' | 'custom';
}

export type AggregateNode = QueryNode<AggregateNodeConfig>;

// ============================================================================
// Score Nodes - Analytics Scoring
// ============================================================================

export type ScoreType = 
  | 'ANOMALY'
  | 'PREDICTION'
  | 'HEALTH'
  | 'QUALITY'
  | 'CONFIDENCE'
  | 'RISK';

export interface ScoreNodeConfig {
  scoreType: ScoreType;
  algorithm: string;
  thresholds?: Record<string, number>;
  attribution?: boolean; // Include factor attribution
  confidenceLevel: number; // 0.0 to 1.0
}

export type ScoreNode = QueryNode<ScoreNodeConfig>;

// ============================================================================
// Output Nodes - Result Formatting
// ============================================================================

export type OutputFormat = 
  | 'JSON'
  | 'TIME_SERIES'
  | 'AGGREGATED'
  | 'SCORED'
  | 'ATTRIBUTED';

export interface OutputNodeConfig {
  format: OutputFormat;
  fields?: string[];
  limit?: number;
  offset?: number;
  orderBy?: Array<{
    field: string;
    direction: 'ASC' | 'DESC';
  }>;
}

export type OutputNode = QueryNode<OutputNodeConfig>;

// ============================================================================
// Filter & Join Nodes
// ============================================================================

export interface FilterNodeConfig {
  conditions: Array<{
    field: string;
    operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'IN' | 'NOT IN';
    value: unknown;
  }>;
  logic: 'AND' | 'OR';
}

export type FilterNode = QueryNode<FilterNodeConfig>;

export interface JoinNodeConfig {
  leftSource: string;
  rightSource: string;
  joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  on: Array<{
    left: string;
    right: string;
  }>;
}

export type JoinNode = QueryNode<JoinNodeConfig>;

// ============================================================================
// Query Plan - Complete DAG
// ============================================================================

export interface QueryPlan {
  id: string;
  version: string;
  sellerId: string;
  nodes: Array<
    | SourceNode
    | TransformNode
    | AggregateNode
    | ScoreNode
    | OutputNode
    | FilterNode
    | JoinNode
  >;
  // Execution metadata
  executionMode: 'sequential' | 'parallel' | 'adaptive';
  maxLatencyMs?: number;
  minConfidence?: number;
  // Cost estimation
  estimatedCost?: {
    compute: number;
    memory: number;
    io: number;
  };
  // Reproducibility
  reproducibilityHash?: string;
  configVersion?: string;
}

// ============================================================================
// Query Request - API Interface
// ============================================================================

export interface QueryRequest {
  sellerId: string;
  queryType: 'ANOMALY' | 'PREDICTION' | 'INSIGHT' | 'FUNNEL' | 'CUSTOM';
  window: {
    start: number;
    end: number;
  };
  operators: TransformOperator[];
  output: OutputFormat[];
  constraints?: {
    maxLatencyMs?: number;
    minConfidence?: number;
    maxCost?: number;
  };
  // Optional: provide custom query plan
  customPlan?: QueryPlan;
}

// ============================================================================
// Execution Engine Types
// ============================================================================

export type ExecutionStatus = 
  | 'PENDING'
  | 'COMPILING'
  | 'QUEUED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'TIMEOUT';

export interface QueryExecution {
  id: string;
  sellerId: string;
  queryPlan: QueryPlan;
  status: ExecutionStatus;
  // Timing
  submittedAt: number;
  startedAt?: number;
  completedAt?: number;
  // Results
  resultReference?: string; // Link to anomalies/predictions/insights
  error?: string;
  // Execution stats
  stats?: {
    nodesExecuted: number;
    totalLatencyMs: number;
    cacheHits: number;
    cacheMisses: number;
    dataPointsProcessed: number;
  };
  // Reproducibility
  reproducibilityHash: string;
  configVersion: string;
}

// ============================================================================
// Execution Scheduler Types
// ============================================================================

export type ExecutionTier = 'free' | 'basic' | 'pro' | 'enterprise';

export interface ExecutionBudget {
  sellerId: string;
  tier: ExecutionTier;
  // Resource limits
  maxConcurrentQueries: number;
  maxQueueDepth: number;
  maxLatencyMs: number;
  maxComputeUnits: number;
  // Current usage
  currentQueries: number;
  queuedQueries: number;
  computeUnitsUsed: number;
  // Reset timing
  windowStart: number;
  windowEnd: number;
}

export type ExecutionQueue = 
  | 'anomaly'
  | 'prediction'
  | 'insight'
  | 'funnel'
  | 'custom';

export interface QueuedExecution {
  executionId: string;
  queue: ExecutionQueue;
  priority: number; // Higher = more urgent
  submittedAt: number;
  deadline?: number;
  budget: ExecutionBudget;
}

// ============================================================================
// Worker Pool Types
// ============================================================================

export interface WorkerPool {
  queue: ExecutionQueue;
  maxWorkers: number;
  activeWorkers: number;
  queueDepth: number;
  avgProcessingTimeMs: number;
  backpressure: {
    enabled: boolean;
    threshold: number;
    rejectionRate: number;
  };
}

// ============================================================================
// Data Source Registry Types
// ============================================================================

export interface DataSource {
  id: string;
  type: DataSourceType;
  name: string;
  description?: string;
  // Connection config
  config: Record<string, unknown>;
  // Capabilities
  capabilities: {
    supportsTimeRange: boolean;
    supportsFiltering: boolean;
    supportsAggregation: boolean;
    supportsJoin: boolean;
  };
  // Performance characteristics
  performance: {
    avgLatencyMs: number;
    throughputPerSec: number;
    reliability: number; // 0.0 to 1.0
  };
  // Status
  enabled: boolean;
  lastHealthCheck?: number;
}

// ============================================================================
// Query Optimizer Types
// ============================================================================

export interface QueryOptimizationHint {
  type: 'COST' | 'LATENCY' | 'ACCURACY' | 'BALANCED';
  weight: number;
}

export interface OptimizationResult {
  originalPlan: QueryPlan;
  optimizedPlan: QueryPlan;
  improvements: {
    estimatedCostReduction: number;
    estimatedLatencyReduction: number;
    confidenceImpact: number;
  };
  appliedOptimizations: string[];
}

// ============================================================================
// Cache Types
// ============================================================================

export interface QueryCache {
  id: string;
  queryHash: string;
  sellerId: string;
  queryPlan: QueryPlan;
  result: unknown;
  // Cache metadata
  cachedAt: number;
  ttlSeconds: number;
  expiresAt: number;
  hitCount: number;
  // Invalidation
  invalidatedAt?: number;
  invalidationReason?: string;
}

// ============================================================================
// Pipeline Versioning Types
// ============================================================================

export interface PipelineVersion {
  id: string;
  version: string;
  description?: string;
  operators: TransformOperator[];
  effectiveAt: number;
  deprecatedAt?: number;
  // Compatibility
  backwardCompatible: boolean;
  migrationPath?: string;
}

// ============================================================================
// Execution Invariants
// ============================================================================

export interface ExecutionInvariant {
  id: string;
  name: string;
  category: 'determinism' | 'performance' | 'correctness' | 'resource';
  description: string;
  enforcementLevel: 'hard' | 'soft' | 'advisory';
  // Validation
  validator: string; // Function name or SQL query
  violationAction: 'reject' | 'warn' | 'log';
}

// ============================================================================
// Monitoring & Observability
// ============================================================================

export interface ExecutionMetrics {
  executionId: string;
  sellerId: string;
  // Performance
  latencyMs: number;
  throughput: number;
  // Resource usage
  cpuTimeMs: number;
  memoryPeakMb: number;
  ioOperations: number;
  // Quality
  dataSufficiency: 'insufficient' | 'minimal' | 'adequate' | 'optimal';
  confidence: number;
  // Errors
  errors: Array<{
    nodeId: string;
    error: string;
    timestamp: number;
  }>;
}

// ============================================================================
// Federation Types
// ============================================================================

export interface FederatedQuery {
  id: string;
  sources: DataSource[];
  subQueries: Array<{
    sourceId: string;
    plan: QueryPlan;
    status: ExecutionStatus;
  }>;
  mergeStrategy: 'union' | 'join' | 'aggregate';
  // Partial execution support
  allowPartialResults: boolean;
  minSourcesRequired: number;
}

// ============================================================================
// Type Guards & Utilities
// ============================================================================

export function isSourceNode(node: QueryNode): node is SourceNode {
  return node.type === 'SOURCE';
}

export function isTransformNode(node: QueryNode): node is TransformNode {
  return node.type === 'TRANSFORM';
}

export function isAggregateNode(node: QueryNode): node is AggregateNode {
  return node.type === 'AGGREGATE';
}

export function isScoreNode(node: QueryNode): node is ScoreNode {
  return node.type === 'SCORE';
}

export function isOutputNode(node: QueryNode): node is OutputNode {
  return node.type === 'OUTPUT';
}

// ============================================================================
// Builder Pattern for Query Construction
// ============================================================================

export class QueryPlanBuilder {
  private plan: Partial<QueryPlan> = {
    nodes: [],
    executionMode: 'adaptive',
  };

  constructor(sellerId: string) {
    this.plan.id = crypto.randomUUID();
    this.plan.version = '1.0';
    this.plan.sellerId = sellerId;
  }

  addSource(config: SourceNodeConfig): this {
    const node: SourceNode = {
      id: crypto.randomUUID(),
      type: 'SOURCE',
      config,
      dependencies: [],
    };
    this.plan.nodes?.push(node);
    return this;
  }

  addTransform(config: TransformNodeConfig, dependsOn: string[]): this {
    const node: TransformNode = {
      id: crypto.randomUUID(),
      type: 'TRANSFORM',
      config,
      dependencies: dependsOn,
    };
    this.plan.nodes?.push(node);
    return this;
  }

  addAggregate(config: AggregateNodeConfig, dependsOn: string[]): this {
    const node: AggregateNode = {
      id: crypto.randomUUID(),
      type: 'AGGREGATE',
      config,
      dependencies: dependsOn,
    };
    this.plan.nodes?.push(node);
    return this;
  }

  addScore(config: ScoreNodeConfig, dependsOn: string[]): this {
    const node: ScoreNode = {
      id: crypto.randomUUID(),
      type: 'SCORE',
      config,
      dependencies: dependsOn,
    };
    this.plan.nodes?.push(node);
    return this;
  }

  addOutput(config: OutputNodeConfig, dependsOn: string[]): this {
    const node: OutputNode = {
      id: crypto.randomUUID(),
      type: 'OUTPUT',
      config,
      dependencies: dependsOn,
    };
    this.plan.nodes?.push(node);
    return this;
  }

  setExecutionMode(mode: 'sequential' | 'parallel' | 'adaptive'): this {
    this.plan.executionMode = mode;
    return this;
  }

  setConstraints(constraints: { maxLatencyMs?: number; minConfidence?: number }): this {
    this.plan.maxLatencyMs = constraints.maxLatencyMs;
    this.plan.minConfidence = constraints.minConfidence;
    return this;
  }

  build(): QueryPlan {
    if (!this.plan.nodes || this.plan.nodes.length === 0) {
      throw new Error('Query plan must have at least one node');
    }
    return this.plan as QueryPlan;
  }
}
