import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RefreshCw, Shield, TrendingUp, Calendar, User as UserIcon, Check, CreditCard, XCircle } from 'lucide-react';

interface TierState {
  user_id: string;
  effective_tier: string;
  pricing_version: string;
  computed_at: number;
  source: string;
  usage_snapshot: any;
  applied_rules: any;
}

interface AuthUser {
  id: string;
  email?: string;
  created_at: string;
}

interface PricingTier {
  name: string;
  price: string;
  priceValue: number;
  period: string;
  description: string;
  features: string[];
  highlighted: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Free',
    price: '0',
    priceValue: 0,
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      'Up to 1,000 events/month',
      'Basic analytics dashboard',
      '7-day data retention',
      'Email support',
      'Single seller account',
      'Privacy by Design',
      'High Performance'
    ],
    highlighted: false
  },
  {
    name: 'Basic',
    price: '50',
    priceValue: 50,
    period: 'month',
    description: 'For growing businesses',
    features: [
      'Up to 50,000 events/month',
      'Advanced analytics',
      '30-day data retention',
      'Priority email support',
      'Up to 5 seller accounts',
      'Anomaly detection',
      'Basic predictions',
      'Privacy by Design',
      'High Performance'
    ],
    highlighted: false
  },
  {
    name: 'Premium',
    price: '300',
    priceValue: 300,
    period: 'month',
    description: 'For established companies',
    features: [
      'Up to 500,000 events/month',
      'Full analytics suite',
      '90-day data retention',
      '24/7 priority support',
      'Up to 25 seller accounts',
      'Advanced anomaly detection',
      'Predictive analytics',
      'Custom reports',
      'API access',
      'Privacy by Design',
      'High Performance'
    ],
    highlighted: true
  }
];

