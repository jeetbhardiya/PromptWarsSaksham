'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';

interface MoodDataPoint {
  date: string;
  score: number;
  emoji: string;
}

interface MoodChartProps {
  data: MoodDataPoint[];
  className?: string;
}

const SCORE_LABELS: Record<number, string> = {
  1: '😔 Very Low',
  2: '😟 Low',
  3: '😐 Okay',
  4: '😊 Good',
  5: '😄 Great',
};

interface TooltipPayloadItem {
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const score = payload[0]?.value;
  return (
    <div className="bg-white border border-border rounded-xl px-3 py-2 shadow-soft text-sm">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-semibold text-foreground">{score !== undefined ? (SCORE_LABELS[score] ?? `${score}/5`) : '—'}</p>
    </div>
  );
}

/**
 * Recharts-based mood trend line chart.
 * Shows mood score over time with emoji labels and a "neutral" reference line.
 *
 * @param data - Array of mood data points with date, score, and emoji
 */
export function MoodChart({ data, className = '' }: MoodChartProps) {
  if (data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center h-48 text-muted-foreground text-sm ${className}`}
        role="img"
        aria-label="No mood data yet"
      >
        <div className="text-center">
          <p className="text-3xl mb-2">📊</p>
          <p>Log your mood to see your trend here</p>
        </div>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    date: format(new Date(d.date), 'MMM d'),
    score: d.score,
    emoji: d.emoji,
    fullDate: d.date,
  }));

  return (
    <div
      className={className}
      role="img"
      aria-label={`Mood trend chart showing ${data.length} data points from ${chartData[0]?.date} to ${chartData[chartData.length - 1]?.date}`}
    >
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="moodGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#ff7811" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) =>
              ({ 1: '😔', 2: '😟', 3: '😐', 4: '😊', 5: '😄' }[v] ?? String(v))
            }
            width={32}
          />
          <Tooltip content={<CustomTooltip />} />
          {/* Neutral reference line at 3 */}
          <ReferenceLine y={3} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" opacity={0.4} />
          <Line
            type="monotone"
            dataKey="score"
            stroke="url(#moodGradient)"
            strokeWidth={2.5}
            dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#ff7811' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
