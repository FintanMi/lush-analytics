import { useState, useEffect } from 'react';
import { analyticsApi } from '@/services/analytics';
import { EventForm } from '@/components/analytics/EventForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Seller, Event } from '@/types/analytics';

export default function EventIngestion() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const sellersData = await analyticsApi.getSellers();
      setSellers(sellersData);

      if (sellersData.length > 0) {
        const eventsData = await analyticsApi.getEvents(sellersData[0].id, undefined, 20);
        setRecentEvents(eventsData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventSuccess = () => {
    loadData();
  };

  const getEventTypeBadge = (type: string) => {
    const variants = {
      SALE: 'bg-chart-1 text-primary-foreground',
      CLICK: 'bg-chart-2 text-success-foreground',
      VIEW: 'bg-chart-3 text-warning-foreground',
    };
    return variants[type as keyof typeof variants] || 'bg-muted';
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64 bg-muted" />
        <div className="grid gap-6 xl:grid-cols-2">
          <Skeleton className="h-96 bg-muted" />
          <Skeleton className="h-96 bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Event Ingestion</h1>
        <p className="text-muted-foreground">Submit events to the analytics system</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <EventForm sellers={sellers} onSuccess={handleEventSuccess} />

        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>Latest events submitted to the system</CardDescription>
          </CardHeader>
          <CardContent>
            {recentEvents.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No events yet. Submit your first event!
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={getEventTypeBadge(event.type)}>
                        {event.type}
                      </Badge>
                      <div>
                        <p className="font-medium">${event.value.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {sellers.find(s => s.id === event.seller_id)?.name || 'Unknown'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
          <CardDescription>How to integrate with the analytics API</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">POST /events</h3>
            <p className="text-sm text-muted-foreground mb-2">Submit a new event</p>
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`{
  "sellerId": "uuid",
  "timestamp": 1234567890000,
  "type": "SALE" | "CLICK" | "VIEW",
  "value": 99.99
}`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">GET /metrics/:seller/anomalies</h3>
            <p className="text-sm text-muted-foreground mb-2">Get anomaly detection score</p>
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`{
  "anomalyScore": 0.85,
  "metrics": {
    "periodicScore": 0.72,
    "hfd": 1.45,
    "dataPoints": 512
  }
}`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">GET /metrics/:seller/predictions</h3>
            <p className="text-sm text-muted-foreground mb-2">Get sales predictions</p>
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`{
  "predictions": [
    {
      "timestamp": 1234567890000,
      "predicted": 150.5,
      "confidence": 0.85
    }
  ]
}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
