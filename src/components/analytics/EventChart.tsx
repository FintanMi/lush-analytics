import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Event } from '@/types/analytics';
import { format } from 'date-fns';

interface EventChartProps {
  events: Event[];
  title?: string;
  description?: string;
}

export function EventChart({ events, title = 'Event Timeline', description }: EventChartProps) {
  const salesData = events.filter(e => e.type === 'SALE').map(e => ({
    timestamp: e.timestamp,
    Sales: e.value,
  }));

  const clicksData = events.filter(e => e.type === 'CLICK').map(e => ({
    timestamp: e.timestamp,
    Clicks: e.value,
  }));

  const viewsData = events.filter(e => e.type === 'VIEW').map(e => ({
    timestamp: e.timestamp,
    Views: e.value,
  }));

  const allTimestamps = [...new Set(events.map(e => e.timestamp))].sort((a, b) => a - b);
  const combinedData = allTimestamps.map(timestamp => {
    const sale = salesData.find(d => d.timestamp === timestamp);
    const click = clicksData.find(d => d.timestamp === timestamp);
    const view = viewsData.find(d => d.timestamp === timestamp);
    
    return {
      timestamp,
      Sales: sale?.Sales || 0,
      Clicks: click?.Clicks || 0,
      Views: view?.Views || 0,
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium mb-2">{format(new Date(data.timestamp), 'MMM dd, yyyy HH:mm')}</p>
          {payload.map((entry: any) => (
            <p key={entry.name} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={combinedData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="timestamp"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(timestamp) => format(new Date(timestamp), 'MMM dd HH:mm')}
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="Sales" 
              stroke="hsl(var(--chart-1))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--chart-1))' }}
            />
            <Line 
              type="monotone" 
              dataKey="Clicks" 
              stroke="hsl(var(--chart-2))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--chart-2))' }}
            />
            <Line 
              type="monotone" 
              dataKey="Views" 
              stroke="hsl(var(--chart-3))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--chart-3))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
