/**
 * Query Execution Monitor Component
 * 
 * Real-time monitoring of query execution with DAG visualization
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ActivityIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DatabaseIcon,
  CpuIcon,
  NetworkIcon,
} from 'lucide-react';
import type { QueryExecution, ExecutionStatus } from '@/types/query-execution';

interface QueryExecutionMonitorProps {
  execution: QueryExecution | null;
  onRefresh?: () => void;
}

export function QueryExecutionMonitor({ execution, onRefresh }: QueryExecutionMonitorProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!execution) return;

    if (execution.status === 'COMPLETED') {
      setProgress(100);
    } else if (execution.status === 'RUNNING') {
      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [execution]);

  if (!execution) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ActivityIcon className="size-5" />
            Execution Monitor
          </CardTitle>
          <CardDescription>No active execution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            Execute a query to see real-time monitoring
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleIcon className="size-5 text-success" />;
      case 'FAILED':
      case 'TIMEOUT':
      case 'CANCELLED':
        return <XCircleIcon className="size-5 text-destructive" />;
      case 'RUNNING':
        return <ActivityIcon className="size-5 text-primary animate-pulse" />;
      default:
        return <ClockIcon className="size-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: ExecutionStatus) => {
    const variants: Record<ExecutionStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      PENDING: 'outline',
      COMPILING: 'secondary',
      QUEUED: 'secondary',
      RUNNING: 'default',
      COMPLETED: 'default',
      FAILED: 'destructive',
      CANCELLED: 'destructive',
      TIMEOUT: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status}
      </Badge>
    );
  };

  const latency = execution.completedAt && execution.startedAt
    ? execution.completedAt - execution.startedAt
    : execution.startedAt
    ? Date.now() - execution.startedAt
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(execution.status)}
            Execution Monitor
          </div>
          {getStatusBadge(execution.status)}
        </CardTitle>
        <CardDescription>Query ID: {execution.id.slice(0, 8)}...</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        {execution.status === 'RUNNING' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Execution Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        <Separator />

        {/* Execution Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ClockIcon className="size-4" />
              Latency
            </div>
            <div className="text-2xl font-bold">{latency}ms</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DatabaseIcon className="size-4" />
              Nodes
            </div>
            <div className="text-2xl font-bold">
              {execution.stats?.nodesExecuted || 0} / {execution.queryPlan.nodes.length}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CpuIcon className="size-4" />
              Cache Hits
            </div>
            <div className="text-2xl font-bold">{execution.stats?.cacheHits || 0}</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <NetworkIcon className="size-4" />
              Data Points
            </div>
            <div className="text-2xl font-bold">
              {execution.stats?.dataPointsProcessed?.toLocaleString() || 0}
            </div>
          </div>
        </div>

        <Separator />

        {/* Query Plan DAG */}
        <div className="space-y-3">
          <div className="font-medium text-sm">Query Plan (DAG)</div>
          <ScrollArea className="h-48 rounded-lg border border-border bg-muted p-4">
            <div className="space-y-2">
              {execution.queryPlan.nodes.map((node, index) => (
                <div
                  key={node.id}
                  className="flex items-center gap-3 rounded-md bg-background p-3 text-sm"
                >
                  <div className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{node.type}</div>
                    <div className="text-xs text-muted-foreground">
                      {node.type === 'TRANSFORM' && (node.config as any).operator}
                      {node.type === 'SCORE' && (node.config as any).scoreType}
                      {node.type === 'OUTPUT' && (node.config as any).format}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {node.dependencies.length} deps
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <Separator />

        {/* Reproducibility Info */}
        <div className="space-y-2">
          <div className="font-medium text-sm">Reproducibility</div>
          <div className="rounded-lg border border-border bg-muted p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Hash</span>
              <code className="font-mono">{execution.reproducibilityHash}</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Config Version</span>
              <code className="font-mono">{execution.configVersion}</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Execution Mode</span>
              <Badge variant="outline">{execution.queryPlan.executionMode}</Badge>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {execution.error && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="font-medium text-sm text-destructive">Error</div>
              <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                {execution.error}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
