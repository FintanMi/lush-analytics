import { useState, useEffect, useMemo } from 'react';
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
import { Plus, TrendingDown, Filter, RefreshCw, BarChart3, AlertCircle } from 'lucide-react';
import type { Seller, FunnelTemplate, FunnelConfig, FunnelResult } from '@/types/analytics';

const funnelSchema = z.object({
  template_id: z.string().min(1, 'Select a template'),
  name: z.string().min(1, 'Name is required'),
  window_hours: z.number().min(1).max(168),
});

type FunnelFormData = z.infer<typeof funnelSchema>;

export default function FunnelAnalysis() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<string>('');
  const [templates, setTemplates] = useState<FunnelTemplate[]>([]);
  const [funnelConfigs, setFunnelConfigs] = useState<FunnelConfig[]>([]);
  const [selectedFunnel, setSelectedFunnel] = useState<string>('');
  const [funnelResult, setFunnelResult] = useState<FunnelResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<FunnelFormData>({
    resolver: zodResolver(funnelSchema),
    defaultValues: {
      template_id: '',
      name: '',
      window_hours: 24,
    },
  });

  useEffect(() => {
    loadSellers();
    loadTemplates();
  }, []);

  useEffect(() => {
    if (selectedSeller) {
      loadFunnelConfigs();
    }
  }, [selectedSeller]);

  useEffect(() => {
    if (selectedFunnel) {
      analyzeFunnel();
    }
  }, [selectedFunnel]);

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

  const loadTemplates = async () => {
    try {
      const data = await analyticsApi.getFunnelTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadFunnelConfigs = async () => {
    if (!selectedSeller) return;
    
    try {
      const data = await analyticsApi.getFunnelConfigs(selectedSeller);
      setFunnelConfigs(data);
      if (data.length > 0 && !selectedFunnel) {
        setSelectedFunnel(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load funnel configs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load funnel configs',
        variant: 'destructive',
      });
    }
  };

  const analyzeFunnel = async (forceRecompute = false) => {
    if (!selectedFunnel) return;

    setAnalyzing(true);
    try {
      const result = await analyticsApi.analyzeFunnel(selectedFunnel, undefined, forceRecompute);
      setFunnelResult(result);
    } catch (error) {
      console.error('Failed to analyze funnel:', error);
      toast({
        title: 'Error',
        description: 'Failed to analyze funnel',
        variant: 'destructive',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const onSubmit = async (data: FunnelFormData) => {
    if (!selectedSeller) return;

    setIsSubmitting(true);
    try {
      await analyticsApi.createFunnelConfig(
        selectedSeller,
        data.template_id,
        data.name,
        data.window_hours
      );
      toast({
        title: 'Success',
        description: 'Funnel created successfully',
      });
      form.reset();
      setDialogOpen(false);
      loadFunnelConfigs();
    } catch (error) {
      console.error('Failed to create funnel:', error);
      toast({
        title: 'Error',
        description: 'Failed to create funnel',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const conversionRate = useMemo(() => {
    if (!funnelResult || !funnelResult.step_results.length) return 0;
    const first = funnelResult.step_results[0].count;
    const last = funnelResult.step_results[funnelResult.step_results.length - 1].count;
    return first > 0 ? ((last / first) * 100).toFixed(1) : '0';
  }, [funnelResult]);

  const getSufficiencyBadge = (sufficiency: string) => {
    switch (sufficiency) {
      case 'high':
        return <Badge className="bg-chart-1">High</Badge>;
      case 'sufficient':
        return <Badge className="bg-chart-2">Sufficient</Badge>;
      case 'minimal':
        return <Badge className="bg-chart-3">Minimal</Badge>;
      default:
        return <Badge variant="destructive">Insufficient</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
        <Skeleton className="h-16 w-80 bg-muted" />
        <div className="grid gap-6">
          <Skeleton className="h-96 bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight gradient-text">Funnel Analysis</h1>
          <p className="text-muted-foreground text-lg">Analyze conversion funnels and identify drop-off points</p>
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
          {funnelConfigs.length > 0 && (
            <Select value={selectedFunnel} onValueChange={setSelectedFunnel}>
              <SelectTrigger className="w-64 shadow-sm">
                <SelectValue placeholder="Select a funnel" />
              </SelectTrigger>
              <SelectContent>
                {funnelConfigs.map((config) => (
                  <SelectItem key={config.id} value={config.id}>
                    {config.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            onClick={() => analyzeFunnel(true)}
            disabled={analyzing || !selectedFunnel}
            variant="outline"
            size="icon"
            className="shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Funnel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Funnel</DialogTitle>
                <DialogDescription>
                  Configure a funnel to track conversion through event sequences
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Funnel Name</FormLabel>
                        <FormControl>
                          <Input placeholder="My Conversion Funnel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="template_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a template" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {templates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name} ({template.tier})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose a predefined funnel template
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="window_hours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time Window (hours)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={168}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Analysis window in hours (1-168)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? 'Creating...' : 'Create Funnel'}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {funnelResult ? (
        <>
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{funnelResult.total_entries.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Started the funnel
                </p>
              </CardContent>
            </Card>

            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{conversionRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Completed the funnel
                </p>
              </CardContent>
            </Card>

            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Data Sufficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {getSufficiencyBadge(funnelResult.data_sufficiency)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Confidence: {(funnelResult.confidence * 100).toFixed(0)}%
                </p>
              </CardContent>
            </Card>

            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{funnelResult.step_results.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  In this funnel
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="card-modern">
            <CardHeader>
              <CardTitle>Funnel Steps</CardTitle>
              <CardDescription>Step-by-step conversion breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {funnelResult.step_results.map((step, index) => {
                  const isFirst = index === 0;
                  const percentage = isFirst
                    ? 100
                    : ((step.count / funnelResult.step_results[0].count) * 100).toFixed(1);

                  return (
                    <div key={step.step} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                            {step.step}
                          </div>
                          <div>
                            <p className="font-medium">{step.label}</p>
                            <p className="text-xs text-muted-foreground">{step.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{step.count.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{percentage}%</p>
                        </div>
                      </div>

                      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-chart-1 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          {getSufficiencyBadge(step.sufficiency)}
                          {step.dropoff > 0 && (
                            <Badge variant="outline" className="text-chart-5">
                              <TrendingDown className="h-3 w-3 mr-1" />
                              {step.dropoff} dropped ({(step.dropoff_rate * 100).toFixed(1)}%)
                            </Badge>
                          )}
                        </div>
                        {step.avg_time_from_previous_ms && (
                          <span className="text-muted-foreground">
                            Avg time: {(step.avg_time_from_previous_ms / 1000).toFixed(1)}s
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {funnelResult.drop_off_attribution.length > 0 && (
            <Card className="card-modern">
              <CardHeader>
                <CardTitle>Drop-off Attribution</CardTitle>
                <CardDescription>Reasons for user drop-off between steps</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {funnelResult.drop_off_attribution.map((attr) => (
                    <div key={`${attr.from_step}-${attr.to_step}`} className="p-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-medium">
                          Step {attr.from_step} → Step {attr.to_step}
                        </p>
                        <Badge variant="outline">
                          {attr.count} users ({(attr.rate * 100).toFixed(1)}%)
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {attr.reasons.map((reason) => (
                          <div key={reason.reason} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground capitalize">{reason.reason}</span>
                            <span>{(reason.contribution * 100).toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="card-modern bg-muted/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium">Reproducibility & Determinism</p>
                  <p className="text-sm text-muted-foreground">
                    Hash: <code className="text-xs">{funnelResult.reproducibility_hash.substring(0, 16)}...</code>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Config Version: {funnelResult.config_version}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Computed: {new Date(funnelResult.computed_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="card-modern">
          <CardContent className="py-16 text-center">
            <div className="p-4 bg-gradient-to-br from-primary/10 to-chart-4/10 rounded-2xl w-fit mx-auto mb-6">
              <BarChart3 className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No funnel selected</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {funnelConfigs.length === 0
                ? 'Create a funnel to start analyzing conversion rates'
                : 'Select a funnel from the dropdown to view analysis'}
            </p>
            {funnelConfigs.length === 0 && (
              <Button onClick={() => setDialogOpen(true)} className="shadow-sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Funnel
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
