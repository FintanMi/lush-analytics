import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TimeToInsightTimeline } from '@/types/analytics';
import { CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeToInsightTimelineProps {
  data: TimeToInsightTimeline | null;
  loading?: boolean;
}

export default function TimeToInsightTimelineVisualization({ data, loading }: TimeToInsightTimelineProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Time-to-Insight Timeline</CardTitle>
          <CardDescription>Value delivery pipeline visualization</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Time-to-Insight Timeline</CardTitle>
          <CardDescription>No timeline data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <p>Process events to see the timeline</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStageIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-chart-1" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'skipped':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStageLabel = (stage: string): string => {
    const labels: Record<string, string> = {
      ingestion: 'Event Ingestion',
      computation: 'Data Processing',
      anomaly_detection: 'Anomaly Detection',
      insight_generation: 'Insight Generation',
      alert_delivery: 'Alert Delivery',
      user_action: 'User Action',
    };
    return labels[stage] || stage;
  };

  const totalDuration = data.stages.reduce((sum, stage) => sum + stage.duration_ms, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Time-to-Insight Timeline</CardTitle>
            <CardDescription>
              Query ID: {data.query_id} • Seller: {data.seller_id}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{data.total_time_to_insight_ms}ms</div>
            <div className="text-xs text-muted-foreground">Total Time to Insight</div>
            {data.total_time_to_action_ms && (
              <div className="text-sm text-muted-foreground mt-1">
                Action: +{data.total_time_to_action_ms}ms
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Timeline Visualization */}
          <div className="relative">
            {/* Progress Bar */}
            <div className="h-2 bg-muted rounded-full overflow-hidden mb-8">
              {data.stages.map((stage, idx) => {
                const widthPercent = (stage.duration_ms / totalDuration) * 100;
                const leftPercent = data.stages
                  .slice(0, idx)
                  .reduce((sum, s) => sum + (s.duration_ms / totalDuration) * 100, 0);

                return (
                  <div
                    key={idx}
                    className={cn(
                      'h-full absolute',
                      stage.status === 'completed' && 'bg-chart-1',
                      stage.status === 'failed' && 'bg-destructive',
                      stage.status === 'skipped' && 'bg-muted-foreground/30'
                    )}
                    style={{
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                    }}
                  />
                );
              })}
            </div>

            {/* Stage Details */}
            <div className="space-y-3">
              {data.stages.map((stage, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="flex items-center gap-2 min-w-[200px]">
                    {getStageIcon(stage.status)}
                    <span className="text-sm font-medium">{getStageLabel(stage.stage)}</span>
                  </div>

                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-px bg-border" />
                    {idx < data.stages.length - 1 && (
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex items-center gap-3 min-w-[200px] justify-end">
                    <Badge
                      variant={stage.status === 'completed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {stage.status}
                    </Badge>
                    <span className="font-mono text-sm font-medium">
                      {stage.duration_ms}ms
                    </span>
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {((stage.duration_ms / totalDuration) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-chart-1">
                {data.stages.filter(s => s.status === 'completed').length}
              </div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">
                {data.stages.filter(s => s.status === 'failed').length}
              </div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">
                {data.stages.filter(s => s.status === 'skipped').length}
              </div>
              <div className="text-xs text-muted-foreground">Skipped</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {(totalDuration / data.stages.length).toFixed(0)}ms
              </div>
              <div className="text-xs text-muted-foreground">Avg per Stage</div>
            </div>
          </div>

          {/* Performance Insights */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Performance Insights</h4>
            <div className="space-y-2 text-sm">
              {data.stages.some(s => s.duration_ms > 1000) && (
                <div className="flex items-center gap-2 text-amber-600">
                  <Clock className="h-4 w-4" />
                  <span>Some stages exceeded 1 second - consider optimization</span>
                </div>
              )}
              {data.total_time_to_action_ms && data.total_time_to_action_ms > 5000 && (
                <div className="flex items-center gap-2 text-amber-600">
                  <Clock className="h-4 w-4" />
                  <span>User action latency is high - improve alert visibility</span>
                </div>
              )}
              {data.stages.every(s => s.status === 'completed') && (
                <div className="flex items-center gap-2 text-chart-1">
                  <CheckCircle className="h-4 w-4" />
                  <span>All stages completed successfully</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
