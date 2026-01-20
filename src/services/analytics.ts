import { supabase } from '@/db/supabase';
import type {
  Seller,
  Event,
  EventInput,
  BatchEventInput,
  AnomalyResponse,
  PredictionResponse,
  AutoInsight,
  SellerHealthScore,
  BehaviorFingerprint,
  PredictiveAlert,
  DecisionHook,
  WeeklyReport,
  RateLimitStatus,
  TierConfig,
  AlertConfig,
  ExportRequest,
  ExportHistory,
  InsightSummary,
} from '@/types/analytics';

const CACHE_DURATION = 30000;
const cache = new Map<string, { data: unknown; timestamp: number }>();

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export const analyticsApi = {
  async getSellers(): Promise<Seller[]> {
    const cached = getCached<Seller[]>('sellers');
    if (cached) return cached;

    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    const result = Array.isArray(data) ? data : [];
    setCache('sellers', result);
    return result;
  },

  async createSeller(name: string, email?: string): Promise<Seller> {
    const { data, error } = await supabase
      .from('sellers')
      .insert([{ name, email: email || null } as never])
      .select()
      .single();

    if (error) throw error;
    cache.delete('sellers');
    return data as Seller;
  },

  async getEvents(sellerId: string, type?: string, limit = 100): Promise<Event[]> {
    let query = supabase
      .from('events')
      .select('*')
      .eq('seller_id', sellerId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async ingestEvent(event: EventInput): Promise<{ success: boolean; event: Event }> {
    const { data, error } = await supabase.functions.invoke('event-ingestion', {
      body: event,
      method: 'POST',
    });

    if (error) {
      console.error('Event ingestion error:', error);
      throw new Error(error.message || 'Failed to ingest event');
    }

    return data;
  },

  async batchIngestEvents(events: EventInput[]): Promise<{ success: boolean; inserted: number }> {
    const { data, error } = await supabase.functions.invoke('batch-ingestion', {
      body: { events },
      method: 'POST',
    });

    if (error) {
      console.error('Batch ingestion error:', error);
      throw new Error(error.message || 'Failed to ingest events');
    }

    return data;
  },

  async getAnomalyScore(
    sellerId: string,
    type: 'SALE' | 'CLICK' | 'VIEW' = 'SALE',
    apiKey?: string
  ): Promise<AnomalyResponse> {
    const cacheKey = `anomaly-${sellerId}-${type}`;
    const cached = getCached<AnomalyResponse>(cacheKey);
    if (cached) return cached;

    const headers: Record<string, string> = {};
    if (apiKey) headers['x-api-key'] = apiKey;

    const { data, error } = await supabase.functions.invoke(
      `anomaly-detection?sellerId=${sellerId}&type=${type}`,
      { method: 'GET', headers }
    );

    if (error) {
      console.error('Anomaly detection error:', error);
      if (error.context) {
        const text = await error.context.text();
        console.error('Error details:', text);
      }
      throw new Error('Failed to get anomaly score');
    }

    setCache(cacheKey, data);
    return data;
  },

  async getPredictions(
    sellerId: string,
    type: 'SALE' | 'CLICK' | 'VIEW' = 'SALE',
    steps = 10,
    apiKey?: string
  ): Promise<PredictionResponse> {
    const cacheKey = `predictions-${sellerId}-${type}-${steps}`;
    const cached = getCached<PredictionResponse>(cacheKey);
    if (cached) return cached;

    const headers: Record<string, string> = {};
    if (apiKey) headers['x-api-key'] = apiKey;

    const { data, error } = await supabase.functions.invoke(
      `predictions?sellerId=${sellerId}&type=${type}&steps=${steps}`,
      { method: 'GET', headers }
    );

    if (error) {
      console.error('Predictions error:', error);
      if (error.context) {
        const text = await error.context.text();
        console.error('Error details:', text);
      }
      throw new Error('Failed to get predictions');
    }

    setCache(cacheKey, data);
    return data;
  },

  async getInsights(
    sellerId: string,
    type: 'SALE' | 'CLICK' | 'VIEW' = 'SALE'
  ): Promise<{
    insights: AutoInsight[];
    healthScore: SellerHealthScore;
    fingerprint: BehaviorFingerprint;
    alerts: PredictiveAlert[];
  }> {
    const cacheKey = `insights-${sellerId}-${type}`;
    const cached = getCached<{
      insights: AutoInsight[];
      healthScore: SellerHealthScore;
      fingerprint: BehaviorFingerprint;
      alerts: PredictiveAlert[];
    }>(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase.functions.invoke(
      `insights-engine?sellerId=${sellerId}&type=${type}`,
      { method: 'GET' }
    );

    if (error) {
      console.error('Insights error:', error);
      throw new Error('Failed to get insights');
    }

    setCache(cacheKey, data);
    return data;
  },

  async getRecentEvents(sellerId: string, hours = 24): Promise<Event[]> {
    const cutoffTime = Date.now() - hours * 60 * 60 * 1000;
    
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('seller_id', sellerId)
      .gte('timestamp', cutoffTime)
      .order('timestamp', { ascending: true });

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async getDecisionHooks(sellerId: string): Promise<DecisionHook[]> {
    const { data, error } = await supabase
      .from('decision_hooks')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async createDecisionHook(hook: Omit<DecisionHook, 'id' | 'created_at'>): Promise<DecisionHook> {
    const { data, error } = await supabase
      .from('decision_hooks')
      .insert([hook as never])
      .select()
      .single();

    if (error) throw error;
    return data as DecisionHook;
  },

  async updateDecisionHook(id: string, updates: Partial<DecisionHook>): Promise<DecisionHook> {
    const { data, error } = await supabase
      .from('decision_hooks')
      .update(updates as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as DecisionHook;
  },

  async deleteDecisionHook(id: string): Promise<void> {
    const { error } = await supabase
      .from('decision_hooks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getWeeklyReports(sellerId: string, limit = 10): Promise<WeeklyReport[]> {
    const { data, error } = await supabase
      .from('weekly_reports')
      .select('*')
      .eq('seller_id', sellerId)
      .order('week_start', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async getRateLimitStatus(sellerId: string): Promise<RateLimitStatus> {
    const { data, error } = await supabase
      .from('sellers')
      .select('api_calls_count, api_calls_limit, pricing_tier')
      .eq('id', sellerId)
      .single();

    if (error) throw error;

    const sellerData = data as unknown as { api_calls_count: number | null; api_calls_limit: number | null; pricing_tier: string | null };
    const current = sellerData.api_calls_count || 0;
    const limit = sellerData.api_calls_limit || 1000;

    return {
      current,
      limit,
      remaining: Math.max(0, limit - current),
      resetAt: Date.now() + 3600000,
      tier: (sellerData.pricing_tier as 'free' | 'basic' | 'pro' | 'enterprise') || 'free',
    };
  },

  async getTierConfig(tier: string): Promise<TierConfig | null> {
    const { data, error } = await supabase
      .from('tier_config')
      .select('*')
      .eq('tier', tier)
      .single();

    if (error) return null;
    return data as unknown as TierConfig;
  },

  async getAlertConfigs(): Promise<AlertConfig[]> {
    const { data, error } = await supabase
      .from('alert_config')
      .select('*')
      .eq('enabled', true);

    if (error) throw error;
    return Array.isArray(data) ? data as unknown as AlertConfig[] : [];
  },

  async getThresholds(): Promise<Record<string, number>> {
    const { data, error } = await supabase
      .from('threshold_config')
      .select('key, value');

    if (error) throw error;
    
    const thresholds: Record<string, number> = {};
    if (Array.isArray(data)) {
      for (const item of data) {
        const typedItem = item as { key: string; value: number };
        thresholds[typedItem.key] = Number(typedItem.value);
      }
    }
    return thresholds;
  },

  async createExport(request: ExportRequest): Promise<ExportHistory> {
    const { data, error } = await supabase
      .from('export_history')
      .insert([{
        seller_id: request.sellerId,
        export_type: request.exportType,
        format: request.format,
        status: 'pending',
        metadata: request.metadata || {}
      } as never])
      .select()
      .single();

    if (error) throw error;
    return data as ExportHistory;
  },

  async getExportHistory(sellerId: string, limit = 10): Promise<ExportHistory[]> {
    const { data, error } = await supabase
      .from('export_history')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return Array.isArray(data) ? data as ExportHistory[] : [];
  },

  async generateInsightSummary(sellerId: string, period = '24h'): Promise<InsightSummary> {
    const [insightsData, healthScore, anomaly] = await Promise.all([
      analyticsApi.getInsights(sellerId, 'SALE'),
      analyticsApi.getInsights(sellerId, 'SALE').then(d => d.healthScore),
      analyticsApi.getAnomalyScore(sellerId, 'SALE'),
    ]);

    const criticalInsights = insightsData.insights.filter(i => i.severity === 'critical' || i.severity === 'high');
    const topIssue = criticalInsights.length > 0 ? criticalInsights[0].title : 'No critical issues detected';
    
    let recommendation = 'Continue monitoring metrics.';
    if (healthScore.overall < 0.4) {
      recommendation = 'Immediate action required. Review anomalies and adjust strategy.';
    } else if (healthScore.overall < 0.6) {
      recommendation = 'Monitor closely. Consider investigating recent changes.';
    } else if (healthScore.overall < 0.8) {
      recommendation = 'Performance is good. Minor optimizations possible.';
    } else {
      recommendation = 'Excellent performance. Maintain current strategy.';
    }

    return {
      sellerId,
      period,
      overallHealth: healthScore.overall,
      anomalyCount: insightsData.insights.filter(i => i.type === 'anomaly').length,
      topIssue,
      recommendation,
      confidence: anomaly.metrics.dataPoints > 300 ? 0.9 : anomaly.metrics.dataPoints > 100 ? 0.7 : 0.5,
      dataSufficiency: anomaly.metrics.dataSufficiency,
    };
  },

  subscribeToEvents(
    sellerId: string,
    callback: (event: Event) => void
  ): { unsubscribe: () => void } {
    const channel = supabase
      .channel(`events:${sellerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events',
          filter: `seller_id=eq.${sellerId}`,
        },
        (payload) => {
          callback(payload.new as Event);
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      },
    };
  },
};
