/**
 * Query Scheduler Service
 * 
 * Multi-threaded scheduler with execution budgets, worker pools,
 * and backpressure management for fair resource allocation.
 */

import { supabase } from '@/lib/supabase';
import type {
  ExecutionBudget,
  ExecutionQueue,
  QueuedExecution,
  WorkerPool,
  QueryExecution,
} from '@/types/query-execution';

// ============================================================================
// Scheduler Configuration
// ============================================================================

const QUEUE_CONFIG: Record<ExecutionQueue, { maxWorkers: number; backpressureThreshold: number }> = {
  anomaly: { maxWorkers: 4, backpressureThreshold: 20 },
  prediction: { maxWorkers: 3, backpressureThreshold: 15 },
  insight: { maxWorkers: 2, backpressureThreshold: 10 },
  funnel: { maxWorkers: 2, backpressureThreshold: 10 },
  custom: { maxWorkers: 1, backpressureThreshold: 5 },
};

// ============================================================================
// Execution Scheduler
// ============================================================================

export class ExecutionScheduler {
  private workerPools: Map<ExecutionQueue, WorkerPool> = new Map();

  constructor() {
    this.initializeWorkerPools();
  }

  private initializeWorkerPools(): void {
    for (const [queue, config] of Object.entries(QUEUE_CONFIG)) {
      this.workerPools.set(queue as ExecutionQueue, {
        queue: queue as ExecutionQueue,
        maxWorkers: config.maxWorkers,
        activeWorkers: 0,
        queueDepth: 0,
        avgProcessingTimeMs: 0,
        backpressure: {
          enabled: false,
          threshold: config.backpressureThreshold,
          rejectionRate: 0,
        },
      });
    }
  }

  /**
   * Submit a query execution to the scheduler
   */
  async submit(execution: QueryExecution, priority: number = 5): Promise<QueuedExecution> {
    // Determine queue based on query type
    const queue = this.determineQueue(execution);

    // Check budget
    const budget = await this.getBudget(execution.sellerId);
    if (!budget) {
      throw new Error('No execution budget found');
    }

    // Check if we should apply backpressure
    const pool = this.workerPools.get(queue);
    if (pool && this.shouldApplyBackpressure(pool)) {
      throw new Error(`Queue ${queue} is under backpressure. Please retry later.`);
    }

    // Check budget limits
    if (budget.currentQueries >= budget.maxConcurrentQueries) {
      throw new Error('Concurrent query limit reached');
    }

    if (budget.queuedQueries >= budget.maxQueueDepth) {
      throw new Error('Queue depth limit reached');
    }

    // Create queued execution
    const { data, error } = await supabase
      .from('execution_queue')
      .insert({
        execution_id: execution.id,
        queue_type: queue,
        priority,
        seller_id: execution.sellerId,
        status: 'QUEUED',
      })
      .select()
      .single();

    if (error) throw error;

    // Update budget
    await this.incrementQueuedQueries(execution.sellerId);

    return {
      executionId: execution.id,
      queue,
      priority,
      submittedAt: Date.now(),
      budget,
    };
  }

