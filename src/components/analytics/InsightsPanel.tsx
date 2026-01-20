import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, Activity, AlertTriangle } from 'lucide-react';
import type { AutoInsight } from '@/types/analytics';

interface InsightsPanelProps {
  insights: AutoInsight[];
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'anomaly':
        return <AlertTriangle className="h-4 w-4" />;
      case 'trend':
        return <TrendingUp className="h-4 w-4" />;
      case 'pattern':
        return <Activity className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'badge-critical';
      case 'high':
        return 'badge-warning';
      case 'medium':
        return 'badge-info';
      default:
        return 'badge-success';
    }
  };

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Auto-Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No insights available yet. Add more data to generate insights.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Auto-Insights ({insights.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight, index) => (
          <div key={index} className="border border-border rounded-lg p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {getIcon(insight.type)}
                <h4 className="font-semibold text-sm">{insight.title}</h4>
              </div>
              <Badge className={getSeverityClass(insight.severity)}>
                {insight.severity}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground">{insight.description}</p>
            
            {insight.attribution && insight.attribution.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Root Cause Breakdown:</p>
                {insight.attribution.map((attr, attrIndex) => (
                  <div key={attrIndex} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{attr.factor}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${attr.contribution * 100}%` }}
                        />
                      </div>
                      <span className="font-medium w-10 text-right">
                        {(attr.contribution * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Confidence: {(insight.confidence * 100).toFixed(0)}%
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(insight.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
