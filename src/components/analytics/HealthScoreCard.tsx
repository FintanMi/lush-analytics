import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { SellerHealthScore } from '@/types/analytics';

interface HealthScoreCardProps {
  healthScore: SellerHealthScore;
}

export function HealthScoreCard({ healthScore }: HealthScoreCardProps) {
  const getTrendIcon = () => {
    switch (healthScore.trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = () => {
    switch (healthScore.trend) {
      case 'improving':
        return 'badge-success';
      case 'declining':
        return 'badge-critical';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-success';
    if (score >= 0.6) return 'text-info';
    if (score >= 0.4) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Seller Health Score</CardTitle>
          <Badge className={getTrendColor()}>
            <span className="flex items-center gap-1">
              {getTrendIcon()}
              {healthScore.trend}
            </span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className={`text-5xl font-bold ${getScoreColor(healthScore.overall)}`}>
            {(healthScore.overall * 100).toFixed(0)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">Overall Health</p>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Volatility</span>
              <span className="font-medium">{(healthScore.volatility * 100).toFixed(0)}%</span>
            </div>
            <Progress value={healthScore.volatility * 100} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Anomaly Frequency</span>
              <span className="font-medium">{(healthScore.anomalyFrequency * 100).toFixed(0)}%</span>
            </div>
            <Progress value={healthScore.anomalyFrequency * 100} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Predictive Risk</span>
              <span className="font-medium">{(healthScore.predictiveRisk * 100).toFixed(0)}%</span>
            </div>
            <Progress value={healthScore.predictiveRisk * 100} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Data Consistency</span>
              <span className="font-medium">{(healthScore.dataConsistency * 100).toFixed(0)}%</span>
            </div>
            <Progress value={healthScore.dataConsistency * 100} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
