import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { format } from 'date-fns';

interface DataSufficiencyBadgeProps {
  level: 'insufficient' | 'minimal' | 'adequate' | 'optimal';
  dataPoints: number;
  timeWindowStart?: number;
  timeWindowEnd?: number;
}

export function DataSufficiencyBadge({ level, dataPoints, timeWindowStart, timeWindowEnd }: DataSufficiencyBadgeProps) {
  const getIcon = () => {
    switch (level) {
      case 'insufficient':
        return <AlertCircle className="h-3 w-3" />;
      case 'minimal':
        return <AlertTriangle className="h-3 w-3" />;
      case 'adequate':
        return <Info className="h-3 w-3" />;
      case 'optimal':
        return <CheckCircle className="h-3 w-3" />;
    }
  };

  const getClass = () => {
    switch (level) {
      case 'insufficient':
        return 'badge-critical';
      case 'minimal':
        return 'badge-warning';
      case 'adequate':
        return 'badge-info';
      case 'optimal':
        return 'badge-success';
    }
  };

  const getMessage = () => {
    switch (level) {
      case 'insufficient':
        return `Insufficient data (${dataPoints} events). Need 50+ for reliable analysis.`;
      case 'minimal':
        return `Minimal data (${dataPoints} events). 100+ recommended for better accuracy.`;
      case 'adequate':
        return `Adequate data (${dataPoints} events). Good for analysis.`;
      case 'optimal':
        return `Optimal data (${dataPoints} events). Excellent for analysis.`;
    }
  };

  return (
    <Card className="border-l-4" style={{ borderLeftColor: level === 'insufficient' ? 'hsl(var(--destructive))' : level === 'minimal' ? 'hsl(var(--warning))' : level === 'adequate' ? 'hsl(var(--info))' : 'hsl(var(--success))' }}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {getIcon()}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <Badge className={getClass()}>
                {level.toUpperCase()}
              </Badge>
              <span className="text-sm font-medium">Data Quality</span>
            </div>
            <p className="text-sm text-muted-foreground">{getMessage()}</p>
            {timeWindowStart && timeWindowEnd && (
              <p className="text-xs text-muted-foreground mt-2">
                Time Window: {format(new Date(timeWindowStart), 'MMM dd, HH:mm')} → {format(new Date(timeWindowEnd), 'MMM dd, HH:mm')}
                <span className="ml-2">({Math.round((timeWindowEnd - timeWindowStart) / 3600000)}h span)</span>
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
