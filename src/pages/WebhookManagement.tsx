import { useState, useEffect } from 'react';
import { analyticsApi } from '@/services/analytics';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Plus, Webhook, CheckCircle2, XCircle, Clock, AlertTriangle, Play, Trash2, Eye } from 'lucide-react';
import type { Seller, WebhookRegistration, WebhookEventType, WebhookDelivery } from '@/types/analytics';

const webhookSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  event_types: z.array(z.string()).min(1, 'Select at least one event type'),
});

type WebhookFormData = z.infer<typeof webhookSchema>;

const EVENT_TYPE_OPTIONS: { value: WebhookEventType; label: string; description: string }[] = [
  { value: 'anomaly_detected', label: 'Anomaly Detected', description: 'Triggered when an anomaly is detected' },
  { value: 'alert_triggered', label: 'Alert Triggered', description: 'Triggered when an alert condition is met' },
  { value: 'prediction_updated', label: 'Prediction Updated', description: 'Triggered when predictions are recomputed' },
  { value: 'insight_state_changed', label: 'Insight State Changed', description: 'Triggered when insight lifecycle changes' },
  { value: 'weekly_report_ready', label: 'Weekly Report Ready', description: 'Triggered when weekly report is generated' },
  { value: 'pricing_tier_changed', label: 'Pricing Tier Changed', description: 'Triggered when pricing tier changes' },
];

