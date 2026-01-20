import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, TrendingUp, Radio, AlertCircle } from 'lucide-react';
import type { PredictiveAlert } from '@/types/analytics';

interface PredictiveAlertsProps {
  alerts: PredictiveAlert[];
}

export function PredictiveAlerts({ alerts }: PredictiveAlertsProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'trend_acceleration':
        return <TrendingUp className="h-4 w-4" />;
      case 'phase_misalignment':
        return <Radio className="h-4 w-4" />;
      case 'confidence_decay':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'badge-critical';
      case 'medium':
        return 'badge-warning';
      default:
        return 'badge-info';
    }
  };

  const formatTimeToImpact = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Predictive Alerts ({alerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert, index) => (
          <div key={index} className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {getIcon(alert.type)}
                <span className="text-sm font-medium">{alert.message}</span>
              </div>
              <Badge className={getSeverityClass(alert.severity)}>
                {alert.severity}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Impact: {alert.predictedImpact.toFixed(1)}%</span>
              <span>ETA: {formatTimeToImpact(alert.timeToImpact)}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
