'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { type DailyClick } from '@/lib/api';

interface ClicksChartProps {
  data: DailyClick[];
}

export function ClicksChart({ data }: ClicksChartProps) {
  if (data.length === 0) {
    return <Empty label="No click data yet" />;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="clicks-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} className="text-muted-foreground" />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 13,
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          name="Clicks"
          stroke="hsl(var(--primary))"
          fill="url(#clicks-grad)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
      {label}
    </div>
  );
}
