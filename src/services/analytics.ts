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
  ConfigVersion,
  ConfigSnapshot,
  InsightLifecycle,
  EmbedKey,
  SystemInvariant,
  RetentionPolicy,
  SignalQuality,
  DegeneratePattern,
  SystemicAnomaly,
  SignalQualityRule,
  WebhookRegistration,
  WebhookEventType,
  WebhookPayload,
  WebhookDelivery,
  WebhookDeadLetter,
  WebhookTestResult,
  FunnelTemplate,
  FunnelConfig,
  FunnelStep,
  FunnelResult,
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
    const current = sellerData?.api_calls_count ?? 0;
    const limit = sellerData?.api_calls_limit ?? 1000;

    return {
      current,
      limit,
      remaining: Math.max(0, limit - current),
      resetAt: Date.now() + 3600000,
      tier: (sellerData?.pricing_tier as 'free' | 'basic' | 'pro' | 'enterprise') ?? 'free',
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

  async createConfigSnapshot(type: 'weekly_report' | 'export' | 'audit', referenceId?: string): Promise<ConfigSnapshot> {
    const [tierConfigs, alertConfigs, thresholds] = await Promise.all([
      supabase.from('tier_config').select('*'),
      supabase.from('alert_config').select('*'),
      analyticsApi.getThresholds(),
    ]);

    const { data, error } = await supabase
      .from('config_snapshots')
      .insert([{
        snapshot_type: type,
        reference_id: referenceId || null,
        tier_config: tierConfigs.data || {},
        alert_config: alertConfigs.data || {},
        threshold_config: thresholds,
      } as never])
      .select()
      .single();

    if (error) throw error;
    return data as ConfigSnapshot;
  },

  async trackConfigChange(
    tableName: string,
    recordId: string,
    configData: Record<string, unknown>,
    changedBy?: string,
    changeReason?: string
  ): Promise<ConfigVersion> {
    // Mark previous version as ended
    await supabase
      .from('config_versions')
      .update({ effective_until: new Date().toISOString() } as never)
      .eq('table_name', tableName)
      .eq('record_id', recordId)
      .is('effective_until', null);

    // Create new version
    const { data, error } = await supabase
      .from('config_versions')
      .insert([{
        table_name: tableName,
        record_id: recordId,
        config_data: configData,
        effective_since: new Date().toISOString(),
        changed_by: changedBy || null,
        change_reason: changeReason || null,
      } as never])
      .select()
      .single();

    if (error) throw error;
    return data as ConfigVersion;
  },

  async createInsightLifecycle(
    insightId: string,
    sellerId: string,
    insightData: Record<string, unknown>,
    dataSufficiency: string,
    confidenceScore: number
  ): Promise<InsightLifecycle> {
    const { data, error } = await supabase
      .from('insight_lifecycle')
      .insert([{
        insight_id: insightId,
        seller_id: sellerId,
        insight_data: insightData,
        state: 'generated',
        data_sufficiency: dataSufficiency,
        confidence_score: confidenceScore,
      } as never])
      .select()
      .single();

    if (error) throw error;
    return data as InsightLifecycle;
  },

  async updateInsightState(
    insightId: string,
    newState: 'confirmed' | 'expired' | 'superseded',
    supersededBy?: string
  ): Promise<InsightLifecycle> {
    const updates: Record<string, unknown> = { state: newState };
    
    if (newState === 'confirmed') {
      updates.confirmed_at = new Date().toISOString();
    } else if (newState === 'expired') {
      updates.expired_at = new Date().toISOString();
    } else if (newState === 'superseded' && supersededBy) {
      updates.superseded_by = supersededBy;
      updates.superseded_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('insight_lifecycle')
      .update(updates as never)
      .eq('insight_id', insightId)
      .select()
      .single();

    if (error) throw error;
    return data as InsightLifecycle;
  },

  async createEmbedKey(
    sellerId: string,
    widgetType: 'anomaly' | 'health' | 'prediction' | 'all',
    rateLimitPerHour?: number
  ): Promise<{ key: string; embedKey: EmbedKey }> {
    // Generate random key
    const key = `emb_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    const keyHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key))
      .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''));

    const { data, error } = await supabase
      .from('embed_keys')
      .insert([{
        seller_id: sellerId,
        key_hash: keyHash,
        key_prefix: key.substring(0, 8),
        widget_type: widgetType,
        rate_limit_per_hour: rateLimitPerHour || 100,
        scopes: ['read'],
      } as never])
      .select()
      .single();

    if (error) throw error;
    return { key, embedKey: data as EmbedKey };
  },

  async getSystemInvariants(): Promise<SystemInvariant[]> {
    const { data, error } = await supabase
      .from('system_invariants')
      .select('*')
      .order('category', { ascending: true });

    if (error) throw error;
    return Array.isArray(data) ? data as SystemInvariant[] : [];
  },

  async getRetentionPolicies(tier?: string): Promise<RetentionPolicy[]> {
    let query = supabase.from('retention_policies').select('*');
    
    if (tier) {
      query = query.eq('tier', tier);
    }

    const { data, error } = await query;

    if (error) throw error;
    return Array.isArray(data) ? data as RetentionPolicy[] : [];
  },

  async getSignalQuality(sellerId: string, metricType: 'SALE' | 'CLICK' | 'VIEW'): Promise<SignalQuality | null> {
    const { data, error } = await supabase
      .from('signal_quality')
      .select('*')
      .eq('seller_id', sellerId)
      .eq('metric_type', metricType)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as SignalQuality | null;
  },

  async getDegeneratePatterns(sellerId: string, unresolved = true): Promise<DegeneratePattern[]> {
    let query = supabase
      .from('degenerate_patterns')
      .select('*')
      .eq('seller_id', sellerId);

    if (unresolved) {
      query = query.is('resolved_at', null);
    }

    const { data, error } = await query.order('detected_at', { ascending: false });

    if (error) throw error;
    return Array.isArray(data) ? data as DegeneratePattern[] : [];
  },

  async getSystemicAnomalies(severity?: 'info' | 'warning' | 'critical'): Promise<SystemicAnomaly[]> {
    let query = supabase
      .from('systemic_anomalies')
      .select('*')
      .is('resolved_at', null);

    if (severity) {
      query = query.eq('severity', severity);
    }

    const { data, error } = await query.order('detected_at', { ascending: false });

    if (error) throw error;
    return Array.isArray(data) ? data as SystemicAnomaly[] : [];
  },

  async getSignalQualityRules(): Promise<SignalQualityRule[]> {
    const { data, error } = await supabase
      .from('signal_quality_rules')
      .select('*')
      .eq('enabled', true)
      .order('confidence_impact', { ascending: false });

    if (error) throw error;
    return Array.isArray(data) ? data as SignalQualityRule[] : [];
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

  // Webhook Management
  async getWebhooks(sellerId: string): Promise<WebhookRegistration[]> {
    const { data, error } = await supabase
      .from('webhook_registrations')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return Array.isArray(data) ? data as WebhookRegistration[] : [];
  },

  async createWebhook(
    sellerId: string,
    url: string,
    eventTypes: WebhookEventType[],
    metadata?: Record<string, unknown>
  ): Promise<WebhookRegistration> {
    // Generate secret for HMAC
    const secret = `whsec_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

    const { data, error } = await supabase
      .from('webhook_registrations')
      .insert([{
        seller_id: sellerId,
        url,
        event_types: eventTypes,
        secret,
        enabled: true,
        metadata: metadata || {},
      } as never])
      .select()
      .single();

    if (error) throw error;
    return data as WebhookRegistration;
  },

  async updateWebhook(
    webhookId: string,
    updates: Partial<Pick<WebhookRegistration, 'url' | 'event_types' | 'enabled' | 'metadata'>>
  ): Promise<WebhookRegistration> {
    const { data, error } = await supabase
      .from('webhook_registrations')
      .update(updates as never)
      .eq('id', webhookId)
      .select()
      .single();

    if (error) throw error;
    return data as WebhookRegistration;
  },

  async deleteWebhook(webhookId: string): Promise<void> {
    const { error } = await supabase
      .from('webhook_registrations')
      .delete()
      .eq('id', webhookId);

    if (error) throw error;
  },

  async testWebhook(webhookId: string): Promise<WebhookTestResult> {
    const startTime = Date.now();
    
    try {
      const { data: webhook } = await supabase
        .from('webhook_registrations')
        .select('*')
        .eq('id', webhookId)
        .single();

      if (!webhook) {
        throw new Error('Webhook not found');
      }

      const webhookData = webhook as unknown as WebhookRegistration;

      // Send test payload
      const testPayload: WebhookPayload = {
        event_type: 'alert_triggered',
        seller_id: webhookData.seller_id,
        timestamp: Date.now(),
        data: { test: true, message: 'This is a test webhook delivery' },
        reproducibility_hash: 'test_hash',
        config_version: 'test_v1',
        time_window: { start: Date.now() - 3600000, end: Date.now() },
        data_sufficiency: 'sufficient',
        signal_quality: 0.95,
      };

      const { data, error } = await supabase.functions.invoke('webhook-delivery', {
        body: {
          webhook_id: webhookId,
          event_type: 'alert_triggered',
          payload: testPayload,
        },
      });

      const responseTime = Date.now() - startTime;

      if (error) {
        return {
          success: false,
          response_time_ms: responseTime,
          error: error.message,
        };
      }

      return {
        success: data.success,
        status_code: 200,
        response_time_ms: responseTime,
      };
    } catch (error) {
      return {
        success: false,
        response_time_ms: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async getWebhookDeliveries(webhookId: string, limit = 50): Promise<WebhookDelivery[]> {
    const { data, error } = await supabase
      .from('webhook_deliveries')
      .select('*')
      .eq('webhook_id', webhookId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return Array.isArray(data) ? data as WebhookDelivery[] : [];
  },

  async getWebhookDeadLetters(webhookId: string): Promise<WebhookDeadLetter[]> {
    const { data, error } = await supabase
      .from('webhook_dead_letter')
      .select('*')
      .eq('webhook_id', webhookId)
      .is('resolved_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return Array.isArray(data) ? data as WebhookDeadLetter[] : [];
  },

  async retryWebhookDelivery(deliveryId: string): Promise<{ success: boolean }> {
    const { data: delivery } = await supabase
      .from('webhook_deliveries')
      .select('*')
      .eq('id', deliveryId)
      .single();

    if (!delivery) {
      throw new Error('Delivery not found');
    }

    const deliveryData = delivery as unknown as WebhookDelivery;

    const { data, error } = await supabase.functions.invoke('webhook-delivery', {
      body: {
        webhook_id: deliveryData.webhook_id,
        event_type: deliveryData.event_type,
        payload: deliveryData.payload,
      },
    });

    if (error) throw error;
    return { success: data.success };
  },

  // Funnel Analysis
  async getFunnelTemplates(tier?: string): Promise<FunnelTemplate[]> {
    let query = supabase.from('funnel_templates').select('*');
    
    if (tier) {
      query = query.eq('tier', tier);
    }

    const { data, error } = await query.order('tier', { ascending: true });

    if (error) throw error;
    return Array.isArray(data) ? data as FunnelTemplate[] : [];
  },

  async getFunnelConfigs(sellerId: string): Promise<FunnelConfig[]> {
    const { data, error } = await supabase
      .from('funnel_configs')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return Array.isArray(data) ? data as FunnelConfig[] : [];
  },

  async createFunnelConfig(
    sellerId: string,
    templateId: string,
    name: string,
    windowHours?: number,
    customSteps?: FunnelStep[]
  ): Promise<FunnelConfig> {
    const { data, error } = await supabase
      .from('funnel_configs')
      .insert([{
        seller_id: sellerId,
        template_id: templateId,
        name,
        enabled: true,
        custom_steps: customSteps || null,
        window_hours: windowHours || 24,
      } as never])
      .select()
      .single();

    if (error) throw error;
    return data as FunnelConfig;
  },

  async updateFunnelConfig(
    funnelConfigId: string,
    updates: Partial<Pick<FunnelConfig, 'name' | 'enabled' | 'custom_steps' | 'window_hours'>>
  ): Promise<FunnelConfig> {
    const { data, error } = await supabase
      .from('funnel_configs')
      .update(updates as never)
      .eq('id', funnelConfigId)
      .select()
      .single();

    if (error) throw error;
    return data as FunnelConfig;
  },

  async deleteFunnelConfig(funnelConfigId: string): Promise<void> {
    const { error } = await supabase
      .from('funnel_configs')
      .delete()
      .eq('id', funnelConfigId);

    if (error) throw error;
  },

  async analyzeFunnel(
    funnelConfigId: string,
    windowHours?: number,
    forceRecompute?: boolean
  ): Promise<FunnelResult> {
    const { data, error } = await supabase.functions.invoke(
      `funnel-analysis?funnelConfigId=${funnelConfigId}&windowHours=${windowHours || 24}&forceRecompute=${forceRecompute || false}`,
      { method: 'GET' }
    );

    if (error) {
      console.error('Funnel analysis error:', error);
      throw new Error('Failed to analyze funnel');
    }

    return data as FunnelResult;
  },

  async getFunnelResults(funnelConfigId: string, limit = 10): Promise<FunnelResult[]> {
    const { data, error } = await supabase
      .from('funnel_results')
      .select('*')
      .eq('funnel_config_id', funnelConfigId)
      .order('computed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return Array.isArray(data) ? data as FunnelResult[] : [];
  },
};
