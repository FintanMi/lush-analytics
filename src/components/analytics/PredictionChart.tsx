import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart, ReferenceLine } from 'recharts';
import type { PredictionResponse } from '@/types/analytics';
import { format } from 'date-fns';

interface PredictionChartProps {
  data: PredictionResponse;
  title?: string;
}

export function PredictionChart({ data, title = 'Sales Prediction' }: PredictionChartProps) {
  const chartData = [
    ...data.historical.map((point) => ({
      timestamp: point.timestamp,
      actual: point.value,
      predicted: null,
      upperBound: null,
      lowerBound: null,
      label: format(new Date(point.timestamp), 'MMM dd HH:mm'),
    })),
    ...data.predictions.map((point) => ({
      timestamp: point.timestamp,
      actual: null,
      predicted: point.predicted,
      upperBound: point.upperBound || point.predicted,
      lowerBound: point.lowerBound || point.predicted,
      label: format(new Date(point.timestamp), 'MMM dd HH:mm'),
    })),
  ];

  const predictionStartTimestamp = data.predictions.length > 0 ? data.predictions[0].timestamp : null;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium mb-1">{format(new Date(data.timestamp), 'MMM dd, yyyy HH:mm')}</p>
          {data.actual !== null && (
            <p className="text-sm text-chart-1">Actual: ${data.actual.toFixed(2)}</p>
          )}
          {data.predicted !== null && (
            <>
              <p className="text-sm text-chart-3">Predicted: ${data.predicted.toFixed(2)}</p>
              {data.upperBound && data.lowerBound && (
                <p className="text-xs text-muted-foreground mt-1">
                  Range: ${data.lowerBound.toFixed(2)} - ${data.upperBound.toFixed(2)}
                </p>
              )}
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Historical data and {data.metadata.predictionSteps} step forecast with confidence bands
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="timestamp"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(timestamp) => format(new Date(timestamp), 'HH:mm')}
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {predictionStartTimestamp && (
              <ReferenceLine 
                x={predictionStartTimestamp} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="5 5"
                label={{ value: 'Forecast Start', position: 'top', fill: 'hsl(var(--muted-foreground))' }}
              />
            )}

            <Area
              type="monotone"
              dataKey="upperBound"
              stroke="none"
              fill="hsl(var(--chart-3))"
              fillOpacity={0.1}
              name="Confidence Band"
            />
            <Area
              type="monotone"
              dataKey="lowerBound"
              stroke="none"
              fill="hsl(var(--chart-3))"
              fillOpacity={0.1}
            />
            
            <Line 
              type="monotone" 
              dataKey="actual" 
              stroke="hsl(var(--chart-1))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--chart-1))', r: 3 }}
              name="Actual"
              connectNulls={false}
            />
            <Line 
              type="monotone" 
              dataKey="predicted" 
              stroke="hsl(var(--chart-3))" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: 'hsl(var(--chart-3))', r: 3 }}
              name="Predicted"
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
