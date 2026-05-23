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

import { type DailyClick } from '@/services';

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
            <stop offset="5%" stopColor="#E5563C" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#E5563C" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#d4d0c8" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9e9b94' }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9e9b94' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            background: '#fbfaf6',
            border: '1.5px solid #1d1d1b',
            borderRadius: 6,
            fontSize: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          name="Clicks"
          stroke="#E5563C"
          fill="url(#clicks-grad)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#E5563C', stroke: '#fbfaf6', strokeWidth: 2 }}
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
