import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SignalQualityOverlay } from '@/types/analytics';
import { AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { cn } from '@/lib/utils';

interface SignalQualityOverlayProps {
  data: SignalQualityOverlay[] | null;
  loading?: boolean;
}

export default function SignalQualityOverlayVisualization({ data, loading }: SignalQualityOverlayProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Signal Quality Overlay</CardTitle>
          <CardDescription>Real-time confidence and sufficiency tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Signal Quality Overlay</CardTitle>
          <CardDescription>No signal quality data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            <p>Collect data to see signal quality metrics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = data.map((point) => ({
    timestamp: new Date(point.timestamp).toLocaleTimeString(),
    timestampRaw: point.timestamp,
    upper: point.confidence_band_upper,
    lower: point.confidence_band_lower,
    sufficiency: point.sufficiency_score * 100,
    snr: point.quality_indicators.snr,
    ess: point.quality_indicators.ess,
    stability: point.quality_indicators.stability * 100,
    coverage: point.quality_indicators.coverage * 100,
    degraded: point.degraded_mode,
  }));

  const degradedCount = data.filter(d => d.degraded_mode).length;
  const avgSufficiency = data.reduce((sum, d) => sum + d.sufficiency_score, 0) / data.length;
  const avgSNR = data.reduce((sum, d) => sum + d.quality_indicators.snr, 0) / data.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Signal Quality Overlay</CardTitle>
            <CardDescription>
              Confidence bands and quality indicators over time
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {degradedCount > 0 ? (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {degradedCount} Degraded
              </Badge>
            ) : (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Healthy
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Confidence Bands Chart */}
          <div>
            <h4 className="text-sm font-medium mb-3">Confidence Bands</h4>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="timestamp"
                  className="text-xs"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="upper"
                  stroke="hsl(var(--chart-1))"
                  fill="hsl(var(--chart-1))"
                  fillOpacity={0.2}
                  name="Upper Bound"
                />
                <Area
                  type="monotone"
                  dataKey="lower"
                  stroke="hsl(var(--chart-1))"
                  fill="hsl(var(--chart-1))"
                  fillOpacity={0.2}
                  name="Lower Bound"
                />
                <Line
                  type="monotone"
                  dataKey="sufficiency"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={2}
                  dot={false}
                  name="Sufficiency %"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Quality Indicators Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Avg SNR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgSNR.toFixed(1)} dB</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {avgSNR > 20 ? 'Optimal' : avgSNR > 10 ? 'Adequate' : 'Low'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Avg Sufficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(avgSufficiency * 100).toFixed(0)}%</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {avgSufficiency > 0.8 ? 'Optimal' : avgSufficiency > 0.5 ? 'Adequate' : 'Low'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Degraded Periods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{degradedCount}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {((degradedCount / data.length) * 100).toFixed(1)}% of time
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Data Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.length}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Time series length
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quality Indicators Timeline */}
          <div>
            <h4 className="text-sm font-medium mb-3">Quality Indicators Over Time</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="timestamp"
                  className="text-xs"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="snr"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={false}
                  name="SNR (dB)"
                />
                <Line
                  type="monotone"
                  dataKey="stability"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={false}
                  name="Stability %"
                />
                <Line
                  type="monotone"
                  dataKey="coverage"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={2}
                  dot={false}
                  name="Coverage %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Degraded Mode Alerts */}
          {degradedCount > 0 && (
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-3">
                <TrendingDown className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-amber-600 mb-2">
                    Degraded Mode Detected
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Signal quality dropped below acceptable thresholds during {degradedCount} time periods.
                    Confidence in analytics results may be reduced during these intervals.
                  </p>
                  <div className="space-y-2">
                    {chartData
                      .filter(d => d.degraded)
                      .slice(0, 5)
                      .map((point, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs p-2 rounded bg-background/50"
                        >
                          <span className="font-mono">{point.timestamp}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              SNR: {point.snr.toFixed(1)} dB
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Sufficiency: {point.sufficiency.toFixed(0)}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    {chartData.filter(d => d.degraded).length > 5 && (
                      <div className="text-xs text-muted-foreground text-center">
                        ... and {chartData.filter(d => d.degraded).length - 5} more
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Metrics Explained</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium">SNR (Signal-to-Noise Ratio):</span>
                <p className="text-muted-foreground text-xs mt-1">
                  Measures data quality. Higher is better. &gt;20dB is optimal.
                </p>
              </div>
              <div>
                <span className="font-medium">ESS (Effective Sample Size):</span>
                <p className="text-muted-foreground text-xs mt-1">
                  Adjusted sample count accounting for autocorrelation.
                </p>
              </div>
              <div>
                <span className="font-medium">Stability:</span>
                <p className="text-muted-foreground text-xs mt-1">
                  How consistent the rolling window content remains over time.
                </p>
              </div>
              <div>
                <span className="font-medium">Coverage:</span>
                <p className="text-muted-foreground text-xs mt-1">
                  Percentage of expected time buckets with data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
