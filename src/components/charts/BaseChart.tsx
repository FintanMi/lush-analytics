/**
 * Base Chart Component
 * 
 * Centralized chart component with configurable props.
 * Eliminates duplication of visualization logic across the application.
 */

import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export interface ChartConfig {
  type: 'line' | 'bar' | 'area';
  data: Record<string, unknown>[];
  xKey: string;
  yKeys: {
    key: string;
    color: string;
    name?: string;
  }[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
}

interface BaseChartProps {
  config: ChartConfig;
  className?: string;
}

export function BaseChart({ config, className }: BaseChartProps) {
  const {
    type,
    data,
    xKey,
    yKeys,
    height = 300,
    showGrid = true,
    showLegend = true,
    showTooltip = true,
  } = config;

  const commonProps = {
    data,
    height,
    className,
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xKey} />
            <YAxis />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            {yKeys.map(({ key, color, name }) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={color}
                name={name || key}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xKey} />
            <YAxis />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            {yKeys.map(({ key, color, name }) => (
              <Bar
                key={key}
                dataKey={key}
                fill={color}
                name={name || key}
              />
            ))}
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xKey} />
            <YAxis />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            {yKeys.map(({ key, color, name }) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                fill={color}
                stroke={color}
                name={name || key}
              />
            ))}
          </AreaChart>
        );

      default:
        return null;
    }
  };

  const chart = renderChart();
  
  if (!chart) {
    return <div className={className}>Invalid chart type</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      {chart}
    </ResponsiveContainer>
  );
}
