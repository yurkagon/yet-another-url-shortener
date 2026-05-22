'use client';

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

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

interface CountryChartProps {
  data: Record<string, number>;
}

export function CountryChart({ data }: CountryChartProps) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 10);

  if (entries.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
        No country data yet
      </div>
    );
  }

  const chartData = entries.map(([name, value]) => ({ name, value }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#d4d0c8" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9e9b94' }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9e9b94' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            background: '#fbfaf6',
            border: '1.5px solid #1d1d1b',
            borderRadius: 6,
            fontSize: 12,
          }}
        />
        <Bar dataKey="value" name="Clicks" radius={[4, 4, 0, 0]}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
