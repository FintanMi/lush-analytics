import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnomalyAlertProps {
  score: number;
  metrics?: {
    periodicScore: number;
    hfd: number;
    dataPoints: number;
  };
}

export function AnomalyAlert({ score, metrics }: AnomalyAlertProps) {
  const getAlertLevel = (score: number) => {
    if (score >= 0.7) return 'critical';
    if (score >= 0.4) return 'warning';
    if (score >= 0.2) return 'info';
    return 'normal';
  };

  const level = getAlertLevel(score);

  const alertConfig = {
    critical: {
      icon: AlertTriangle,
      title: 'Critical Anomaly Detected',
      description: 'Unusual activity patterns detected. Immediate attention recommended.',
      variant: 'destructive' as const,
      alertClass: 'alert-critical',
      badgeClass: 'badge-critical',
    },
    warning: {
      icon: AlertCircle,
      title: 'Moderate Anomaly Detected',
      description: 'Some irregular patterns observed. Monitor closely.',
      variant: 'default' as const,
      alertClass: 'alert-warning',
      badgeClass: 'badge-warning',
    },
    info: {
      icon: Info,
      title: 'Minor Anomaly Detected',
      description: 'Slight variations from normal patterns.',
      variant: 'default' as const,
      alertClass: 'alert-info',
      badgeClass: 'badge-info',
    },
    normal: {
      icon: CheckCircle,
      title: 'Normal Activity',
      description: 'All metrics within expected ranges.',
      variant: 'default' as const,
      alertClass: 'alert-success',
      badgeClass: 'badge-success',
    },
  };

  const config = alertConfig[level];
  const Icon = config.icon;

  return (
    <Alert variant={config.variant} className={cn('mb-4', config.alertClass)}>
      <Icon className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        {config.title}
        <Badge className={config.badgeClass}>
          Score: {(score * 100).toFixed(1)}%
        </Badge>
      </AlertTitle>
      <AlertDescription>
        <p className="mb-2">{config.description}</p>
        {metrics && (
          <div className="text-xs space-y-1 mt-2 opacity-80">
            <div>Periodic Score: {(metrics.periodicScore * 100).toFixed(1)}%</div>
            <div>Complexity (HFD): {metrics.hfd.toFixed(2)}</div>
            <div>Data Points: {metrics.dataPoints}</div>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
