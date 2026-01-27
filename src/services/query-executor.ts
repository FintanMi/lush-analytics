/**
 * Query Executor Service
 * 
 * Core execution engine that compiles query plans into deterministic DAGs
 * and executes them with controlled parallelism and resource management.
 */

import { supabase } from '@/lib/supabase';
import type {
  QueryPlan,
  QueryRequest,
  QueryExecution,
  QueryNode,
  SourceNode,
  TransformNode,
  AggregateNode,
  ScoreNode,
  OutputNode,
  ExecutionStatus,
} from '@/types/query-execution';
import { QueryPlanBuilder } from '@/types/query-execution';

// ============================================================================
// Query Plan Compiler
// ============================================================================

export class QueryPlanCompiler {
  /**
   * Compile a high-level QueryRequest into an executable QueryPlan DAG
   */
  static compile(request: QueryRequest): QueryPlan {
    const builder = new QueryPlanBuilder(request.sellerId);

    // Step 1: Add source node
    const sourceId = this.addSourceNode(builder, request);

    // Step 2: Add transform nodes for each operator
    let lastNodeId = sourceId;
    const transformIds: string[] = [];

    for (const operator of request.operators) {
      const transformId = this.addTransformNode(builder, operator, [lastNodeId]);
      transformIds.push(transformId);
      lastNodeId = transformId;
    }

    // Step 3: Add score node based on query type
    const scoreId = this.addScoreNode(builder, request.queryType, [lastNodeId]);

    // Step 4: Add output node
    this.addOutputNode(builder, request.output, [scoreId]);

    // Set execution constraints
    if (request.constraints) {
      builder.setConstraints({
        maxLatencyMs: request.constraints.maxLatencyMs,
        minConfidence: request.constraints.minConfidence,
      });
    }

    // Build and return the plan
    const plan = builder.build();
    plan.reproducibilityHash = this.computeHash(plan);
    
    return plan;
  }

  private static addSourceNode(builder: QueryPlanBuilder, request: QueryRequest): string {
    const node = builder.addSource({
      sourceType: 'RING_BUFFER',
      sellerId: request.sellerId,
      timeWindow: request.window,
      sampling: {
        enabled: false,
        rate: 1.0,
        strategy: 'uniform',
      },
    });

    // Return the ID of the last added node
    return crypto.randomUUID();
  }

  private static addTransformNode(
    builder: QueryPlanBuilder,
    operator: string,
    dependencies: string[]
  ): string {
    builder.addTransform(
      {
        operator: operator as any,
        parameters: this.getDefaultParameters(operator),
        deterministic: true,
        parallelizable: operator === 'FFT' || operator === 'HFD',
      },
      dependencies
    );

    return crypto.randomUUID();
  }

  private static addScoreNode(
    builder: QueryPlanBuilder,
    queryType: string,
    dependencies: string[]
  ): string {
    const scoreTypeMap: Record<string, any> = {
      ANOMALY: 'ANOMALY',
      PREDICTION: 'PREDICTION',
      INSIGHT: 'HEALTH',
      FUNNEL: 'QUALITY',
    };

    builder.addScore(
      {
        scoreType: scoreTypeMap[queryType] || 'ANOMALY',
        algorithm: 'default',
        attribution: true,
        confidenceLevel: 0.8,
      },
      dependencies
    );

    return crypto.randomUUID();
  }

  private static addOutputNode(
    builder: QueryPlanBuilder,
    formats: string[],
    dependencies: string[]
  ): void {
    builder.addOutput(
      {
        format: formats[0] as any || 'JSON',
        limit: 100,
      },
      dependencies
    );
  }

  private static getDefaultParameters(operator: string): Record<string, unknown> {
    const defaults: Record<string, Record<string, unknown>> = {
      FIR: { windowSize: 5, coefficients: [0.2, 0.2, 0.2, 0.2, 0.2] },
      FFT: { windowSize: 512, normalize: true },
      HFD: { kMax: 10 },
      NORMALIZE: { method: 'z-score' },
      DETREND: { method: 'linear' },
    };

    return defaults[operator] || {};
  }

