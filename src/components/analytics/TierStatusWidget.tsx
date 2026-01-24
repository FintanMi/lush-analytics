import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Shield, TrendingUp, Calendar, AlertCircle } from 'lucide-react';

interface TierState {
  effective_tier: string;
  pricing_version: string;
  computed_at: number;
  source: string;
  usage_snapshot: {
    events_this_month: number;
    webhooks_this_month: number;
    seller_accounts: number;
  };
  applied_rules: any;
}

interface TierLimits {
  events_per_month: number;
  webhooks_per_month: number;
  data_retention_days: number;
  seller_accounts: number;
}

const TIER_LIMITS: Record<string, TierLimits> = {
  free: {
    events_per_month: 1000,
    webhooks_per_month: 0,
    data_retention_days: 7,
    seller_accounts: 1,
  },
  basic: {
    events_per_month: 50000,
    webhooks_per_month: 5000,
    data_retention_days: 30,
    seller_accounts: 5,
  },
  premium: {
    events_per_month: 500000,
    webhooks_per_month: 50000,
    data_retention_days: 90,
    seller_accounts: 25,
  },
};

export default function TierStatusWidget() {
  const [tierState, setTierState] = useState<TierState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTierState();
  }, []);

  const loadTierState = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tier_states')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading tier state:', error);
        return;
      }

      setTierState(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'premium':
        return 'default';
      case 'basic':
        return 'secondary';
      case 'free':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const calculateUsagePercentage = (used: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-destructive';
    if (percentage >= 75) return 'text-warning';
    return 'text-success';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Your Tier Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!tierState) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Your Tier Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>No tier information available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const limits = TIER_LIMITS[tierState.effective_tier] || TIER_LIMITS.free;
  const usage = tierState.usage_snapshot;

  const eventsPercentage = calculateUsagePercentage(usage.events_this_month, limits.events_per_month);
  const webhooksPercentage = calculateUsagePercentage(usage.webhooks_this_month, limits.webhooks_per_month);
  const sellersPercentage = calculateUsagePercentage(usage.seller_accounts, limits.seller_accounts);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Your Tier Status
          </CardTitle>
          <Badge variant={getTierBadgeVariant(tierState.effective_tier)}>
            {tierState.effective_tier.toUpperCase()}
          </Badge>
        </div>
        <CardDescription>
          Current usage and limits for this billing period
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Events Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Events</span>
            <span className={getUsageColor(eventsPercentage)}>
              {usage.events_this_month.toLocaleString()} / {limits.events_per_month.toLocaleString()}
            </span>
          </div>
          <Progress value={eventsPercentage} className="h-2" />
          <div className="text-xs text-muted-foreground">
            {eventsPercentage.toFixed(1)}% used
          </div>
        </div>

        {/* Webhooks Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Webhooks</span>
            <span className={getUsageColor(webhooksPercentage)}>
              {usage.webhooks_this_month.toLocaleString()} / {limits.webhooks_per_month.toLocaleString()}
            </span>
          </div>
          <Progress value={webhooksPercentage} className="h-2" />
          <div className="text-xs text-muted-foreground">
            {webhooksPercentage.toFixed(1)}% used
          </div>
        </div>

        {/* Seller Accounts */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Seller Accounts</span>
            <span className={getUsageColor(sellersPercentage)}>
              {usage.seller_accounts} / {limits.seller_accounts}
            </span>
          </div>
          <Progress value={sellersPercentage} className="h-2" />
          <div className="text-xs text-muted-foreground">
            {sellersPercentage.toFixed(1)}% used
          </div>
        </div>

        <Separator />

        {/* Tier Details */}
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Data Retention</span>
            <span className="font-medium">{limits.data_retention_days} days</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Pricing Version</span>
            <span className="font-mono text-xs">{tierState.pricing_version}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Last Computed</span>
            <span className="text-xs">{new Date(tierState.computed_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Source</span>
            <Badge variant="outline" className="text-xs">
              {tierState.source.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        {/* Warning if approaching limits */}
        {(eventsPercentage >= 75 || webhooksPercentage >= 75 || sellersPercentage >= 75) && (
          <>
            <Separator />
            <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-md">
              <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
              <div className="text-xs space-y-1">
                <div className="font-medium">Approaching Tier Limits</div>
                <div className="text-muted-foreground">
                  You're using over 75% of your tier limits. Consider upgrading to avoid service interruption.
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
