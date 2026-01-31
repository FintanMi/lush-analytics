import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { LiveDAGHeatmap, LiveDAGNode } from '@/types/analytics';
import { AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveDAGHeatmapProps {
  data: LiveDAGHeatmap | null;
  loading?: boolean;
}

export default function LiveDAGHeatmapVisualization({ data, loading }: LiveDAGHeatmapProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Live Query DAG Heatmap</CardTitle>
          <CardDescription>Real-time query execution visualization</CardDescription>
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
          <CardTitle>Live Query DAG Heatmap</CardTitle>
          <CardDescription>No query execution data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>Execute a query to see the DAG visualization</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getNodeColor = (node: LiveDAGNode): string => {
    const latencyThresholds = { low: 100, medium: 500, high: 1000 };
    
    if (node.status === 'failed') return 'bg-destructive';
    if (node.status === 'pending') return 'bg-muted';
    if (node.latency_ms < latencyThresholds.low) return 'bg-chart-1';
    if (node.latency_ms < latencyThresholds.medium) return 'bg-chart-3';
    return 'bg-chart-5';
  };

  const getNodeIcon = (node: LiveDAGNode) => {
    switch (node.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      case 'running':
        return <Zap className="h-4 w-4 animate-pulse" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Live Query DAG Heatmap</CardTitle>
            <CardDescription>
              Query ID: {data.query_id} • Total Latency: {data.total_latency_ms}ms
            </CardDescription>
          </div>
          <Badge variant={data.bottleneck_nodes.length > 0 ? 'destructive' : 'default'}>
            {data.bottleneck_nodes.length} Bottlenecks
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Node Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.nodes.map((node) => (
              <div
                key={node.node_id}
                className={cn(
                  'p-4 rounded-lg border transition-all hover:shadow-md',
                  getNodeColor(node),
                  data.bottleneck_nodes.includes(node.node_id) && 'ring-2 ring-destructive'
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getNodeIcon(node)}
                    <span className="font-medium text-sm">{node.node_type}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {node.latency_ms}ms
                  </Badge>
                </div>
                
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Cost:</span>
                    <span className="font-mono">{node.cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cache:</span>
                    <span className="font-mono">{(node.cache_usage * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sufficiency:</span>
                    <Badge variant="secondary" className="text-xs">
                      {node.data_sufficiency}
                    </Badge>
                  </div>
                </div>

                {node.invariants_checked.length > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      ✓ {node.invariants_checked.length} invariants
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Edge Visualization */}
          {data.edges.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-3">Data Flow</h4>
              <div className="space-y-2">
                {data.edges.map((edge, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2 rounded bg-muted/50 text-sm"
                  >
                    <span className="font-mono text-xs">{edge.from_node}</span>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 h-px bg-border" />
                      <Badge variant="outline" className="text-xs">
                        {edge.data_flow_mb.toFixed(2)} MB
                      </Badge>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <span className="font-mono text-xs">{edge.to_node}</span>
                    <span className="text-xs text-muted-foreground">
                      +{edge.latency_contribution_ms}ms
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="mt-6 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Legend</h4>
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-chart-1" />
                <span>Fast (&lt;100ms)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-chart-3" />
                <span>Medium (100-500ms)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-chart-5" />
                <span>Slow (&gt;500ms)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-destructive" />
                <span>Failed</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