  /**
   * Dequeue and execute the next query
   */
  async dequeue(queue: ExecutionQueue): Promise<QueryExecution | null> {
    const pool = this.workerPools.get(queue);
    if (!pool) return null;

    // Check if we have available workers
    if (pool.activeWorkers >= pool.maxWorkers) {
      return null;
    }

    // Get highest priority queued execution
    const { data: queued } = await supabase
      .from('execution_queue')
      .select('*')
      .eq('queue_type', queue)
      .eq('status', 'QUEUED')
      .order('priority', { ascending: false })
      .order('submitted_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!queued) return null;

    // Mark as dequeued
    await supabase
      .from('execution_queue')
      .update({
        status: 'DEQUEUED',
        dequeued_at: new Date().toISOString(),
      })
      .eq('id', queued.id);

    // Increment active workers
    pool.activeWorkers++;
    this.updateWorkerPoolStats(queue);

    // Get execution
    const { data: execution } = await supabase
      .from('query_execution')
      .select('*')
      .eq('id', queued.execution_id)
      .single();

    return execution as QueryExecution;
  }

  /**
   * Mark execution as complete and free up resources
   */
  async complete(executionId: string, queue: ExecutionQueue): Promise<void> {
    const pool = this.workerPools.get(queue);
    if (pool) {
      pool.activeWorkers = Math.max(0, pool.activeWorkers - 1);
      this.updateWorkerPoolStats(queue);
    }

    // Update queue status
    await supabase
      .from('execution_queue')
      .update({ status: 'COMPLETED' })
      .eq('execution_id', executionId);

    // Get seller ID and decrement budget
    const { data: execution } = await supabase
      .from('query_execution')
      .select('seller_id')
      .eq('id', executionId)
      .single();

    if (execution) {
      await this.decrementCurrentQueries(execution.seller_id);
    }
  }

  /**
   * Mark execution as failed
   */
  async fail(executionId: string, queue: ExecutionQueue, error: string): Promise<void> {
    const pool = this.workerPools.get(queue);
    if (pool) {
      pool.activeWorkers = Math.max(0, pool.activeWorkers - 1);
      this.updateWorkerPoolStats(queue);
    }

    await supabase
      .from('execution_queue')
      .update({ status: 'FAILED' })
      .eq('execution_id', executionId);

    // Get seller ID and decrement budget
    const { data: execution } = await supabase
      .from('query_execution')
      .select('seller_id')
      .eq('id', executionId)
      .single();

    if (execution) {
      await this.decrementCurrentQueries(execution.seller_id);
    }
  }

  /**
   * Get current queue statistics
   */
  async getQueueStats(queue: ExecutionQueue): Promise<WorkerPool | null> {
    return this.workerPools.get(queue) || null;
  }

  /**
   * Get all queue statistics
   */
  getAllQueueStats(): WorkerPool[] {
    return Array.from(this.workerPools.values());
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private determineQueue(execution: QueryExecution): ExecutionQueue {
    const queryType = execution.queryPlan.nodes.find((n) => n.type === 'SCORE')?.config as any;

    if (!queryType) return 'custom';

    const typeMap: Record<string, ExecutionQueue> = {
      ANOMALY: 'anomaly',
      PREDICTION: 'prediction',
      HEALTH: 'insight',
      QUALITY: 'funnel',
    };

    return typeMap[queryType.scoreType] || 'custom';
  }

  private shouldApplyBackpressure(pool: WorkerPool): boolean {
    if (!pool.backpressure.enabled) {
      // Enable backpressure if queue depth exceeds threshold
      if (pool.queueDepth >= pool.backpressure.threshold) {
        pool.backpressure.enabled = true;
        return true;
      }
      return false;
    }

    // Disable backpressure if queue depth drops below 50% of threshold
    if (pool.queueDepth < pool.backpressure.threshold * 0.5) {
      pool.backpressure.enabled = false;
      return false;
    }

    return true;
  }

  private async getBudget(sellerId: string): Promise<ExecutionBudget | null> {
    const { data } = await supabase
      .from('execution_budgets')
      .select('*')
      .eq('seller_id', sellerId)
      .maybeSingle();

    if (!data) return null;

    return {
      sellerId: data.seller_id,
      tier: data.tier,
      maxConcurrentQueries: data.max_concurrent_queries,
      maxQueueDepth: data.max_queue_depth,
      maxLatencyMs: data.max_latency_ms,
      maxComputeUnits: data.max_compute_units,
      currentQueries: data.current_queries,
      queuedQueries: data.queued_queries,
      computeUnitsUsed: data.compute_units_used,
      windowStart: new Date(data.window_start).getTime(),
      windowEnd: new Date(data.window_end).getTime(),
    };
  }

  private async incrementQueuedQueries(sellerId: string): Promise<void> {
    await supabase.rpc('increment_queued_queries', { p_seller_id: sellerId });
  }

  private async decrementCurrentQueries(sellerId: string): Promise<void> {
    await supabase.rpc('decrement_current_queries', { p_seller_id: sellerId });
  }

  private async updateWorkerPoolStats(queue: ExecutionQueue): Promise<void> {
    const pool = this.workerPools.get(queue);
    if (!pool) return;

    // Get current queue depth
    const { count } = await supabase
      .from('execution_queue')
      .select('*', { count: 'exact', head: true })
      .eq('queue_type', queue)
      .eq('status', 'QUEUED');

    pool.queueDepth = count || 0;

    // Record stats
    await supabase.from('worker_pool_stats').insert({
      queue_type: queue,
      max_workers: pool.maxWorkers,
      active_workers: pool.activeWorkers,
      queue_depth: pool.queueDepth,
      avg_processing_time_ms: pool.avgProcessingTimeMs,
      backpressure_enabled: pool.backpressure.enabled,
      backpressure_threshold: pool.backpressure.threshold,
      rejection_rate: pool.backpressure.rejectionRate,
    });
  }
}

// ============================================================================
// Budget Management
// ============================================================================

export class BudgetManager {
  /**
   * Initialize execution budget for a seller
   */
  static async initialize(sellerId: string, tier: 'free' | 'basic' | 'pro' | 'enterprise'): Promise<void> {
    const limits = this.getTierLimits(tier);

    await supabase.from('execution_budgets').upsert({
      seller_id: sellerId,
      tier,
      ...limits,
      current_queries: 0,
      queued_queries: 0,
      compute_units_used: 0,
      window_start: new Date().toISOString(),
      window_end: new Date(Date.now() + 3600000).toISOString(), // 1 hour
    });
  }

  /**
   * Reset budget for a seller
   */
  static async reset(sellerId: string): Promise<void> {
    await supabase.rpc('reset_execution_budget', { p_seller_id: sellerId });
  }

  /**
   * Get current budget status
   */
  static async getStatus(sellerId: string): Promise<ExecutionBudget | null> {
    const { data } = await supabase
      .from('execution_budgets')
      .select('*')
      .eq('seller_id', sellerId)
      .maybeSingle();

    if (!data) return null;

    return {
      sellerId: data.seller_id,
      tier: data.tier,
      maxConcurrentQueries: data.max_concurrent_queries,
      maxQueueDepth: data.max_queue_depth,
      maxLatencyMs: data.max_latency_ms,
      maxComputeUnits: data.max_compute_units,
      currentQueries: data.current_queries,
      queuedQueries: data.queued_queries,
      computeUnitsUsed: data.compute_units_used,
      windowStart: new Date(data.window_start).getTime(),
      windowEnd: new Date(data.window_end).getTime(),
    };
  }

  private static getTierLimits(tier: string): Record<string, number> {
    const limits: Record<string, Record<string, number>> = {
      free: {
        max_concurrent_queries: 1,
        max_queue_depth: 3,
        max_latency_ms: 10000,
        max_compute_units: 50,
      },
      basic: {
        max_concurrent_queries: 3,
        max_queue_depth: 10,
        max_latency_ms: 5000,
        max_compute_units: 200,
      },
      pro: {
        max_concurrent_queries: 10,
        max_queue_depth: 50,
        max_latency_ms: 2000,
        max_compute_units: 1000,
      },
      enterprise: {
        max_concurrent_queries: 50,
        max_queue_depth: 200,
        max_latency_ms: 1000,
        max_compute_units: 10000,
      },
    };

    return limits[tier] || limits.free;
  }
}

// ============================================================================
// Deadline-Aware Scheduling
// ============================================================================

export class DeadlineScheduler {
  /**
   * Schedule execution with deadline
   */
  static async scheduleWithDeadline(
    execution: QueryExecution,
    deadlineMs: number,
    priority: number = 5
  ): Promise<QueuedExecution> {
    const scheduler = new ExecutionScheduler();
    const queued = await scheduler.submit(execution, priority);

    // Set deadline
    await supabase
      .from('execution_queue')
      .update({
        deadline: new Date(Date.now() + deadlineMs).toISOString(),
      })
      .eq('execution_id', execution.id);

    return queued;
  }

  /**
   * Check for expired deadlines and cancel executions
   */
  static async checkDeadlines(): Promise<void> {
    const { data: expired } = await supabase
      .from('execution_queue')
      .select('*')
      .lt('deadline', new Date().toISOString())
      .in('status', ['QUEUED', 'DEQUEUED']);

    if (!expired || expired.length === 0) return;

    for (const item of expired) {
      // Cancel execution
      await supabase
        .from('query_execution')
        .update({ status: 'TIMEOUT' })
        .eq('id', item.execution_id);

      // Update queue
      await supabase
        .from('execution_queue')
        .update({ status: 'EXPIRED' })
        .eq('id', item.id);
    }
  }
}

// ============================================================================
// Public API
// ============================================================================

export const scheduler = new ExecutionScheduler();

export async function submitQuery(execution: QueryExecution, priority?: number): Promise<QueuedExecution> {
  return scheduler.submit(execution, priority);
}

export async function getQueueStats(queue: ExecutionQueue): Promise<WorkerPool | null> {
  return scheduler.getQueueStats(queue);
}

export async function getAllQueueStats(): Promise<WorkerPool[]> {
  return scheduler.getAllQueueStats();
}
