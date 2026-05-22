'use client';

import { Cell, Pie, PieChart, PieLabelRenderProps, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = [
  '#E5563C', // coral
  '#3B7DD8', // blue
  '#2EAA6E', // green
  '#E8A838', // amber
  '#8B62D9', // violet
  '#D95F8A', // rose
  '#38B2C4', // teal
  '#C47B3A', // brown
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
            background: '#fbfaf6',
            border: '1.5px solid #1d1d1b',
            borderRadius: 6,
            fontSize: 12,
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