  private static computeHash(plan: QueryPlan): string {
    // Create a deterministic hash of the query plan
    const planString = JSON.stringify(plan, Object.keys(plan).sort());
    return this.simpleHash(planString);
  }

  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

// ============================================================================
// Query Executor
// ============================================================================

export class QueryExecutor {
  /**
   * Execute a query plan with deterministic parallelism
   */
  static async execute(plan: QueryPlan): Promise<QueryExecution> {
    // Create execution record
    const execution = await this.createExecution(plan);

    try {
      // Validate execution budget
      await this.validateBudget(plan.sellerId);

      // Update status to running
      await this.updateExecutionStatus(execution.id, 'RUNNING');

      // Build execution DAG
      const dag = this.buildDAG(plan);

      // Execute nodes in topological order
      const results = await this.executeDAG(dag, execution.id);

      // Store final result
      const finalResult = results[results.length - 1];

      await this.completeExecution(execution.id, finalResult);

      return {
        ...execution,
        status: 'COMPLETED',
        completedAt: Date.now(),
      };
    } catch (error) {
      await this.failExecution(execution.id, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  private static async createExecution(plan: QueryPlan): Promise<QueryExecution> {
    const { data, error } = await supabase
      .from('query_execution')
      .insert({
        seller_id: plan.sellerId,
        query_type: 'CUSTOM',
        query_plan: plan as any,
        status: 'PENDING',
        reproducibility_hash: plan.reproducibilityHash || '',
        config_version: plan.version,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      sellerId: plan.sellerId,
      queryPlan: plan,
      status: 'PENDING',
      submittedAt: Date.now(),
      reproducibilityHash: plan.reproducibilityHash || '',
      configVersion: plan.version,
    };
  }

  private static async validateBudget(sellerId: string): Promise<void> {
    const { data: budget } = await supabase
      .from('execution_budgets')
      .select('*')
      .eq('seller_id', sellerId)
      .single();

    if (!budget) {
      throw new Error('No execution budget found for seller');
    }

    if (budget.current_queries >= budget.max_concurrent_queries) {
      throw new Error('Concurrent query limit reached');
    }

    if (budget.queued_queries >= budget.max_queue_depth) {
      throw new Error('Queue depth limit reached');
    }
  }

  private static async updateExecutionStatus(
    executionId: string,
    status: ExecutionStatus
  ): Promise<void> {
    await supabase
      .from('query_execution')
      .update({ status, started_at: status === 'RUNNING' ? new Date().toISOString() : undefined })
      .eq('id', executionId);
  }

  private static buildDAG(plan: QueryPlan): Map<string, QueryNode> {
    const dag = new Map<string, QueryNode>();

    for (const node of plan.nodes) {
      dag.set(node.id, node);
    }

    return dag;
  }

  private static async executeDAG(
    dag: Map<string, QueryNode>,
    executionId: string
  ): Promise<unknown[]> {
    // Topological sort
    const sorted = this.topologicalSort(dag);
    const results = new Map<string, unknown>();

    // Execute nodes in order
    for (const nodeId of sorted) {
      const node = dag.get(nodeId);
      if (!node) continue;

      // Get dependency results
      const depResults = node.dependencies.map((depId) => results.get(depId));

      // Execute node
      const result = await this.executeNode(node, depResults, executionId);
      results.set(nodeId, result);
    }

    return Array.from(results.values());
  }

  private static topologicalSort(dag: Map<string, QueryNode>): string[] {
    const sorted: string[] = [];
    const visited = new Set<string>();
    const temp = new Set<string>();

    const visit = (nodeId: string) => {
      if (temp.has(nodeId)) {
        throw new Error('Circular dependency detected in query plan');
      }
      if (visited.has(nodeId)) return;

      temp.add(nodeId);

      const node = dag.get(nodeId);
      if (node) {
        for (const depId of node.dependencies) {
          visit(depId);
        }
      }

      temp.delete(nodeId);
      visited.add(nodeId);
      sorted.push(nodeId);
    };

    for (const nodeId of dag.keys()) {
      if (!visited.has(nodeId)) {
        visit(nodeId);
      }
    }

    return sorted;
  }

  private static async executeNode(
    node: QueryNode,
    dependencies: unknown[],
    executionId: string
  ): Promise<unknown> {
    const startTime = Date.now();

    try {
      // Record node execution start
      await this.recordNodeExecution(executionId, node, 'RUNNING');

      let result: unknown;

      // Execute based on node type
      switch (node.type) {
        case 'SOURCE':
          result = await this.executeSourceNode(node as SourceNode);
          break;
        case 'TRANSFORM':
          result = await this.executeTransformNode(node as TransformNode, dependencies);
          break;
        case 'AGGREGATE':
          result = await this.executeAggregateNode(node as AggregateNode, dependencies);
          break;
        case 'SCORE':
          result = await this.executeScoreNode(node as ScoreNode, dependencies);
          break;
        case 'OUTPUT':
          result = await this.executeOutputNode(node as OutputNode, dependencies);
          break;
        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }

      const latencyMs = Date.now() - startTime;

      // Record successful execution
      await this.recordNodeExecution(executionId, node, 'COMPLETED', result, latencyMs);

      return result;
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      await this.recordNodeExecution(
        executionId,
        node,
        'FAILED',
        null,
        latencyMs,
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  private static async executeSourceNode(node: SourceNode): Promise<unknown> {
    // Fetch data from the specified source
    const config = node.config;

    // For now, fetch from events table (ring buffer simulation)
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('seller_id', config.sellerId)
      .gte('timestamp', config.timeWindow.start)
      .lte('timestamp', config.timeWindow.end)
      .order('timestamp', { ascending: true })
      .limit(512);

    if (error) throw error;

    return data;
  }

  private static async executeTransformNode(
    node: TransformNode,
    dependencies: unknown[]
  ): Promise<unknown> {
    // Apply transformation to input data
    const inputData = dependencies[0] as any[];

    // Placeholder: In production, this would call the actual DSP functions
    // For now, just pass through
    return inputData;
  }

  private static async executeAggregateNode(
    node: AggregateNode,
    dependencies: unknown[]
  ): Promise<unknown> {
    const inputData = dependencies[0] as any[];
    const config = node.config;

    // Simple aggregation
    if (config.function === 'COUNT') {
      return { count: inputData.length };
    }

    return inputData;
  }

  private static async executeScoreNode(
    node: ScoreNode,
    dependencies: unknown[]
  ): Promise<unknown> {
    // Compute score based on input data
    // Placeholder: In production, this would call anomaly detection, prediction, etc.
    return {
      score: 0.75,
      confidence: 0.85,
      attribution: [],
    };
  }

  private static async executeOutputNode(
    node: OutputNode,
    dependencies: unknown[]
  ): Promise<unknown> {
    // Format output
    const inputData = dependencies[0];
    return inputData;
  }

  private static async recordNodeExecution(
    executionId: string,
    node: QueryNode,
    status: 'RUNNING' | 'COMPLETED' | 'FAILED',
    result?: unknown,
    latencyMs?: number,
    error?: string
  ): Promise<void> {
    await supabase.from('query_execution_nodes').upsert({
      execution_id: executionId,
      node_id: node.id,
      node_type: node.type,
      node_config: node.config as any,
      dependencies: node.dependencies,
      status,
      output_data: result as any,
      latency_ms: latencyMs,
      error,
      started_at: status === 'RUNNING' ? new Date().toISOString() : undefined,
      completed_at: status !== 'RUNNING' ? new Date().toISOString() : undefined,
    });
  }

  private static async completeExecution(executionId: string, result: unknown): Promise<void> {
    await supabase
      .from('query_execution')
      .update({
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
        result_data: result as any,
      })
      .eq('id', executionId);
  }

  private static async failExecution(executionId: string, error: string): Promise<void> {
    await supabase
      .from('query_execution')
      .update({
        status: 'FAILED',
        completed_at: new Date().toISOString(),
        error,
      })
      .eq('id', executionId);
  }
}

// ============================================================================
// Public API
// ============================================================================

export async function executeQuery(request: QueryRequest): Promise<QueryExecution> {
  // Check cache first
  const cachedResult = await checkCache(request);
  if (cachedResult) {
    return cachedResult;
  }

  // Compile query plan
  const plan = QueryPlanCompiler.compile(request);

  // Execute query
  const execution = await QueryExecutor.execute(plan);

  // Cache result
  await cacheResult(request, execution);

  return execution;
}

async function checkCache(request: QueryRequest): Promise<QueryExecution | null> {
  const queryHash = computeRequestHash(request);

  const { data } = await supabase.rpc('get_cached_query', {
    p_query_hash: queryHash,
    p_seller_id: request.sellerId,
  });

  if (data) {
    return data as QueryExecution;
  }

  return null;
}

async function cacheResult(request: QueryRequest, execution: QueryExecution): Promise<void> {
  const queryHash = computeRequestHash(request);

  await supabase.from('query_cache').insert({
    query_hash: queryHash,
    seller_id: request.sellerId,
    query_plan: execution.queryPlan as any,
    result_data: execution as any,
    ttl_seconds: 30,
    expires_at: new Date(Date.now() + 30000).toISOString(),
  });
}

function computeRequestHash(request: QueryRequest): string {
  const requestString = JSON.stringify(request, Object.keys(request).sort());
  let hash = 0;
  for (let i = 0; i < requestString.length; i++) {
    const char = requestString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
