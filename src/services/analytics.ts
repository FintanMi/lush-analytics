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
    type: 'SALE' | 'CLICK' | 'VIEW' = 'SALE'
  ): Promise<AnomalyResponse> {
    const cacheKey = `anomaly-${sellerId}-${type}`;
    const cached = getCached<AnomalyResponse>(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase.functions.invoke(
      `anomaly-detection?sellerId=${sellerId}&type=${type}`,
      { method: 'GET' }
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
    steps = 10
  ): Promise<PredictionResponse> {
    const cacheKey = `predictions-${sellerId}-${type}-${steps}`;
    const cached = getCached<PredictionResponse>(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase.functions.invoke(
      `predictions?sellerId=${sellerId}&type=${type}&steps=${steps}`,
      { method: 'GET' }
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
