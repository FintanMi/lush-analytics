import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AttributionWaterfall } from '@/types/analytics';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttributionWaterfallProps {
  data: AttributionWaterfall | null;
  loading?: boolean;
}

export default function AttributionWaterfallVisualization({ data, loading }: AttributionWaterfallProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attribution Waterfall</CardTitle>
          <CardDescription>Anomaly score component breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attribution Waterfall</CardTitle>
          <CardDescription>No attribution data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>Generate insights to see attribution breakdown</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxContribution = Math.max(...data.components.map(c => c.contribution_percentage));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Attribution Waterfall</CardTitle>
            <CardDescription>Insight ID: {data.insight_id}</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{data.total_score.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">Total Score</div>
            <Badge variant="outline" className="mt-1">
              {(data.confidence * 100).toFixed(0)}% confidence
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Waterfall Visualization */}
          <div className="space-y-3">
            {data.components.map((component, idx) => {
              const barWidth = (component.contribution_percentage / maxContribution) * 100;
              const isSmoothed = component.smoothed_score !== component.raw_score;
              const smoothingDelta = component.smoothed_score - component.raw_score;

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{component.component}</span>
                      {isSmoothed && (
                        <Badge variant="outline" className="text-xs">
                          {smoothingDelta > 0 ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          smoothed
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground font-mono text-xs">
                        {component.contribution_percentage.toFixed(1)}%
                      </span>
                      <span className="font-mono font-medium">
                        {component.smoothed_score.toFixed(3)}
                      </span>
                    </div>
                  </div>

                  <div className="relative h-8 bg-muted rounded overflow-hidden">
                    {/* Raw Score Bar (background) */}
                    {isSmoothed && (
                      <div
                        className="absolute h-full bg-muted-foreground/20"
                        style={{
                          width: `${(component.raw_score / data.total_score) * 100}%`,
                        }}
                      />
                    )}

                    {/* Smoothed Score Bar (foreground) */}
                    <div
                      className={cn(
                        'absolute h-full transition-all',
                        idx === 0 && 'bg-chart-1',
                        idx === 1 && 'bg-chart-2',
                        idx === 2 && 'bg-chart-3',
                        idx === 3 && 'bg-chart-4',
                        idx >= 4 && 'bg-chart-5'
                      )}
                      style={{
                        width: `${barWidth}%`,
                      }}
                    />

                    {/* Contribution Label */}
                    <div className="absolute inset-0 flex items-center px-3">
                      <span className="text-xs font-medium text-foreground/90">
                        {component.contribution_percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Before/After Smoothing Details */}
                  {isSmoothed && (
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pl-2">
                      <span>Raw: {component.raw_score.toFixed(3)}</span>
                      <span>→</span>
                      <span>Smoothed: {component.smoothed_score.toFixed(3)}</span>
                      <span className={cn(
                        'font-medium',
                        smoothingDelta > 0 ? 'text-chart-1' : 'text-chart-5'
                      )}>
                        {smoothingDelta > 0 ? '+' : ''}{smoothingDelta.toFixed(3)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="pt-4 border-t">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold">
                  {data.components.length}
                </div>
                <div className="text-xs text-muted-foreground">Components</div>
              </div>
              <div>
                <div className="text-lg font-bold">
                  {data.components.filter(c => c.smoothed_score !== c.raw_score).length}
                </div>
                <div className="text-xs text-muted-foreground">Smoothed</div>
              </div>
              <div>
                <div className="text-lg font-bold text-chart-1">
                  {Math.max(...data.components.map(c => c.contribution_percentage)).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Top Contributor</div>
              </div>
            </div>
          </div>

          {/* Top Contributors */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">Top Contributors</h4>
            <div className="space-y-2">
              {data.components
                .sort((a, b) => b.contribution_percentage - a.contribution_percentage)
                .slice(0, 3)
                .map((component, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        #{idx + 1}
                      </Badge>
                      <span className="text-sm font-medium">{component.component}</span>
                    </div>
                    <span className="text-sm font-mono">
                      {component.contribution_percentage.toFixed(1)}%
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Legend */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Legend</h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-muted-foreground/20" />
                <span>Raw score (before smoothing)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-chart-1" />
                <span>Smoothed score (final contribution)</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
