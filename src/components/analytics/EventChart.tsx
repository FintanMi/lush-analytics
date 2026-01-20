import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Event } from '@/types/analytics';

interface EventChartProps {
  events: Event[];
  title?: string;
  description?: string;
}

export function EventChart({ events, title = 'Event Timeline', description }: EventChartProps) {
  const chartData = events.map((event) => ({
    time: new Date(event.timestamp).toLocaleTimeString(),
    value: event.value,
    type: event.type,
  }));

  const salesData = events.filter(e => e.type === 'SALE').map(e => ({
    time: new Date(e.timestamp).toLocaleTimeString(),
    Sales: e.value,
  }));

  const clicksData = events.filter(e => e.type === 'CLICK').map(e => ({
    time: new Date(e.timestamp).toLocaleTimeString(),
    Clicks: e.value,
  }));

  const viewsData = events.filter(e => e.type === 'VIEW').map(e => ({
    time: new Date(e.timestamp).toLocaleTimeString(),
    Views: e.value,
  }));

  const allTimes = [...new Set(events.map(e => new Date(e.timestamp).toLocaleTimeString()))];
  const combinedData = allTimes.map(time => {
    const sale = salesData.find(d => d.time === time);
    const click = clicksData.find(d => d.time === time);
    const view = viewsData.find(d => d.time === time);
    
    return {
      time,
      Sales: sale?.Sales || 0,
      Clicks: click?.Clicks || 0,
      Views: view?.Views || 0,
    };
  });

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
