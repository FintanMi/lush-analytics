/**
 * Data Sources Abstraction Layer
 * 
 * Pluggable data sources for federated query execution.
 * Supports multiple backends with unified interface.
 */

import { supabase } from '@/lib/supabase';
import type { DataSource, DataSourceType, SourceNodeConfig } from '@/types/query-execution';

// ============================================================================
// Data Source Interface
// ============================================================================

export interface IDataSource {
  readonly id: string;
  readonly type: DataSourceType;
  readonly name: string;

  // Core operations
  fetch(config: SourceNodeConfig): Promise<unknown[]>;
  supports(capability: DataSourceCapability): boolean;
  getPerformanceMetrics(): Promise<PerformanceMetrics>;
  healthCheck(): Promise<boolean>;
}

export type DataSourceCapability = 
  | 'TIME_RANGE'
  | 'FILTERING'
  | 'AGGREGATION'
  | 'JOIN'
  | 'STREAMING';

export interface PerformanceMetrics {
  avgLatencyMs: number;
  throughputPerSec: number;
  reliability: number;
  lastMeasured: number;
}

// ============================================================================
// Ring Buffer Data Source
// ============================================================================

export class RingBufferSource implements IDataSource {
  readonly id = 'ring-buffer';
  readonly type: DataSourceType = 'RING_BUFFER';
  readonly name = 'In-Memory Ring Buffer';

  async fetch(config: SourceNodeConfig): Promise<unknown[]> {
    // Fetch from events table (simulating ring buffer)
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('seller_id', config.sellerId)
      .gte('timestamp', config.timeWindow.start)
      .lte('timestamp', config.timeWindow.end)
      .order('timestamp', { ascending: true })
      .limit(512); // Ring buffer capacity

    if (error) throw error;

    // Apply sampling if configured
    if (config.sampling?.enabled) {
      return this.applySampling(data || [], config.sampling.rate, config.sampling.strategy);
    }

    return data || [];
  }

  supports(capability: DataSourceCapability): boolean {
    return ['TIME_RANGE', 'FILTERING'].includes(capability);
  }

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    return {
      avgLatencyMs: 50,
      throughputPerSec: 10000,
      reliability: 0.99,
      lastMeasured: Date.now(),
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await supabase.from('events').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  private applySampling(data: unknown[], rate: number, strategy: string): unknown[] {
    if (strategy === 'uniform') {
      return data.filter(() => Math.random() < rate);
    }

    // Adaptive sampling: keep more recent data
    if (strategy === 'adaptive') {
      return data.filter((_, idx) => {
        const recencyFactor = idx / data.length;
        return Math.random() < rate * (0.5 + recencyFactor);
      });
    }

    return data;
  }
}

// ============================================================================
// Aggregate Store Data Source
// ============================================================================

export class AggregateStoreSource implements IDataSource {
  readonly id = 'aggregate-store';
  readonly type: DataSourceType = 'AGGREGATE_STORE';
  readonly name = 'Daily Aggregates';

  async fetch(config: SourceNodeConfig): Promise<unknown[]> {
    const startDate = new Date(config.timeWindow.start).toISOString().split('T')[0];
    const endDate = new Date(config.timeWindow.end).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('events_agg_daily')
      .select('*')
      .eq('seller_id', config.sellerId)
      .gte('day', startDate)
      .lte('day', endDate)
      .order('day', { ascending: true });

    if (error) throw error;

    return data || [];
  }

