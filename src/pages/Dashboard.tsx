import { useState, useEffect } from 'react';
import { analyticsApi } from '@/services/analytics';
import { MetricsCard } from '@/components/analytics/MetricsCard';
import { AnomalyAlert } from '@/components/analytics/AnomalyAlert';
import { EventChart } from '@/components/analytics/EventChart';
import { PredictionChart } from '@/components/analytics/PredictionChart';
import { InsightsPanel } from '@/components/analytics/InsightsPanel';
import { HealthScoreCard } from '@/components/analytics/HealthScoreCard';
import { PredictiveAlerts } from '@/components/analytics/PredictiveAlerts';
import { BehaviorFingerprintCard } from '@/components/analytics/BehaviorFingerprintCard';
import { DataSufficiencyBadge } from '@/components/analytics/DataSufficiencyBadge';
import { RateLimitIndicator } from '@/components/analytics/RateLimitIndicator';
import { InsightSummaryCard } from '@/components/analytics/InsightSummaryCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, MousePointer, Eye, Activity, RefreshCw, Radio, ShoppingCart, CreditCard } from 'lucide-react';
import type { 
  Seller, 
  Event, 
  AnomalyResponse, 
  PredictionResponse,
  AutoInsight,
  SellerHealthScore,
  BehaviorFingerprint,
  PredictiveAlert,
  RateLimitStatus,
} from '@/types/analytics';

