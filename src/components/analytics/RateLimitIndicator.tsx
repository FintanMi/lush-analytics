import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import type { RateLimitStatus } from '@/types/analytics';

interface RateLimitIndicatorProps {
  rateLimit: RateLimitStatus;
}

export function RateLimitIndicator({ rateLimit }: RateLimitIndicatorProps) {
  const percentage = (rateLimit.current / rateLimit.limit) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">API Rate Limit</CardTitle>
          <Badge className={getTierColor()}>
            {rateLimit.tier.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>Remaining</span>
          </div>
          <span className={`font-medium ${isAtLimit ? 'text-destructive' : isNearLimit ? 'text-warning' : 'text-success'}`}>
            {rateLimit.remaining.toLocaleString()} calls
          </span>
        </div>

        {isNearLimit && (
          <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-md">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-warning">Approaching Rate Limit</p>
              <p className="text-xs text-muted-foreground mt-1">
                Consider upgrading your tier for higher limits
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Resets in</span>
          </div>
          <span className="font-medium">{getTimeUntilReset()}</span>
        </div>
      </CardContent>
    </Card>
  );
}
