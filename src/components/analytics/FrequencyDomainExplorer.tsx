import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FrequencyDomainData } from '@/types/analytics';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface FrequencyDomainExplorerProps {
  data: FrequencyDomainData | null;
  loading?: boolean;
}

export default function FrequencyDomainExplorer({ data, loading }: FrequencyDomainExplorerProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Frequency Domain Explorer</CardTitle>
          <CardDescription>FFT magnitude spectrum analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Frequency Domain Explorer</CardTitle>
          <CardDescription>No frequency data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            <p>Collect time-series data to see frequency analysis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = data.frequencies.map((freq, idx) => ({
    frequency: freq,
    magnitude: data.magnitudes[idx],
    phase: data.phases[idx],
  }));

  // Find dominant frequency index
  const dominantIdx = data.magnitudes.indexOf(Math.max(...data.magnitudes));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Frequency Domain Explorer</CardTitle>
            <CardDescription>
              Seller: {data.seller_id} • Metric: {data.metric_type}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {data.bot_fingerprint_match ? (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Bot Pattern Detected
              </Badge>
            ) : (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Normal Pattern
              </Badge>
            )}
            {data.bot_fingerprint_match && (
              <Badge variant="outline">
                {(data.bot_confidence * 100).toFixed(0)}% confidence
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* FFT Magnitude Spectrum */}
          <div>
            <h4 className="text-sm font-medium mb-3">FFT Magnitude Spectrum</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="frequency"
                  label={{ value: 'Frequency (Hz)', position: 'insideBottom', offset: -5 }}
                  className="text-xs"
                />
                <YAxis
                  label={{ value: 'Magnitude', angle: -90, position: 'insideLeft' }}
                  className="text-xs"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'magnitude' ? value.toFixed(4) : value.toFixed(2),
                    name.charAt(0).toUpperCase() + name.slice(1),
                  ]}
                />
                <ReferenceLine
                  x={data.dominant_frequency}
                  stroke="hsl(var(--chart-5))"
                  strokeDasharray="3 3"
                  label={{
                    value: 'Dominant',
                    position: 'top',
                    className: 'text-xs fill-chart-5',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="magnitude"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Dominant Frequency Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Dominant Frequency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.dominant_frequency.toFixed(4)} Hz</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Period: {(1 / data.dominant_frequency).toFixed(2)}s
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Peak Magnitude</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.magnitudes[dominantIdx].toFixed(4)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  At {data.frequencies[dominantIdx].toFixed(4)} Hz
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Phase</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(data.phases[dominantIdx] * (180 / Math.PI)).toFixed(1)}°
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {data.phases[dominantIdx].toFixed(4)} rad
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bot Detection Analysis */}
          {data.bot_fingerprint_match && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-destructive mb-2">
                    Bot Fingerprint Detected
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    The frequency spectrum shows characteristics consistent with automated bot behavior.
                    This pattern exhibits perfect periodicity that is unlikely in organic user behavior.
                  </p>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span>Confidence Level:</span>
                      <Badge variant="destructive">
                        {(data.bot_confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Dominant Frequency:</span>
                      <span className="font-mono">{data.dominant_frequency.toFixed(4)} Hz</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Pattern Type:</span>
                      <Badge variant="outline">Perfect Periodicity</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Frequency Bins Table */}
          <div>
            <h4 className="text-sm font-medium mb-3">Top Frequency Components</h4>
            <div className="rounded-lg border">
              <div className="grid grid-cols-4 gap-4 p-3 bg-muted/50 text-xs font-medium">
                <div>Frequency (Hz)</div>
                <div>Magnitude</div>
                <div>Phase (rad)</div>
                <div>Period (s)</div>
              </div>
              {chartData
                .sort((a, b) => b.magnitude - a.magnitude)
                .slice(0, 10)
                .map((row, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-4 gap-4 p-3 border-t text-sm font-mono"
                  >
                    <div>{row.frequency.toFixed(4)}</div>
                    <div>{row.magnitude.toFixed(4)}</div>
                    <div>{row.phase.toFixed(4)}</div>
                    <div>{(1 / row.frequency).toFixed(2)}</div>
                  </div>
                ))}
            </div>
          </div>

          {/* Analysis Notes */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Analysis Notes</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• FFT reveals periodic patterns in time-series data</li>
              <li>• Bot traffic often shows perfect periodicity at specific frequencies</li>
              <li>• Organic behavior typically has broader frequency distribution</li>
              <li>• Click to highlight specific frequency components</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
