'use client';

import { Cell, Pie, PieChart, PieLabelRenderProps, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

interface BrowserChartProps {
  data: Record<string, number>;
}

export function BrowserChart({ data }: BrowserChartProps) {
  const entries = Object.entries(data);

  if (entries.length === 0) {
    return <Empty />;
  }

  const chartData = entries.map(([name, value]) => ({ name, value }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          dataKey="value"
          label={({ name, percent }: PieLabelRenderProps) =>
            `${name ?? ''} ${(((percent as number | undefined) ?? 0) * 100).toFixed(0)}%`
          }
          labelLine={false}
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 13,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

function Empty() {
  return (
    <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
      No browser data yet
    </div>
  );
}
