import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import type { PredictionResponse } from '@/types/analytics';

interface PredictionChartProps {
  data: PredictionResponse;
  title?: string;
}

export function PredictionChart({ data, title = 'Sales Prediction' }: PredictionChartProps) {
  const chartData = [
    ...data.historical.map((point) => ({
      time: new Date(point.timestamp).toLocaleTimeString(),
      actual: point.value,
      predicted: null,
      confidence: null,
    })),
    ...data.predictions.map((point) => ({
      time: new Date(point.timestamp).toLocaleTimeString(),
      actual: null,
      predicted: point.predicted,
      confidence: point.confidence * 100,
    })),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Historical data and {data.metadata.predictionSteps} step forecast
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="time" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="actual" 
              stroke="hsl(var(--chart-1))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--chart-1))' }}
              name="Actual"
            />
            <Line 
              type="monotone" 
              dataKey="predicted" 
              stroke="hsl(var(--chart-3))" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: 'hsl(var(--chart-3))' }}
              name="Predicted"
            />
            <Area
              type="monotone"
              dataKey="confidence"
              fill="hsl(var(--chart-3))"
              fillOpacity={0.1}
              stroke="none"
              name="Confidence %"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
