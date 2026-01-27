import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, TrendingUp, Clock, Activity, Layers, AlertCircle } from 'lucide-react';
import type { RateLimitStatus } from '@/types/analytics';

interface RateLimitIndicatorProps {
  rateLimit: RateLimitStatus;
}

export function RateLimitIndicator({ rateLimit }: RateLimitIndicatorProps) {
  const percentage = (rateLimit.current / rateLimit.limit) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;
  const quotaPercentage = rateLimit.quota?.percentageUsed || 0;

  const getTierColor = () => {
    switch (rateLimit.tier) {
      case 'free':
        return 'bg-muted text-muted-foreground';
      case 'basic':
        return 'bg-info text-info-foreground';
      case 'pro':
        return 'bg-primary text-primary-foreground';
      case 'enterprise':
        return 'bg-success text-success-foreground';
    }
  };

  const getTimeUntilReset = () => {
    const now = Date.now();
    const diff = rateLimit.resetAt - now;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const getBackpressureStatus = () => {
    if (!rateLimit.backpressure) return 'normal';
    const { queueDepth, rejectionRate } = rateLimit.backpressure;
    
    if (queueDepth > 100 || rejectionRate > 0.1) return 'critical';
    if (queueDepth > 50 || rejectionRate > 0.05) return 'warning';
    return 'normal';
  };

  const backpressureStatus = getBackpressureStatus();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Rate Limit & Backpressure</CardTitle>
            <CardDescription className="mt-1">
              Real-time monitoring of API limits and system load
            </CardDescription>
          </div>
          <Badge className={getTierColor()}>
            {rateLimit.tier.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rate Limit Status */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Current Rate Limit</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Usage</span>
              <span className="font-medium">
                {rateLimit.current.toLocaleString()} / {rateLimit.limit.toLocaleString()}
              </span>
            </div>
            <Progress 
              value={percentage} 
              className={`h-2 ${isAtLimit ? 'bg-destructive/20' : isNearLimit ? 'bg-warning/20' : ''}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-muted-foreground text-xs">Remaining</div>
                <div className={`font-medium ${isAtLimit ? 'text-destructive' : isNearLimit ? 'text-warning' : 'text-success'}`}>
                  {rateLimit.remaining.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-muted-foreground text-xs">Resets In</div>
                <div className="font-medium">{getTimeUntilReset()}</div>
              </div>
            </div>
          </div>
        </div>

        {isNearLimit && (
          <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-md">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-warning">Approaching Rate Limit</p>
              <p className="text-xs text-muted-foreground mt-1">
                Consider upgrading your tier for higher limits
              </p>
            </div>
          </div>
        )}

        <Separator />

        {/* Quota Status */}
        {rateLimit.quota && (
          <>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Monthly Quota</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Usage</span>
                  <span className="font-medium">
                    {rateLimit.quota.used.toLocaleString()} / {rateLimit.quota.total.toLocaleString()}
                  </span>
                </div>
                <Progress value={quotaPercentage} className="h-2" />
                <div className="text-xs text-muted-foreground text-right">
                  {quotaPercentage.toFixed(1)}% used
                </div>
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Backpressure Metrics */}
        {rateLimit.backpressure && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Backpressure Metrics</span>
              </div>
              <Badge 
                variant={
                  backpressureStatus === 'critical' ? 'destructive' : 
                  backpressureStatus === 'warning' ? 'secondary' : 
                  'outline'
                }
              >
                {backpressureStatus}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Layers className="h-3 w-3" />
                  Queue Depth
                </div>
                <div className="text-lg font-semibold">
                  {rateLimit.backpressure.queueDepth}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Avg Processing
                </div>
                <div className="text-lg font-semibold">
                  {rateLimit.backpressure.avgProcessingTime.toFixed(0)}ms
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <AlertTriangle className="h-3 w-3" />
                  Rejection Rate
                </div>
                <div className="text-lg font-semibold">
                  {(rateLimit.backpressure.rejectionRate * 100).toFixed(2)}%
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <AlertCircle className="h-3 w-3" />
                  Throttled
                </div>
                <div className="text-lg font-semibold">
                  {rateLimit.backpressure.throttledRequests}
                </div>
              </div>
            </div>

            {backpressureStatus !== 'normal' && (
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md text-xs">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium">System Under Load</div>
                  <div className="text-muted-foreground mt-1">
                    {backpressureStatus === 'critical' 
                      ? 'High backpressure detected. Consider reducing request rate or upgrading your plan.'
                      : 'Moderate backpressure detected. Monitor system performance closely.'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
