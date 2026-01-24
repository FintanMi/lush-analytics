import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(supabaseUrl!, supabaseKey!);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UsageMetrics {
  events_this_month: number;
  webhooks_this_month: number;
  seller_accounts: number;
}

interface TierLimits {
  events_per_month: number;
  webhooks_per_month: number;
  data_retention_days: number;
  seller_accounts: number;
}

interface PricingPolicy {
  tiers: {
    free: TierLimits;
    basic: TierLimits;
    premium: TierLimits;
  };
  grace_period_days: number;
  overage_threshold: number;
}

type TierName = "free" | "basic" | "premium";

// Compute effective tier based on usage and pricing policy
function computeEffectiveTier(
  usage: UsageMetrics,
  policy: PricingPolicy,
  entitlements: any[]
): { tier: TierName; appliedRules: any } {
  // Apply entitlements to usage
  const adjustedUsage = { ...usage };
  
  for (const entitlement of entitlements) {
    if (entitlement.type === "event_bonus") {
      adjustedUsage.events_this_month = Math.max(0, adjustedUsage.events_this_month - entitlement.amount);
    } else if (entitlement.type === "webhook_bonus") {
      adjustedUsage.webhooks_this_month = Math.max(0, adjustedUsage.webhooks_this_month - entitlement.amount);
    }
  }

  const appliedRules: any = {
    original_usage: usage,
    adjusted_usage: adjustedUsage,
    entitlements_applied: entitlements.length,
    tier_evaluation: []
  };

  // Evaluate tiers from highest to lowest
  const tiers: TierName[] = ["premium", "basic", "free"];
  
  for (const tierName of tiers) {
    const limits = policy.tiers[tierName];
    const overageThreshold = policy.overage_threshold;
    
    const eventsWithinLimit = adjustedUsage.events_this_month <= limits.events_per_month * overageThreshold;
    const webhooksWithinLimit = adjustedUsage.webhooks_this_month <= limits.webhooks_per_month * overageThreshold;
    const sellersWithinLimit = adjustedUsage.seller_accounts <= limits.seller_accounts;
    
    appliedRules.tier_evaluation.push({
      tier: tierName,
      events_check: { within_limit: eventsWithinLimit, usage: adjustedUsage.events_this_month, limit: limits.events_per_month },
      webhooks_check: { within_limit: webhooksWithinLimit, usage: adjustedUsage.webhooks_this_month, limit: limits.webhooks_per_month },
      sellers_check: { within_limit: sellersWithinLimit, usage: adjustedUsage.seller_accounts, limit: limits.seller_accounts },
      qualifies: eventsWithinLimit && webhooksWithinLimit && sellersWithinLimit
    });
    
    if (eventsWithinLimit && webhooksWithinLimit && sellersWithinLimit) {
      appliedRules.selected_tier = tierName;
      appliedRules.reason = "Usage within tier limits";
      return { tier: tierName, appliedRules };
    }
  }
  
  // Default to free tier
  appliedRules.selected_tier = "free";
  appliedRules.reason = "Default tier";
  return { tier: "free", appliedRules };
}

// Get current usage metrics for a user
async function getUserUsageMetrics(userId: string): Promise<UsageMetrics> {
  const now = Date.now();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthStartMs = monthStart.getTime();

  // Count events this month
  const { count: eventsCount } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("timestamp", monthStartMs);

  // Count webhook deliveries this month
  const { count: webhooksCount } = await supabase
    .from("webhook_deliveries")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("delivered_at", monthStartMs);

  // Count seller accounts
  const { count: sellersCount } = await supabase
    .from("sellers")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  return {
    events_this_month: eventsCount || 0,
    webhooks_this_month: webhooksCount || 0,
    seller_accounts: sellersCount || 0,
  };
}

// Get active entitlements for a user
async function getActiveEntitlements(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("entitlements")
    .select("*")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

  if (error) {
    console.error("Error fetching entitlements:", error);
    return [];
  }

  return data || [];
}

// Get active pricing policy
async function getActivePricingPolicy(): Promise<{ version: string; config: PricingPolicy }> {
  const { data, error } = await supabase
    .from("pricing_policies")
    .select("*")
    .eq("is_active", true)
    .order("effective_from", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error("No active pricing policy found");
  }

  return {
    version: data.version,
    config: data.config as PricingPolicy,
  };
}

// Main reconciliation logic
async function reconcileTier(userId: string, source: "scheduled" | "admin_reconcile", triggeredBy?: string) {
  // Get current tier state
  const { data: currentState } = await supabase
    .from("tier_states")
    .select("*")
    .eq("user_id", userId)
    .single();

  // Get usage metrics
  const usage = await getUserUsageMetrics(userId);

  // Get active entitlements
  const entitlements = await getActiveEntitlements(userId);

  // Get pricing policy
  const { version: pricingVersion, config: policy } = await getActivePricingPolicy();

  // Compute effective tier
  const { tier: effectiveTier, appliedRules } = computeEffectiveTier(usage, policy, entitlements);

  const computedAt = Date.now();

  // Upsert tier state
  const { error: upsertError } = await supabase
    .from("tier_states")
    .upsert({
      user_id: userId,
      effective_tier: effectiveTier,
      pricing_version: pricingVersion,
      computed_at: computedAt,
      source,
      usage_snapshot: usage,
      applied_rules: appliedRules,
    }, {
      onConflict: "user_id"
    });

  if (upsertError) {
    throw new Error(`Failed to update tier state: ${upsertError.message}`);
  }

  // Log reconciliation
  const { error: logError } = await supabase
    .from("tier_reconciliation_log")
    .insert({
      user_id: userId,
      previous_tier: currentState?.effective_tier || null,
      new_tier: effectiveTier,
      pricing_version: pricingVersion,
      source,
      triggered_by: triggeredBy || null,
      usage_metrics: usage,
      applied_rules: appliedRules,
    });

  if (logError) {
    console.error("Failed to log reconciliation:", logError);
  }

  return {
    user_id: userId,
    previous_tier: currentState?.effective_tier || null,
    new_tier: effectiveTier,
    pricing_version: pricingVersion,
    usage_metrics: usage,
    applied_rules: appliedRules,
    computed_at: computedAt,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (req.method === "POST") {
      const url = new URL(req.url);
      const pathParts = url.pathname.split("/");
      const targetUserId = pathParts[pathParts.length - 1];

      if (!targetUserId) {
        return new Response(
          JSON.stringify({ error: "User ID required" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Verify user exists
      const { data: targetUser, error: userError } = await supabase.auth.admin.getUserById(targetUserId);
      
      if (userError || !targetUser) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Perform reconciliation
      const result = await reconcileTier(targetUserId, "admin_reconcile", user.id);

      return new Response(
        JSON.stringify({
          success: true,
          data: result,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Reconciliation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
