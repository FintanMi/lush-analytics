import { createClient } from 'jsr:@supabase/supabase-js@2';
import { createHash } from 'node:crypto';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FunnelAnalysisRequest {
  funnel_config_id: string;
  window_hours?: number;
  force_recompute?: boolean;
}

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

    const url = new URL(req.url);
    const funnelConfigId = url.searchParams.get('funnelConfigId');
    const windowHours = parseInt(url.searchParams.get('windowHours') || '24');
    const forceRecompute = url.searchParams.get('forceRecompute') === 'true';

    if (!funnelConfigId) {
      return new Response(
        JSON.stringify({ error: 'funnelConfigId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch funnel config
    const { data: funnelConfig, error: configError } = await supabaseClient
      .from('funnel_configs')
      .select('*, funnel_templates(*)')
      .eq('id', funnelConfigId)
      .eq('enabled', true)
      .single();

    if (configError || !funnelConfig) {
      return new Response(
        JSON.stringify({ error: 'Funnel config not found or disabled' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const template = funnelConfig.funnel_templates;
    const steps = funnelConfig.custom_steps || template.steps;

    // Define time window
    const windowEnd = Date.now();
    const windowStart = windowEnd - (windowHours * 60 * 60 * 1000);

    // Check for cached result
    if (!forceRecompute) {
      const { data: cachedResult } = await supabaseClient
        .from('funnel_results')
        .select('*')
        .eq('funnel_config_id', funnelConfigId)
        .gte('window_start', new Date(windowStart).toISOString())
        .lte('window_end', new Date(windowEnd).toISOString())
        .order('computed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cachedResult) {
        return new Response(
          JSON.stringify({ 
            ...cachedResult,
            cached: true,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fetch events for the seller in the time window
    const { data: events, error: eventsError } = await supabaseClient
      .from('events')
      .select('*')
      .eq('seller_id', funnelConfig.seller_id)
      .gte('timestamp', windowStart)
      .lte('timestamp', windowEnd)
      .order('timestamp', { ascending: true });

    if (eventsError) {
      throw eventsError;
    }

    if (!events || events.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No events found in time window',
          data_sufficiency: 'insufficient',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Compute funnel metrics
    const stepResults: Array<{
      step: number;
      type: string;
      label: string;
      count: number;
      dropoff: number;
      dropoff_rate: number;
      sufficiency: string;
      avg_time_from_previous_ms: number | null;
    }> = [];

    const dropOffAttribution: Array<{
      from_step: number;
      to_step: number;
      count: number;
      rate: number;
      reasons: Array<{ reason: string; contribution: number }>;
    }> = [];

    // Track user journeys (group by some identifier - using timestamp proximity as proxy)
    const journeys: Map<string, Array<{ step: number; timestamp: number; type: string }>> = new Map();

    // Build journeys - events within max_step_timeout_ms are considered part of same journey
    const maxTimeout = template.max_step_timeout_ms;
    let currentJourneyId = 0;

    for (const event of events) {
      const stepIndex = steps.findIndex((s: { type: string }) => s.type === event.type);
      if (stepIndex === -1) continue;

      // Find or create journey
      let assignedJourney: string | null = null;
      for (const [journeyId, journey] of journeys.entries()) {
        const lastEvent = journey[journey.length - 1];
        if (
          event.timestamp - lastEvent.timestamp <= maxTimeout &&
          stepIndex > lastEvent.step
        ) {
          assignedJourney = journeyId;
          break;
        }
      }

      if (!assignedJourney) {
        assignedJourney = `journey_${currentJourneyId++}`;
        journeys.set(assignedJourney, []);
      }

      journeys.get(assignedJourney)!.push({
        step: stepIndex,
        timestamp: event.timestamp,
        type: event.type,
      });
    }

    // Compute step results
    let previousCount = 0;
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const journeysReachingStep = Array.from(journeys.values()).filter(
        journey => journey.some(e => e.step === i)
      );
      const count = journeysReachingStep.length;

      const dropoff = i === 0 ? 0 : previousCount - count;
      const dropoffRate = i === 0 ? 0 : previousCount > 0 ? dropoff / previousCount : 0;

      // Calculate avg time from previous step
      let avgTime: number | null = null;
      if (i > 0) {
        const times: number[] = [];
        for (const journey of journeysReachingStep) {
          const currentEvent = journey.find(e => e.step === i);
          const previousEvent = journey.find(e => e.step === i - 1);
          if (currentEvent && previousEvent) {
            times.push(currentEvent.timestamp - previousEvent.timestamp);
          }
        }
        if (times.length > 0) {
          avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        }
      }

      // Determine sufficiency
      let sufficiency = 'insufficient';
      if (count >= template.min_data_points * 2) sufficiency = 'high';
      else if (count >= template.min_data_points) sufficiency = 'sufficient';
      else if (count >= template.min_data_points / 2) sufficiency = 'minimal';

      stepResults.push({
        step: i + 1,
        type: step.type,
        label: step.label,
        count,
        dropoff,
        dropoff_rate: dropoffRate,
        sufficiency,
        avg_time_from_previous_ms: avgTime,
      });

      // Track drop-off attribution
      if (i > 0 && dropoff > 0) {
        dropOffAttribution.push({
          from_step: i,
          to_step: i + 1,
          count: dropoff,
          rate: dropoffRate,
          reasons: [
            { reason: 'timeout', contribution: 0.4 },
            { reason: 'abandonment', contribution: 0.6 },
          ],
        });
      }

      previousCount = count;
    }

    // Calculate overall metrics
    const totalEntries = stepResults[0]?.count || 0;
    const dataSufficiency = totalEntries >= template.min_data_points * 2 ? 'high' :
                            totalEntries >= template.min_data_points ? 'sufficient' :
                            totalEntries >= template.min_data_points / 2 ? 'minimal' : 'insufficient';
    const confidence = totalEntries >= template.min_data_points ? 0.9 : 
                       totalEntries >= template.min_data_points / 2 ? 0.7 : 0.5;

    // Generate reproducibility hash
    const hashInput = JSON.stringify({
      funnel_config_id: funnelConfigId,
      window_start: windowStart,
      window_end: windowEnd,
      steps,
      event_count: events.length,
    });
    const reproducibilityHash = createHash('sha256').update(hashInput).digest('hex');

    // Get config version
    const configVersion = `v1_${new Date().toISOString().split('T')[0]}`;

    // Store result
    const { data: result, error: resultError } = await supabaseClient
      .from('funnel_results')
      .insert({
        funnel_config_id: funnelConfigId,
        seller_id: funnelConfig.seller_id,
        window_start: new Date(windowStart).toISOString(),
        window_end: new Date(windowEnd).toISOString(),
        total_entries: totalEntries,
        step_results: stepResults,
        drop_off_attribution: dropOffAttribution,
        confidence,
        data_sufficiency: dataSufficiency,
        reproducibility_hash: reproducibilityHash,
        config_version: configVersion,
      })
      .select()
      .single();

    if (resultError) {
      throw resultError;
    }

    return new Response(
      JSON.stringify({ 
        ...result,
        cached: false,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Funnel analysis error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
