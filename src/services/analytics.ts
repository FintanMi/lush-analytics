import { supabase } from '@/db/supabase';
import type {
  Seller,
  Event,
  EventInput,
  AnomalyResponse,
  PredictionResponse,
} from '@/types/analytics';

export const analyticsApi = {
  async getSellers(): Promise<Seller[]> {
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async createSeller(name: string, email?: string): Promise<Seller> {
    const { data, error } = await supabase
      .from('sellers')
      .insert([{ name, email: email || null }] as any)
      .select()
      .single();

    if (error) throw error;
    return data;
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

  async getAnomalyScore(
    sellerId: string,
    type: 'SALE' | 'CLICK' | 'VIEW' = 'SALE'
  ): Promise<AnomalyResponse> {
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

    return data;
  },

  async getPredictions(
    sellerId: string,
    type: 'SALE' | 'CLICK' | 'VIEW' = 'SALE',
    steps = 10
  ): Promise<PredictionResponse> {
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
};