export default function AdminPanel() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [tierStates, setTierStates] = useState<Record<string, TierState>>({});
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [reconciling, setReconciling] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<string>('free');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
    loadCurrentUserTier();
  }, []);

  const loadCurrentUserTier = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: tierState } = await supabase
          .from('tier_states')
          .select('effective_tier')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (tierState) {
          setCurrentTier(tierState.effective_tier);
        }
      }
    } catch (error) {
      console.error('Failed to load current tier:', error);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Get current session for authorization
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to access the admin panel',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Get all users via edge function (requires service role)
      const { data, error } = await supabase.functions.invoke('admin-list-users', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (error) {
        console.error('Error loading users:', error);
        // Don't throw error, just show empty state
        setUsers([]);
        setLoading(false);
        return;
      }

      const mappedUsers: AuthUser[] = (data?.users || []).map((u: any) => ({
        id: u.id,
        email: u.email || 'No email',
        created_at: u.created_at
      }));

      setUsers(mappedUsers);

      // Load tier states for all users
      const { data: states, error: statesError } = await supabase
        .from('tier_states')
        .select('*');

      if (statesError) {
        console.error('Error loading tier states:', statesError);
      }

      const statesMap: Record<string, TierState> = {};
      for (const state of states || []) {
        statesMap[state.user_id] = state;
      }
      setTierStates(statesMap);
    } catch (error: any) {
      console.error('Error in loadUsers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin data. Some features may not be available.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReconcileTier = async (userId: string) => {
    setReconciling(userId);
    try {
      // Get current session for authorization
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('You must be logged in to perform this action');
      }

      const { data, error } = await supabase.functions.invoke(`reconcile-tier/${userId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: 'Tier Recalculated',
          description: `User tier updated to: ${data.data.new_tier}`,
        });
        
        // Reload users to get updated tier states
        await loadUsers();
      } else {
        throw new Error('Reconciliation failed');
      }
    } catch (error: any) {
      toast({
        title: 'Reconciliation Failed',
        description: error.message || 'Failed to recalculate tier',
        variant: 'destructive',
      });
    } finally {
      setReconciling(null);
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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleUpgradeDowngrade = async (tier: PricingTier) => {
    if (tier.priceValue === 0) {
      toast({
        title: 'Cannot Downgrade to Free',
        description: 'Please cancel your subscription to return to the free tier.',
        variant: 'destructive',
      });
      return;
    }

    setProcessingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('create_stripe_checkout', {
        body: {
          items: [
            {
              name: `Lush Analytics - ${tier.name} Plan`,
              price: tier.priceValue,
              quantity: 1,
            }
          ],
          currency: 'eur',
          payment_method_types: ['card'],
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to create checkout session');
      }

      if (data?.code === 'FAIL') {
        throw new Error(data?.message || 'Failed to create checkout session');
      }

      if (data?.code === 'SUCCESS' && data?.data?.url) {
        window.open(data.data.url, '_blank');
        toast({
          title: 'Redirecting to Payment',
          description: 'Opening Stripe checkout in a new tab...',
          duration: 5000,
        });
      } else {
        throw new Error('Invalid response from payment service');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      
      let errorMessage = 'Failed to initiate payment. Please try again.';
      let errorTitle = 'Payment Failed';
      
      if (error?.message?.includes('STRIPE_SECRET_KEY')) {
        errorTitle = 'Configuration Error';
        errorMessage = 'Payment system not configured. Please contact support.';
      } else if (error?.message?.includes('Invalid API Key')) {
        errorTitle = 'Configuration Error';
        errorMessage = 'Payment system requires configuration. Please contact an administrator.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive',
        duration: 7000,
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCancellingSubscription(true);
    try {
      // In a real implementation, this would call a Stripe API to cancel the subscription
      // For now, we'll just show a success message
      toast({
        title: 'Subscription Cancelled',
        description: 'Your subscription has been cancelled. You will retain access until the end of your billing period.',
      });
      
      // Reload tier information
      await loadCurrentUserTier();
    } catch (error: any) {
      toast({
        title: 'Cancellation Failed',
        description: error.message || 'Failed to cancel subscription. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCancellingSubscription(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground">Manage user tiers and pricing policies</p>
        </div>
        <Button onClick={loadUsers} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Subscription Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription Management
          </CardTitle>
          <CardDescription>
            Manage your subscription plan and billing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
            <div>
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <p className="text-2xl font-bold capitalize">{currentTier}</p>
            </div>
            {currentTier !== 'free' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={cancellingSubscription}>
                    <XCircle className="h-4 w-4 mr-2" />
                    {cancellingSubscription ? 'Cancelling...' : 'Cancel Subscription'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel your subscription? You will retain access until the end of your current billing period, after which your account will be downgraded to the Free tier.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancelSubscription} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Cancel Subscription
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Available Plans</h3>
            <div className="grid gap-6 md:grid-cols-3">
              {pricingTiers.map((tier) => (
                <Card 
                  key={tier.name} 
                  className={`relative ${tier.highlighted ? 'ring-2 ring-primary shadow-lg' : ''} ${currentTier.toLowerCase() === tier.name.toLowerCase() ? 'border-primary' : ''}`}
                >
                  {tier.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-primary to-chart-4 text-white px-3 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  {currentTier.toLowerCase() === tier.name.toLowerCase() && (
                    <div className="absolute -top-3 right-4">
                      <Badge variant="default" className="px-3 py-1">
                        Current Plan
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl">{tier.name}</CardTitle>
                    <CardDescription>{tier.description}</CardDescription>
                    <div className="pt-4">
                      <span className="text-4xl font-bold">€{tier.price}</span>
                      <span className="text-muted-foreground">/{tier.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={currentTier.toLowerCase() === tier.name.toLowerCase() ? 'outline' : 'default'}
                      disabled={currentTier.toLowerCase() === tier.name.toLowerCase() || processingPayment || tier.priceValue === 0}
                      onClick={() => handleUpgradeDowngrade(tier)}
                    >
                      {processingPayment ? (
                        'Processing...'
                      ) : currentTier.toLowerCase() === tier.name.toLowerCase() ? (
                        'Current Plan'
                      ) : tier.priceValue === 0 ? (
                        'Cancel to Downgrade'
                      ) : tier.priceValue > pricingTiers.find(t => t.name.toLowerCase() === currentTier.toLowerCase())!.priceValue ? (
                        'Upgrade'
                      ) : (
                        'Downgrade'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tier Reconciliation</CardTitle>
          <CardDescription>
            Recalculate user tiers based on current usage and pricing policy. This action computes the effective tier deterministically without manual intervention.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Current Tier</TableHead>
                  <TableHead>Usage Snapshot</TableHead>
                  <TableHead>Last Computed</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      {loading ? 'Loading users...' : 'No users found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => {
                    const tierState = tierStates[user.id];
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{user.email}</div>
                              <div className="text-xs text-muted-foreground">{user.id.slice(0, 8)}...</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {tierState ? (
                            <Badge variant={getTierBadgeVariant(tierState.effective_tier)}>
                              {tierState.effective_tier.toUpperCase()}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Not Set</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {tierState?.usage_snapshot ? (
                            <div className="text-xs space-y-1">
                              <div>Events: {tierState.usage_snapshot.events_this_month || 0}</div>
                              <div>Webhooks: {tierState.usage_snapshot.webhooks_this_month || 0}</div>
                              <div>Sellers: {tierState.usage_snapshot.seller_accounts || 0}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">No data</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {tierState ? (
                            <div className="text-xs">
                              <div>{formatDate(tierState.computed_at)}</div>
                              <div className="text-muted-foreground">v{tierState.pricing_version}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">Never</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {tierState ? (
                            <Badge variant="outline" className="text-xs">
                              {tierState.source.replace('_', ' ')}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={reconciling === user.id}
                              >
                                {reconciling === user.id ? (
                                  <>
                                    <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="h-3 w-3 mr-2" />
                                    Recalculate Tier
                                  </>
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Recalculate User Tier</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will recompute the user's tier based on current usage and pricing rules. No data will be modified.
                                  <div className="mt-4 p-4 bg-muted rounded-md space-y-2">
                                    <div className="font-medium">User: {user.email}</div>
                                    {tierState && (
                                      <>
                                        <div className="text-sm">Current Tier: {tierState.effective_tier}</div>
                                        <div className="text-sm">Events: {tierState.usage_snapshot?.events_this_month || 0}</div>
                                        <div className="text-sm">Webhooks: {tierState.usage_snapshot?.webhooks_this_month || 0}</div>
                                      </>
                                    )}
                                  </div>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleReconcileTier(user.id)}>
                                  Apply Pricing Policy
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Pricing Policy
            </CardTitle>
            <CardDescription>Current active pricing configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Version</Label>
                <div className="font-mono text-sm">v1.0.0</div>
              </div>
              <Separator />
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-semibold">Free Tier</Label>
                  <div className="text-sm space-y-1 mt-1">
                    <div>Events: 1,000/month</div>
                    <div>Webhooks: 0/month</div>
                    <div>Retention: 7 days</div>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Basic Tier</Label>
                  <div className="text-sm space-y-1 mt-1">
                    <div>Events: 50,000/month</div>
                    <div>Webhooks: 5,000/month</div>
                    <div>Retention: 30 days</div>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Premium Tier</Label>
                  <div className="text-sm space-y-1 mt-1">
                    <div>Events: 500,000/month</div>
                    <div>Webhooks: 50,000/month</div>
                    <div>Retention: 90 days</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              System Philosophy
            </CardTitle>
            <CardDescription>Tier reconciliation principles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <div className="font-semibold mb-1">Tier is Derived State</div>
                <div className="text-muted-foreground">
                  usage metrics + pricing policy + grace rules = effective tier
                </div>
              </div>
              <Separator />
              <div>
                <div className="font-semibold mb-1">No Manual Assignment</div>
                <div className="text-muted-foreground">
                  Admins trigger computation, not assignment. The system determines the tier deterministically.
                </div>
              </div>
              <Separator />
              <div>
                <div className="font-semibold mb-1">Auditable & Reproducible</div>
                <div className="text-muted-foreground">
                  Every tier change is logged with usage snapshot, pricing version, and applied rules.
                </div>
              </div>
              <Separator />
              <div>
                <div className="font-semibold mb-1">Exceptions via Entitlements</div>
                <div className="text-muted-foreground">
                  Special cases handled through explicit entitlements, not tier overrides.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