export default function Dashboard() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<string>('');
  const [events, setEvents] = useState<Event[]>([]);
  const [anomalyData, setAnomalyData] = useState<AnomalyResponse | null>(null);
  const [predictionData, setPredictionData] = useState<PredictionResponse | null>(null);
  const [insights, setInsights] = useState<AutoInsight[]>([]);
  const [healthScore, setHealthScore] = useState<SellerHealthScore | null>(null);
  const [fingerprint, setFingerprint] = useState<BehaviorFingerprint | null>(null);
  const [alerts, setAlerts] = useState<PredictiveAlert[]>([]);
  const [rateLimit, setRateLimit] = useState<RateLimitStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState(true);

  useEffect(() => {
    loadSellers();
  }, []);

  useEffect(() => {
    if (selectedSeller) {
      loadDashboardData();
    }
  }, [selectedSeller]);

  useEffect(() => {
    if (selectedSeller && liveUpdates) {
      const subscription = analyticsApi.subscribeToEvents(selectedSeller, (newEvent) => {
        setEvents((prev) => [newEvent, ...prev].slice(0, 100));
        loadDashboardData();
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectedSeller, liveUpdates]);

  const loadSellers = async () => {
    try {
      const data = await analyticsApi.getSellers();
      setSellers(data);
      if (data.length > 0 && !selectedSeller) {
        setSelectedSeller(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load sellers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    if (!selectedSeller) return;

    setRefreshing(true);
    try {
      const [eventsData, anomaly, predictions, insightsData, rateLimitData] = await Promise.all([
        analyticsApi.getRecentEvents(selectedSeller, 24),
        analyticsApi.getAnomalyScore(selectedSeller, 'SALE'),
        analyticsApi.getPredictions(selectedSeller, 'SALE', 10),
        analyticsApi.getInsights(selectedSeller, 'SALE'),
        analyticsApi.getRateLimitStatus(selectedSeller),
      ]);

      setEvents(eventsData);
      setAnomalyData(anomaly);
      setPredictionData(predictions);
      setInsights(insightsData.insights || []);
      setHealthScore(insightsData.healthScore);
      setFingerprint(insightsData.fingerprint);
      setAlerts(insightsData.alerts || []);
      setRateLimit(rateLimitData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const calculateMetrics = () => {
    const sales = events.filter(e => e.type === 'SALE');
    const clicks = events.filter(e => e.type === 'CLICK');
    const views = events.filter(e => e.type === 'VIEW');
    const checkouts = events.filter(e => e.type === 'CHECKOUT_STARTED');
    const payments = events.filter(e => e.type === 'PAYMENT_SUCCEEDED');

    const totalSales = sales.reduce((sum, e) => sum + e.value, 0);
    const totalClicks = clicks.length;
    const totalViews = views.length;
    const totalCheckouts = checkouts.length;
    const totalPayments = payments.length;

    return {
      totalSales: totalSales.toFixed(2),
      totalClicks,
      totalViews,
      totalCheckouts,
      totalPayments,
      avgSaleValue: sales.length > 0 ? (totalSales / sales.length).toFixed(2) : '0',
    };
  };

  const metrics = calculateMetrics();

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64 bg-muted" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight gradient-text">Analytics Dashboard</h1>
          <p className="text-muted-foreground text-lg">Real-time seller analytics and anomaly detection</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            onClick={() => setLiveUpdates(!liveUpdates)}
            variant={liveUpdates ? 'default' : 'outline'}
            size="sm"
            className="shadow-sm"
          >
            <Radio className={`h-4 w-4 mr-2 ${liveUpdates ? 'animate-pulse' : ''}`} />
            {liveUpdates ? 'Live' : 'Paused'}
          </Button>
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
          <Button
            onClick={loadDashboardData}
            disabled={refreshing || !selectedSeller}
            variant="outline"
            size="icon"
            className="shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {anomalyData && (
        <div className="animate-slide-up">
          <AnomalyAlert score={anomalyData.anomalyScore} metrics={anomalyData.metrics} />
        </div>
      )}

      {alerts.length > 0 && (
        <div className="animate-slide-up">
          <PredictiveAlerts alerts={alerts} />
        </div>
      )}

      {anomalyData && anomalyData.metrics && (
        <DataSufficiencyBadge 
          level={anomalyData.metrics.dataSufficiency}
          dataPoints={anomalyData.metrics.dataPoints}
          timeWindowStart={anomalyData.metrics.timeWindowStart}
          timeWindowEnd={anomalyData.metrics.timeWindowEnd}
        />
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          title="Total Sales"
          value={`$${metrics.totalSales}`}
          icon={TrendingUp}
          description="Last 24 hours"
          status={anomalyData && anomalyData.anomalyScore > 0.7 ? 'critical' : 'normal'}
        />
        <MetricsCard
          title="Total Clicks"
          value={metrics.totalClicks}
          icon={MousePointer}
          description="Last 24 hours"
          status="info"
        />
        <MetricsCard
          title="Total Views"
          value={metrics.totalViews}
          icon={Eye}
          description="Last 24 hours"
          status="info"
        />
        <MetricsCard
          title="Avg Sale Value"
          value={`$${metrics.avgSaleValue}`}
          icon={Activity}
          description="Per transaction"
          status="normal"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <MetricsCard
          title="Checkout Started"
          value={metrics.totalCheckouts}
          icon={ShoppingCart}
          description="Last 24 hours"
          status="info"
        />
        <MetricsCard
          title="Payment Succeeded"
          value={metrics.totalPayments}
          icon={CreditCard}
          description="Last 24 hours"
          status="success"
        />
      </div>

      {rateLimit && (
        <RateLimitIndicator rateLimit={rateLimit} />
      )}

      {selectedSeller && (
        <InsightSummaryCard 
          summary={{
            sellerId: selectedSeller,
            period: '24h',
            overallHealth: healthScore?.overall || 0,
            anomalyCount: insights.filter(i => i.type === 'anomaly').length,
            topIssue: insights.find(i => i.severity === 'critical' || i.severity === 'high')?.title || 'No critical issues',
            recommendation: healthScore && healthScore.overall < 0.4 ? 'Immediate action required' : 'Continue monitoring',
            confidence: anomalyData?.metrics.dataPoints && anomalyData.metrics.dataPoints > 300 ? 0.9 : 0.7,
            dataSufficiency: anomalyData?.metrics.dataSufficiency || 'insufficient',
          }}
          onExport={(type) => {
            console.log('Export requested:', type);
          }}
        />
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <EventChart
          events={events}
          title="Event Timeline"
          description="Real-time event tracking across all types"
        />
        {predictionData && predictionData.predictions.length > 0 && (
          <PredictionChart data={predictionData} title="Sales Forecast" />
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {healthScore && <HealthScoreCard healthScore={healthScore} />}
        {fingerprint && <BehaviorFingerprintCard fingerprint={fingerprint} />}
        {insights.length > 0 && <InsightsPanel insights={insights} />}
      </div>

      {predictionData && predictionData.predictions.length === 0 && (
        <Card className="card-modern">
          <CardHeader>
            <CardTitle>Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Insufficient data for predictions. Add more events to generate forecasts.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