export default function WebhookManagement() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<string>('');
  const [webhooks, setWebhooks] = useState<WebhookRegistration[]>([]);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookRegistration | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deliveriesDialogOpen, setDeliveriesDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<WebhookFormData>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      url: '',
      event_types: [],
    },
  });

  useEffect(() => {
    loadSellers();
  }, []);

  useEffect(() => {
    if (selectedSeller) {
      loadWebhooks();
    }
  }, [selectedSeller]);

  const loadSellers = async () => {
    try {
      const data = await analyticsApi.getSellers();
      setSellers(data);
      if (data.length > 0 && !selectedSeller) {
        setSelectedSeller(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load sellers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sellers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadWebhooks = async () => {
    if (!selectedSeller) return;
    
    try {
      const data = await analyticsApi.getWebhooks(selectedSeller);
      setWebhooks(data);
    } catch (error) {
      console.error('Failed to load webhooks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load webhooks',
        variant: 'destructive',
      });
    }
  };

  const loadDeliveries = async (webhookId: string) => {
    try {
      const data = await analyticsApi.getWebhookDeliveries(webhookId);
      setDeliveries(data);
    } catch (error) {
      console.error('Failed to load deliveries:', error);
      toast({
        title: 'Error',
        description: 'Failed to load deliveries',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (data: WebhookFormData) => {
    if (!selectedSeller) return;

    setIsSubmitting(true);
    try {
      await analyticsApi.createWebhook(
        selectedSeller,
        data.url,
        data.event_types as WebhookEventType[]
      );
      toast({
        title: 'Success',
        description: 'Webhook created successfully',
      });
      form.reset();
      setDialogOpen(false);
      loadWebhooks();
    } catch (error) {
      console.error('Failed to create webhook:', error);
      toast({
        title: 'Error',
        description: 'Failed to create webhook',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    try {
      const result = await analyticsApi.testWebhook(webhookId);
      if (result.success) {
        toast({
          title: 'Success',
          description: `Webhook test successful (${result.response_time_ms}ms)`,
        });
      } else {
        toast({
          title: 'Test Failed',
          description: result.error || 'Webhook test failed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to test webhook:', error);
      toast({
        title: 'Error',
        description: 'Failed to test webhook',
        variant: 'destructive',
      });
    }
  };

  const handleToggleWebhook = async (webhookId: string, enabled: boolean) => {
    try {
      await analyticsApi.updateWebhook(webhookId, { enabled: !enabled });
      toast({
        title: 'Success',
        description: `Webhook ${!enabled ? 'enabled' : 'disabled'}`,
      });
      loadWebhooks();
    } catch (error) {
      console.error('Failed to toggle webhook:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle webhook',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      await analyticsApi.deleteWebhook(webhookId);
      toast({
        title: 'Success',
        description: 'Webhook deleted successfully',
      });
      loadWebhooks();
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete webhook',
        variant: 'destructive',
      });
    }
  };

  const handleViewDeliveries = async (webhook: WebhookRegistration) => {
    setSelectedWebhook(webhook);
    await loadDeliveries(webhook.id);
    setDeliveriesDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-chart-1"><CheckCircle2 className="h-3 w-3 mr-1" />Success</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'pending':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'dead_letter':
        return <Badge className="bg-chart-5"><AlertTriangle className="h-3 w-3 mr-1" />Dead Letter</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
        <Skeleton className="h-16 w-80 bg-muted" />
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-64 bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight gradient-text">Webhook Management</h1>
          <p className="text-muted-foreground text-lg">Configure webhooks for real-time event notifications</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={selectedSeller} onValueChange={setSelectedSeller}>
            <SelectTrigger className="w-64 shadow-sm">
              <SelectValue placeholder="Select a seller" />
            </SelectTrigger>
            <SelectContent>
              {sellers.map((seller) => (
                <SelectItem key={seller.id} value={seller.id}>
                  {seller.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Webhook
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Webhook</DialogTitle>
                <DialogDescription>
                  Configure a webhook endpoint to receive real-time notifications
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Webhook URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://your-domain.com/webhook" {...field} />
                        </FormControl>
                        <FormDescription>
                          The endpoint that will receive webhook events
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="event_types"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Types</FormLabel>
                        <div className="space-y-2">
                          {EVENT_TYPE_OPTIONS.map((option) => (
                            <div key={option.value} className="flex items-start space-x-2">
                              <input
                                type="checkbox"
                                id={option.value}
                                checked={field.value?.includes(option.value)}
                                onChange={(e) => {
                                  const newValue = e.target.checked
                                    ? [...(field.value || []), option.value]
                                    : (field.value || []).filter((v) => v !== option.value);
                                  field.onChange(newValue);
                                }}
                                className="mt-1"
                              />
                              <label htmlFor={option.value} className="flex-1 cursor-pointer">
                                <div className="font-medium">{option.label}</div>
                                <div className="text-xs text-muted-foreground">{option.description}</div>
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? 'Creating...' : 'Create Webhook'}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {webhooks.map((webhook) => (
          <Card key={webhook.id} className="card-modern">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-primary/10 to-chart-4/10 rounded-xl">
                    <Webhook className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Webhook Endpoint</CardTitle>
                    <Badge variant={webhook.enabled ? 'default' : 'outline'} className="mt-1.5">
                      {webhook.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">URL</p>
                <p className="text-sm font-mono bg-muted/50 p-2 rounded border border-border truncate">
                  {webhook.url}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Event Types</p>
                <div className="flex flex-wrap gap-1.5">
                  {webhook.event_types.map((type) => (
                    <Badge key={type} variant="outline" className="text-xs">
                      {type.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Secret</p>
                <p className="text-xs font-mono bg-muted/50 p-2 rounded border border-border">
                  {webhook.secret.substring(0, 20)}...
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTestWebhook(webhook.id)}
                  className="flex-1"
                >
                  <Play className="h-3 w-3 mr-1" />
                  Test
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleViewDeliveries(webhook)}
                  className="flex-1"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Deliveries
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleWebhook(webhook.id, webhook.enabled)}
                >
                  {webhook.enabled ? 'Disable' : 'Enable'}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteWebhook(webhook.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {webhooks.length === 0 && (
        <Card className="card-modern">
          <CardContent className="py-16 text-center">
            <div className="p-4 bg-gradient-to-br from-primary/10 to-chart-4/10 rounded-2xl w-fit mx-auto mb-6">
              <Webhook className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No webhooks configured</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Set up webhooks to receive real-time notifications when events occur
            </p>
            <Button onClick={() => setDialogOpen(true)} className="shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={deliveriesDialogOpen} onOpenChange={setDeliveriesDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Webhook Deliveries</DialogTitle>
            <DialogDescription>
              Recent delivery attempts for {selectedWebhook?.url}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {deliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="p-4 border border-border rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(delivery.status)}
                    <Badge variant="outline">{delivery.event_type}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(delivery.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Attempts:</span>
                    <span>{delivery.attempts}</span>
                  </div>
                  {delivery.response_code && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Response Code:</span>
                      <span>{delivery.response_code}</span>
                    </div>
                  )}
                  {delivery.error_message && (
                    <div>
                      <span className="text-muted-foreground">Error:</span>
                      <p className="text-destructive mt-1">{delivery.error_message}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {deliveries.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No deliveries yet</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
