import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookDeliveryRequest {
  webhook_id: string;
  event_type: string;
  payload: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { webhook_id, event_type, payload } = await req.json() as WebhookDeliveryRequest;

    // Fetch webhook registration
    const { data: webhook, error: webhookError } = await supabaseClient
      .from('webhook_registrations')
      .select('*')
      .eq('id', webhook_id)
      .eq('enabled', true)
      .single();

    if (webhookError || !webhook) {
      return new Response(
        JSON.stringify({ error: 'Webhook not found or disabled' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify event type is registered
    if (!webhook.event_types.includes(event_type)) {
      return new Response(
        JSON.stringify({ error: 'Event type not registered for this webhook' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create delivery record
    const { data: delivery, error: deliveryError } = await supabaseClient
      .from('webhook_deliveries')
      .insert({
        webhook_id,
        event_type,
        payload,
        reproducibility_hash: payload.reproducibility_hash,
        config_version: payload.config_version,
        time_window: payload.time_window,
        data_sufficiency: payload.data_sufficiency,
        signal_quality: payload.signal_quality,
        status: 'pending',
        attempts: 0,
      })
      .select()
      .single();

    if (deliveryError) {
      throw deliveryError;
    }

    // Attempt delivery with retry logic
    const retryConfig = webhook.retry_config || { maxRetries: 3, backoffMs: [1000, 5000, 15000] };
    let lastError = '';
    let lastStatusCode = 0;
    let lastResponseBody = '';

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        // Generate HMAC signature
        const secret = webhook.secret;
        const payloadString = JSON.stringify(payload);
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secret);
        const messageData = encoder.encode(payloadString);
        
        const cryptoKey = await crypto.subtle.importKey(
          'raw',
          keyData,
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        
        const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
        const signatureHex = Array.from(new Uint8Array(signature))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        // Deliver webhook
        const deliveryResponse = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signatureHex,
            'X-Webhook-Event': event_type,
            'X-Webhook-Delivery-Id': delivery.id,
          },
          body: payloadString,
          signal: AbortSignal.timeout(10000), // 10s timeout
        });

        lastStatusCode = deliveryResponse.status;
        lastResponseBody = await deliveryResponse.text();

        if (deliveryResponse.ok) {
          // Success - update delivery record
          await supabaseClient
            .from('webhook_deliveries')
            .update({
              status: 'success',
              attempts: attempt + 1,
              last_attempt_at: new Date().toISOString(),
              response_code: lastStatusCode,
              response_body: lastResponseBody.substring(0, 1000),
              delivered_at: new Date().toISOString(),
            })
            .eq('id', delivery.id);

          return new Response(
            JSON.stringify({ 
              success: true, 
              delivery_id: delivery.id,
              attempts: attempt + 1,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        lastError = `HTTP ${lastStatusCode}: ${lastResponseBody}`;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }

      // Update attempt count
      await supabaseClient
        .from('webhook_deliveries')
        .update({
          attempts: attempt + 1,
          last_attempt_at: new Date().toISOString(),
          error_message: lastError,
        })
        .eq('id', delivery.id);

      // Wait before retry (if not last attempt)
      if (attempt < retryConfig.maxRetries) {
        const backoffMs = retryConfig.backoffMs[attempt] || 5000;
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }

    // All retries failed - move to dead letter queue
    await supabaseClient
      .from('webhook_deliveries')
      .update({
        status: 'dead_letter',
        error_message: lastError,
        response_code: lastStatusCode,
        response_body: lastResponseBody.substring(0, 1000),
      })
      .eq('id', delivery.id);

    await supabaseClient
      .from('webhook_dead_letter')
      .insert({
        delivery_id: delivery.id,
        webhook_id,
        event_type,
        payload,
        final_error: lastError,
        attempts: retryConfig.maxRetries + 1,
      });

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'All delivery attempts failed',
        delivery_id: delivery.id,
        moved_to_dead_letter: true,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook delivery error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
