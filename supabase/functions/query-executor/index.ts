/**
 * Query Executor Edge Function
 * 
 * POST /query - Execute analytics queries with explicit query planning
 * 
 * This transforms the system from "API service" → "analytics engine"
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// Types
// ============================================================================

interface QueryRequest {
  sellerId: string;
  queryType: 'ANOMALY' | 'PREDICTION' | 'INSIGHT' | 'FUNNEL' | 'CUSTOM';
  window: {
    start: number;
    end: number;
  };
  operators: string[];
  output: string[];
  constraints?: {
    maxLatencyMs?: number;
    minConfidence?: number;
    maxCost?: number;
  };
  customPlan?: any;
}

interface QueryPlan {
  id: string;
  version: string;
  sellerId: string;
  nodes: any[];
  executionMode: 'sequential' | 'parallel' | 'adaptive';
  maxLatencyMs?: number;
  minConfidence?: number;
  reproducibilityHash?: string;
  configVersion?: string;
}

// ============================================================================
// Query Plan Compiler
// ============================================================================

function compileQueryPlan(request: QueryRequest): QueryPlan {
  const nodes: any[] = [];

  // Add source node
  const sourceId = crypto.randomUUID();
  nodes.push({
    id: sourceId,
    type: 'SOURCE',
    config: {
      sourceType: 'RING_BUFFER',
      sellerId: request.sellerId,
      timeWindow: request.window,
      sampling: {
        enabled: false,
        rate: 1.0,
        strategy: 'uniform',
      },
    },
    dependencies: [],
  });

  // Add transform nodes
  let lastNodeId = sourceId;
  for (const operator of request.operators) {
    const transformId = crypto.randomUUID();
    nodes.push({
      id: transformId,
      type: 'TRANSFORM',
      config: {
        operator,
        parameters: getDefaultParameters(operator),
        deterministic: true,
        parallelizable: operator === 'FFT' || operator === 'HFD',
      },
      dependencies: [lastNodeId],
    });
    lastNodeId = transformId;
  }

  // Add score node
  const scoreId = crypto.randomUUID();
  const scoreTypeMap: Record<string, string> = {
    ANOMALY: 'ANOMALY',
    PREDICTION: 'PREDICTION',
    INSIGHT: 'HEALTH',
    FUNNEL: 'QUALITY',
  };

  nodes.push({
    id: scoreId,
    type: 'SCORE',
    config: {
      scoreType: scoreTypeMap[request.queryType] || 'ANOMALY',
      algorithm: 'default',
      attribution: true,
      confidenceLevel: 0.8,
    },
    dependencies: [lastNodeId],
  });

  // Add output node
  const outputId = crypto.randomUUID();
  nodes.push({
    id: outputId,
    type: 'OUTPUT',
    config: {
      format: request.output[0] || 'JSON',
      limit: 100,
    },
    dependencies: [scoreId],
  });

  const plan: QueryPlan = {
    id: crypto.randomUUID(),
    version: '1.0',
    sellerId: request.sellerId,
    nodes,
    executionMode: 'adaptive',
    maxLatencyMs: request.constraints?.maxLatencyMs,
    minConfidence: request.constraints?.minConfidence,
  };

  plan.reproducibilityHash = computeHash(JSON.stringify(plan));
  plan.configVersion = '1.0.0';

  return plan;
}

function getDefaultParameters(operator: string): Record<string, any> {
  const defaults: Record<string, Record<string, any>> = {
    FIR: { windowSize: 5, coefficients: [0.2, 0.2, 0.2, 0.2, 0.2] },
    FFT: { windowSize: 512, normalize: true },
    HFD: { kMax: 10 },
    NORMALIZE: { method: 'z-score' },
    DETREND: { method: 'linear' },
  };

  return defaults[operator] || {};
}

function computeHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// ============================================================================
// Query Executor
// ============================================================================

async function executeQuery(plan: QueryPlan, supabase: any): Promise<any> {
  // Create execution record
  const { data: execution, error: execError } = await supabase
    .from('query_execution')
    .insert({
      seller_id: plan.sellerId,
      query_type: 'CUSTOM',
      query_plan: plan,
      status: 'RUNNING',
      reproducibility_hash: plan.reproducibilityHash,
      config_version: plan.configVersion,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (execError) throw execError;

  try {
    // Execute nodes in topological order
    const results = new Map<string, any>();

    for (const node of plan.nodes) {
      const nodeStartTime = Date.now();

      // Get dependency results
      const depResults = node.dependencies.map((depId: string) => results.get(depId));

      // Execute node
      let result: any;
      switch (node.type) {
        case 'SOURCE':
          result = await executeSourceNode(node, supabase);
          break;
        case 'TRANSFORM':
          result = await executeTransformNode(node, depResults);
          break;
        case 'AGGREGATE':
          result = await executeAggregateNode(node, depResults);
          break;
        case 'SCORE':
          result = await executeScoreNode(node, depResults);
          break;
        case 'OUTPUT':
          result = await executeOutputNode(node, depResults);
          break;
        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }

      const nodeLatency = Date.now() - nodeStartTime;

      // Record node execution
      await supabase.from('query_execution_nodes').insert({
        execution_id: execution.id,
        node_id: node.id,
        node_type: node.type,
        node_config: node.config,
        dependencies: node.dependencies,
        status: 'COMPLETED',
        output_data: result,
        latency_ms: nodeLatency,
        completed_at: new Date().toISOString(),
      });

      results.set(node.id, result);
    }

    // Get final result
    const finalResult = Array.from(results.values()).pop();

    // Complete execution
    await supabase
      .from('query_execution')
      .update({
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
        result_data: finalResult,
        nodes_executed: plan.nodes.length,
      })
      .eq('id', execution.id);

    return finalResult;
  } catch (error: any) {
    // Fail execution
    await supabase
      .from('query_execution')
      .update({
        status: 'FAILED',
        completed_at: new Date().toISOString(),
        error: error.message,
      })
      .eq('id', execution.id);

    throw error;
  }
}

async function executeSourceNode(node: any, supabase: any): Promise<any[]> {
  const config = node.config;

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('seller_id', config.sellerId)
    .gte('timestamp', config.timeWindow.start)
    .lte('timestamp', config.timeWindow.end)
    .order('timestamp', { ascending: true })
    .limit(512);

  if (error) throw error;

  return data || [];
}

async function executeTransformNode(node: any, dependencies: any[]): Promise<any> {
  // Pass through for now
  // In production, this would call actual DSP functions
  return dependencies[0];
}

async function executeAggregateNode(node: any, dependencies: any[]): Promise<any> {
  const inputData = dependencies[0] as any[];
  const config = node.config;

  if (config.function === 'COUNT') {
    return { count: inputData.length };
  }

  return inputData;
}

async function executeScoreNode(node: any, dependencies: any[]): Promise<any> {
  // Placeholder scoring
  return {
    score: 0.75,
    confidence: 0.85,
    attribution: [],
  };
}

async function executeOutputNode(node: any, dependencies: any[]): Promise<any> {
  return dependencies[0];
}

// ============================================================================
// Main Handler
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify authentication
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request
    const request: QueryRequest = await req.json();

    // Validate request
    if (!request.sellerId || !request.queryType || !request.window) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: sellerId, queryType, window' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check cache first
    const queryHash = computeHash(JSON.stringify(request));
    const { data: cached } = await supabaseClient.rpc('get_cached_query', {
      p_query_hash: queryHash,
      p_seller_id: request.sellerId,
    });

    if (cached) {
      return new Response(JSON.stringify({ cached: true, result: cached }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Compile query plan
    const plan = request.customPlan || compileQueryPlan(request);

    // Execute query
    const result = await executeQuery(plan, supabaseClient);

    // Cache result
    await supabaseClient.from('query_cache').insert({
      query_hash: queryHash,
      seller_id: request.sellerId,
      query_plan: plan,
      result_data: result,
      ttl_seconds: 30,
      expires_at: new Date(Date.now() + 30000).toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        result,
        plan: {
          id: plan.id,
          nodes: plan.nodes.length,
          reproducibilityHash: plan.reproducibilityHash,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Query execution error:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
