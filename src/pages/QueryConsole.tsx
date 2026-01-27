/**
 * Query Console Page
 * 
 * Interactive console for building and executing analytics queries
 * with the Query Execution Model
 */

import { useState, useEffect } from 'react';
import { QueryBuilder } from '@/components/analytics/QueryBuilder';
import { QueryExecutionMonitor } from '@/components/analytics/QueryExecutionMonitor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  TerminalIcon,
  HistoryIcon,
  ActivityIcon,
  DatabaseIcon,
  RefreshCwIcon,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { QueryRequest, QueryExecution, WorkerPool } from '@/types/query-execution';
import { toast } from '@/hooks/use-toast';

export default function QueryConsole() {
  const [currentExecution, setCurrentExecution] = useState<QueryExecution | null>(null);
  const [executionHistory, setExecutionHistory] = useState<QueryExecution[]>([]);
  const [workerPools, setWorkerPools] = useState<WorkerPool[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [sellerId, setSellerId] = useState<string>('');

  useEffect(() => {
    loadSellerId();
    loadExecutionHistory();
    loadWorkerPoolStats();
  }, []);

  const loadSellerId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: sellers } = await supabase
      .from('sellers')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (sellers) {
      setSellerId(sellers.id);
    }
  };

  const loadExecutionHistory = async () => {
    const { data } = await supabase
      .from('query_execution')
      .select('*')
      .order('submitted_at', { ascending: false })
      .limit(10);

    if (data) {
      setExecutionHistory(data as any);
    }
  };

  const loadWorkerPoolStats = async () => {
    const { data } = await supabase
      .from('worker_pool_stats')
      .select('*')
      .order('measured_at', { ascending: false })
      .limit(5);

    if (data) {
      // Group by queue_type and get latest
      const latest = new Map<string, any>();
      for (const stat of data) {
        if (!latest.has(stat.queue_type)) {
          latest.set(stat.queue_type, stat);
        }
      }

      setWorkerPools(
        Array.from(latest.values()).map((s) => ({
          queue: s.queue_type,
          maxWorkers: s.max_workers,
          activeWorkers: s.active_workers,
          queueDepth: s.queue_depth,
          avgProcessingTimeMs: s.avg_processing_time_ms,
          backpressure: {
            enabled: s.backpressure_enabled,
            threshold: s.backpressure_threshold,
            rejectionRate: s.rejection_rate,
          },
        }))
      );
    }
  };

  const handleExecuteQuery = async (request: QueryRequest) => {
    setIsExecuting(true);

    try {
      const { data, error } = await supabase.functions.invoke('query-executor', {
        body: request,
      });

      if (error) throw error;

      toast({
        title: 'Query Executed',
        description: 'Query completed successfully',
      });

      // Reload history
      await loadExecutionHistory();

      // Set current execution (mock for now)
      setCurrentExecution({
        id: crypto.randomUUID(),
        sellerId: request.sellerId,
        queryPlan: data.plan,
        status: 'COMPLETED',
        submittedAt: Date.now(),
        completedAt: Date.now() + 1000,
        reproducibilityHash: data.plan.reproducibilityHash,
        configVersion: '1.0.0',
      });
    } catch (error: any) {
      toast({
        title: 'Query Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <TerminalIcon className="size-8" />
            Query Console
          </h1>
          <p className="text-muted-foreground mt-1">
            Build and execute analytics queries with explicit query planning
          </p>
        </div>
        <Button variant="outline" onClick={loadExecutionHistory}>
          <RefreshCwIcon className="mr-2 size-4" />
          Refresh
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Column: Query Builder */}
        <div className="space-y-6">
          <QueryBuilder
            sellerId={sellerId}
            onExecute={handleExecuteQuery}
            isExecuting={isExecuting}
          />

          {/* Worker Pool Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ActivityIcon className="size-5" />
                Worker Pools
              </CardTitle>
              <CardDescription>Real-time execution queue statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workerPools.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    No worker pool data available
                  </div>
                ) : (
                  workerPools.map((pool) => (
                    <div
                      key={pool.queue}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div className="space-y-1">
                        <div className="font-medium capitalize">{pool.queue}</div>
                        <div className="text-xs text-muted-foreground">
                          {pool.activeWorkers}/{pool.maxWorkers} workers • Queue: {pool.queueDepth}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {pool.backpressure.enabled && (
                          <Badge variant="destructive" className="text-xs">
                            Backpressure
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {pool.avgProcessingTimeMs}ms
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Execution Monitor & History */}
        <div className="space-y-6">
          <QueryExecutionMonitor execution={currentExecution} onRefresh={loadExecutionHistory} />

          {/* Execution History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HistoryIcon className="size-5" />
                Execution History
              </CardTitle>
              <CardDescription>Recent query executions</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {executionHistory.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No execution history
                    </div>
                  ) : (
                    executionHistory.map((exec) => (
                      <button
                        key={exec.id}
                        type="button"
                        onClick={() => setCurrentExecution(exec as any)}
                        className="w-full text-left rounded-lg border border-border p-3 hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <code className="text-xs font-mono">{exec.id.slice(0, 8)}...</code>
                          <Badge
                            variant={
                              exec.status === 'COMPLETED'
                                ? 'default'
                                : exec.status === 'FAILED'
                                ? 'destructive'
                                : 'outline'
                            }
                            className="text-xs"
                          >
                            {exec.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {(exec as any).query_type} • {new Date((exec as any).submitted_at).toLocaleString()}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Section: Data Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DatabaseIcon className="size-5" />
            Data Sources
          </CardTitle>
          <CardDescription>Available data sources for federated queries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { name: 'Ring Buffer', type: 'RING_BUFFER', status: 'healthy' },
              { name: 'Aggregate Store', type: 'AGGREGATE_STORE', status: 'healthy' },
              { name: 'Metrics Cache', type: 'CACHED_METRICS', status: 'healthy' },
              { name: 'Historical Store', type: 'HISTORICAL_COLD_STORE', status: 'healthy' },
            ].map((source) => (
              <div
                key={source.type}
                className="rounded-lg border border-border p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{source.name}</div>
                  <Badge
                    variant={source.status === 'healthy' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {source.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">{source.type}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
