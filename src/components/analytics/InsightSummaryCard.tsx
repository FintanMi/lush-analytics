import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, Download, Mail } from 'lucide-react';
import type { InsightSummary } from '@/types/analytics';
import { getConfidenceMessage, getSufficiencyMessage } from '@/config/analytics';

interface InsightSummaryCardProps {
  summary: InsightSummary;
  onExport?: (type: 'pdf' | 'email') => void;
}

export function InsightSummaryCard({ summary, onExport }: InsightSummaryCardProps) {
  const getTrendIcon = () => {
    if (summary.overallHealth >= 0.7) return <TrendingUp className="h-5 w-5 text-success" />;
    if (summary.overallHealth >= 0.4) return <Minus className="h-5 w-5 text-warning" />;
    return <TrendingDown className="h-5 w-5 text-destructive" />;
  };

  const getHealthColor = () => {
    if (summary.overallHealth >= 0.7) return 'text-success';
    if (summary.overallHealth >= 0.4) return 'text-warning';
    return 'text-destructive';
  };

  const getSufficiencyBadge = () => {
    const colors = {
      insufficient: 'badge-critical',
      minimal: 'badge-warning',
      adequate: 'badge-info',
      optimal: 'badge-success',
    };
    return colors[summary.dataSufficiency];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Insight Summary</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport?.('pdf')}
              disabled={!onExport}
            >
              <Download className="h-4 w-4 mr-1" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport?.('email')}
              disabled={!onExport}
            >
              <Mail className="h-4 w-4 mr-1" />
              Email
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <span className="text-sm text-muted-foreground">Overall Health</span>
          </div>
          <span className={`text-2xl font-bold ${getHealthColor()}`}>
            {(summary.overallHealth * 100).toFixed(0)}%
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Period</span>
            <span className="font-medium">{summary.period}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Anomalies Detected</span>
            <Badge variant={summary.anomalyCount > 5 ? 'destructive' : summary.anomalyCount > 2 ? 'default' : 'secondary'}>
              {summary.anomalyCount}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Data Quality</span>
            <Badge className={getSufficiencyBadge()}>
              {summary.dataSufficiency.toUpperCase()}
            </Badge>
          </div>
        </div>

        <div className="pt-3 border-t border-border space-y-2">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Top Issue</p>
            <p className="text-sm font-medium">{summary.topIssue}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Recommendation</p>
            <p className="text-sm">{summary.recommendation}</p>
          </div>
        </div>

        <div className="pt-3 border-t border-border space-y-1">
          <p className="text-xs text-muted-foreground">
            {getConfidenceMessage(summary.confidence, summary.dataSufficiency)}
          </p>
          <p className="text-xs text-muted-foreground">
            {getSufficiencyMessage(summary.dataSufficiency, 0)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
