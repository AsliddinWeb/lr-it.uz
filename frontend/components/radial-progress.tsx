"use client";

import { RadialBar, RadialBarChart, PolarAngleAxis } from "recharts";

export function RadialProgress({
  value,
  label,
  size = 120,
}: {
  value: number;
  label?: string;
  size?: number;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  const data = [{ value: clamped }];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <RadialBarChart
        width={size}
        height={size}
        innerRadius="72%"
        outerRadius="100%"
        data={data}
        startAngle={90}
        endAngle={-270}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
        <RadialBar
          dataKey="value"
          cornerRadius={999}
          fill="var(--primary)"
          background={{ fill: "var(--surface-2)" }}
        />
      </RadialBarChart>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-xl font-bold text-text-primary">
          {Math.round(clamped)}%
        </span>
        {label && <span className="text-xs text-text-muted">{label}</span>}
      </div>
    </div>
  );
}