  supports(capability: DataSourceCapability): boolean {
    return ['TIME_RANGE', 'FILTERING', 'AGGREGATION'].includes(capability);
  }

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    return {
      avgLatencyMs: 100,
      throughputPerSec: 5000,
      reliability: 0.995,
      lastMeasured: Date.now(),
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await supabase.from('events_agg_daily').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// Cached Metrics Data Source
// ============================================================================

export class CachedMetricsSource implements IDataSource {
  readonly id = 'cached-metrics';
  readonly type: DataSourceType = 'CACHED_METRICS';
  readonly name = 'Metrics Cache';

  async fetch(config: SourceNodeConfig): Promise<unknown[]> {
    const { data, error } = await supabase
      .from('metrics_cache')
      .select('*')
      .eq('seller_id', config.sellerId)
      .eq('metric_type', config.metricType || 'SALE')
      .order('last_computed', { ascending: false })
      .limit(1);

    if (error) throw error;

    return data || [];
  }

  supports(capability: DataSourceCapability): boolean {
    return ['FILTERING'].includes(capability);
  }

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    return {
      avgLatencyMs: 10,
      throughputPerSec: 50000,
      reliability: 0.98,
      lastMeasured: Date.now(),
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await supabase.from('metrics_cache').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// Historical Cold Store Data Source
// ============================================================================

export class HistoricalColdStoreSource implements IDataSource {
  readonly id = 'historical-cold-store';
  readonly type: DataSourceType = 'HISTORICAL_COLD_STORE';
  readonly name = 'Historical Events';

  async fetch(config: SourceNodeConfig): Promise<unknown[]> {
    // Fetch from ring_buffer_history for long-term storage
    const { data, error } = await supabase
      .from('ring_buffer_history')
      .select('*')
      .eq('seller_id', config.sellerId)
      .gte('timestamp', new Date(config.timeWindow.start).toISOString())
      .lte('timestamp', new Date(config.timeWindow.end).toISOString())
      .order('timestamp', { ascending: true });

    if (error) throw error;

    return data || [];
  }

  supports(capability: DataSourceCapability): boolean {
    return ['TIME_RANGE', 'FILTERING'].includes(capability);
  }

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    return {
      avgLatencyMs: 500,
      throughputPerSec: 1000,
      reliability: 0.99,
      lastMeasured: Date.now(),
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await supabase.from('ring_buffer_history').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// External Webhook Data Source
// ============================================================================

export class ExternalWebhookSource implements IDataSource {
  readonly id = 'external-webhook';
  readonly type: DataSourceType = 'EXTERNAL_WEBHOOK';
  readonly name = 'External Webhook';

  async fetch(config: SourceNodeConfig): Promise<unknown[]> {
    // This would call an external webhook endpoint
    // For now, return empty array
    return [];
  }

  supports(capability: DataSourceCapability): boolean {
    return ['FILTERING'].includes(capability);
  }

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    return {
      avgLatencyMs: 2000,
      throughputPerSec: 100,
      reliability: 0.95,
      lastMeasured: Date.now(),
    };
  }

  async healthCheck(): Promise<boolean> {
    // Would ping the external endpoint
    return true;
  }
}

// ============================================================================
// Data Source Registry
// ============================================================================

export class DataSourceRegistry {
  private sources: Map<DataSourceType, IDataSource> = new Map();

  constructor() {
    this.registerDefaultSources();
  }

  private registerDefaultSources(): void {
    this.register(new RingBufferSource());
    this.register(new AggregateStoreSource());
    this.register(new CachedMetricsSource());
    this.register(new HistoricalColdStoreSource());
    this.register(new ExternalWebhookSource());
  }

  register(source: IDataSource): void {
    this.sources.set(source.type, source);
  }

  get(type: DataSourceType): IDataSource | undefined {
    return this.sources.get(type);
  }

  getAll(): IDataSource[] {
    return Array.from(this.sources.values());
  }

  async getAvailableSources(): Promise<DataSource[]> {
    const { data } = await supabase
      .from('data_source_registry')
      .select('*')
      .eq('enabled', true);

    return (data || []).map((d) => ({
      id: d.id,
      type: d.source_type,
      name: d.name,
      description: d.description,
      config: d.config,
      capabilities: {
        supportsTimeRange: d.supports_time_range,
        supportsFiltering: d.supports_filtering,
        supportsAggregation: d.supports_aggregation,
        supportsJoin: d.supports_join,
      },
      performance: {
        avgLatencyMs: d.avg_latency_ms,
        throughputPerSec: d.throughput_per_sec,
        reliability: d.reliability,
      },
      enabled: d.enabled,
      lastHealthCheck: d.last_health_check ? new Date(d.last_health_check).getTime() : undefined,
    }));
  }

  async updateHealthStatus(sourceId: string, healthy: boolean): Promise<void> {
    await supabase
      .from('data_source_registry')
      .update({
        health_status: healthy ? 'healthy' : 'unhealthy',
        last_health_check: new Date().toISOString(),
      })
      .eq('id', sourceId);
  }
}

// ============================================================================
// Federated Query Executor
// ============================================================================

export class FederatedQueryExecutor {
  private registry: DataSourceRegistry;

  constructor() {
    this.registry = new DataSourceRegistry();
  }

  /**
   * Execute query across multiple data sources
   */
  async executeFederated(
    configs: SourceNodeConfig[],
    mergeStrategy: 'union' | 'join' = 'union'
  ): Promise<unknown[]> {
    const results = await Promise.allSettled(
      configs.map((config) => this.fetchFromSource(config))
    );

    const successfulResults = results
      .filter((r): r is PromiseFulfilledResult<unknown[]> => r.status === 'fulfilled')
      .map((r) => r.value);

    if (successfulResults.length === 0) {
      throw new Error('All data sources failed');
    }

    // Merge results based on strategy
    if (mergeStrategy === 'union') {
      return successfulResults.flat();
    }

    // For join, would need more complex logic
    return successfulResults[0];
  }

  /**
   * Execute with partial results support
   */
  async executeWithPartialResults(
    configs: SourceNodeConfig[],
    minSourcesRequired: number = 1
  ): Promise<{ data: unknown[]; sourcesSucceeded: number; sourcesFailed: number }> {
    const results = await Promise.allSettled(
      configs.map((config) => this.fetchFromSource(config))
    );

    const successful = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');

    if (successful.length < minSourcesRequired) {
      throw new Error(
        `Insufficient data sources: ${successful.length}/${minSourcesRequired} required`
      );
    }

    const data = successful
      .filter((r): r is PromiseFulfilledResult<unknown[]> => r.status === 'fulfilled')
      .map((r) => r.value)
      .flat();

    return {
      data,
      sourcesSucceeded: successful.length,
      sourcesFailed: failed.length,
    };
  }

  private async fetchFromSource(config: SourceNodeConfig): Promise<unknown[]> {
    const source = this.registry.get(config.sourceType);
    if (!source) {
      throw new Error(`Data source not found: ${config.sourceType}`);
    }

    return source.fetch(config);
  }

  getRegistry(): DataSourceRegistry {
    return this.registry;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const dataSourceRegistry = new DataSourceRegistry();
export const federatedExecutor = new FederatedQueryExecutor();

export async function fetchFromSource(config: SourceNodeConfig): Promise<unknown[]> {
  const source = dataSourceRegistry.get(config.sourceType);
  if (!source) {
    throw new Error(`Data source not found: ${config.sourceType}`);
  }

  return source.fetch(config);
}

export async function getAvailableDataSources(): Promise<DataSource[]> {
  return dataSourceRegistry.getAvailableSources();
}

export async function executeFederatedQuery(
  configs: SourceNodeConfig[],
  mergeStrategy: 'union' | 'join' = 'union'
): Promise<unknown[]> {
  return federatedExecutor.executeFederated(configs, mergeStrategy);
}
