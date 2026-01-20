import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  description?: string;
  status?: 'normal' | 'warning' | 'critical' | 'info';
}

export function MetricsCard({
  title,
  value,
  change,
  icon: Icon,
  description,
  status = 'normal',
}: MetricsCardProps) {
  const statusColors = {
    normal: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    critical: 'bg-destructive/10 text-destructive border-destructive/20',
    info: 'bg-info/10 text-info border-info/20',
  };

  const changeColor = change && change > 0 ? 'text-success' : change && change < 0 ? 'text-destructive' : 'text-muted-foreground';

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn('p-2 rounded-lg', statusColors[status])}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p className={cn('text-xs mt-1', changeColor)}>
            {change > 0 ? '+' : ''}
            {change.toFixed(1)}% from last period
          </p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
