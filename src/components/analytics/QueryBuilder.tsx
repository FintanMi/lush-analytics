/**
 * Query Builder Component
 * 
 * Visual interface for building analytics queries with the Query Execution Model
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PlayIcon, PlusIcon, TrashIcon, CodeIcon } from 'lucide-react';
import type { QueryRequest, TransformOperator, OutputFormat } from '@/types/query-execution';

interface QueryBuilderProps {
  sellerId: string;
  onExecute: (request: QueryRequest) => void;
  isExecuting?: boolean;
}

export function QueryBuilder({ sellerId, onExecute, isExecuting = false }: QueryBuilderProps) {
  const [queryType, setQueryType] = useState<QueryRequest['queryType']>('ANOMALY');
  const [operators, setOperators] = useState<TransformOperator[]>(['FIR', 'FFT']);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('JSON');
  const [timeWindow, setTimeWindow] = useState({
    start: Date.now() - 3600000, // 1 hour ago
    end: Date.now(),
  });
  const [constraints, setConstraints] = useState({
    maxLatencyMs: 5000,
    minConfidence: 0.8,
  });

  const availableOperators: TransformOperator[] = [
    'FIR',
    'FFT',
    'HFD',
    'WAVELET',
    'KALMAN',
    'NORMALIZE',
    'DETREND',
    'RESAMPLE',
  ];

  const handleAddOperator = (operator: TransformOperator) => {
    if (!operators.includes(operator)) {
      setOperators([...operators, operator]);
    }
  };

  const handleRemoveOperator = (index: number) => {
    setOperators(operators.filter((_, i) => i !== index));
  };

  const handleExecute = () => {
    const request: QueryRequest = {
      sellerId,
      queryType,
      window: timeWindow,
      operators,
      output: [outputFormat],
      constraints,
    };

    onExecute(request);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CodeIcon className="size-5" />
          Query Builder
        </CardTitle>
        <CardDescription>
          Build and execute analytics queries with explicit query planning
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Query Type */}
        <div className="space-y-2">
          <Label>Query Type</Label>
          <Select value={queryType} onValueChange={(v) => setQueryType(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ANOMALY">Anomaly Detection</SelectItem>
              <SelectItem value="PREDICTION">Prediction</SelectItem>
              <SelectItem value="INSIGHT">Insight Generation</SelectItem>
              <SelectItem value="FUNNEL">Funnel Analysis</SelectItem>
              <SelectItem value="CUSTOM">Custom Query</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Transform Operators */}
        <div className="space-y-3">
          <Label>Transform Operators (Pipeline)</Label>
          <div className="flex flex-wrap gap-2">
            {operators.map((op, index) => (
              <Badge key={index} variant="secondary" className="gap-2">
                {op}
                <button
                  type="button"
                  onClick={() => handleRemoveOperator(index)}
                  className="hover:text-destructive"
                >
                  <TrashIcon className="size-3" />
                </button>
              </Badge>
            ))}
          </div>

          <Select onValueChange={(v) => handleAddOperator(v as TransformOperator)}>
            <SelectTrigger>
              <SelectValue placeholder="Add operator..." />
            </SelectTrigger>
            <SelectContent>
              {availableOperators.map((op) => (
                <SelectItem key={op} value={op} disabled={operators.includes(op)}>
                  {op}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Output Format */}
        <div className="space-y-2">
          <Label>Output Format</Label>
          <Select value={outputFormat} onValueChange={(v) => setOutputFormat(v as OutputFormat)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="JSON">JSON</SelectItem>
              <SelectItem value="TIME_SERIES">Time Series</SelectItem>
              <SelectItem value="AGGREGATED">Aggregated</SelectItem>
              <SelectItem value="SCORED">Scored</SelectItem>
              <SelectItem value="ATTRIBUTED">Attributed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Constraints */}
        <div className="space-y-3">
          <Label>Execution Constraints</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Max Latency (ms)</Label>
              <input
                type="number"
                value={constraints.maxLatencyMs}
                onChange={(e) =>
                  setConstraints({ ...constraints, maxLatencyMs: Number(e.target.value) })
                }
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Min Confidence</Label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={constraints.minConfidence}
                onChange={(e) =>
                  setConstraints({ ...constraints, minConfidence: Number(e.target.value) })
                }
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Execute Button */}
        <Button onClick={handleExecute} disabled={isExecuting} className="w-full" size="lg">
          <PlayIcon className="mr-2 size-4" />
          {isExecuting ? 'Executing Query...' : 'Execute Query'}
        </Button>

        {/* Query Summary */}
        <div className="rounded-lg border border-border bg-muted p-4 text-sm">
          <div className="font-medium mb-2">Query Summary</div>
          <div className="space-y-1 text-muted-foreground">
            <div>Type: {queryType}</div>
            <div>Operators: {operators.length > 0 ? operators.join(' → ') : 'None'}</div>
            <div>Output: {outputFormat}</div>
            <div>Max Latency: {constraints.maxLatencyMs}ms</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
