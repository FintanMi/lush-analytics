/**
 * Metric Card Component
 * 
 * Reusable card for displaying metrics with optional charts.
 * Centralizes metric visualization logic.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BaseChart, ChartConfig } from './BaseChart';

export interface MetricCardConfig {
  title: string;
  description?: string;
  value: string | number;
  change?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  chart?: ChartConfig;
  footer?: React.ReactNode;
}

interface MetricCardProps {
  config: MetricCardConfig;
  className?: string;
}

export function MetricCard({ config, className }: MetricCardProps) {
  const { title, description, value, change, chart, footer } = config;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{value}</span>
            {change && (
              <span
                className={`text-sm ${
                  change.positive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {change.value > 0 ? '+' : ''}
                {change.value}% {change.label}
              </span>
            )}
          </div>

          {chart && <BaseChart config={chart} />}

          {footer && <div className="pt-4 border-t">{footer}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
