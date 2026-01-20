import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { events } = await req.json();

    if (!events || !Array.isArray(events) || events.length === 0) {
      return new Response(
        JSON.stringify({ error: 'events array is required and must not be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (events.length > 1000) {
      return new Response(
        JSON.stringify({ error: 'Maximum 1000 events per batch' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validatedEvents = events.map((event, index) => {
      if (!event.sellerId || !event.timestamp || !event.type || event.value === undefined) {
        throw new Error(`Event at index ${index} is missing required fields`);
      }

      if (!['SALE', 'CLICK', 'VIEW'].includes(event.type)) {
        throw new Error(`Event at index ${index} has invalid type: ${event.type}`);
      }

      return {
        seller_id: event.sellerId,
        timestamp: event.timestamp,
        type: event.type,
        value: event.value,
      };
    });

    const { data, error } = await supabaseClient
      .from('events')
      .insert(validatedEvents)
      .select();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to insert events', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        inserted: data.length,
        events: data 
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
