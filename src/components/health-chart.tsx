"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis
} from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";

type Point = {
  checkedAt: string;
  latencyMs: number | null;
  online: number;
};

function DurationTooltip({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const point = payload[0]?.payload as
    | { reachable?: boolean; pingMs?: number | null; latencyMs?: number | null }
    | undefined;
  const reachable = point?.reachable ?? false;
  const ping = point?.pingMs ?? point?.latencyMs ?? null;

  return (
    <div className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
      <p className="font-semibold text-slate-900 dark:text-slate-100">{label}</p>
      <p className="mt-1 text-slate-700 dark:text-slate-300">
        Ping: {typeof ping === "number" ? `${Math.round(ping)} ms` : "n/a"}
      </p>
      <p className="mt-1 text-slate-700 dark:text-slate-300">Reachable: {reachable ? "true" : "false"}</p>
    </div>
  );
}

export function HealthChart({ data, durationLabel }: { data: Point[]; durationLabel?: string }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500">No health data yet.</p>;
  }

  const fromLabel = data[0]?.checkedAt ?? "n/a";
  const toLabel = data[data.length - 1]?.checkedAt ?? "n/a";
  const chartData = data.map((point) => {
    const reachable = point.online === 1 && point.latencyMs !== null && point.latencyMs <= 1000;

    return {
      ...point,
      reachable,
      pingMs: reachable ? point.latencyMs : null,
      unreachableMs: reachable ? null : 1000
    };
  });

  return (
    <div className="w-full">
      <p className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Ping (ms)</p>
      <div className="h-52 w-full">
        <ResponsiveContainer>
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
            <XAxis dataKey="checkedAt" hide />
            <YAxis
              yAxisId="latency"
              width={64}
              domain={[0, 1000]}
              tickFormatter={(value: number) => `${Math.round(value)} ms`}
              tick={{ fontSize: 11 }}
            />
            <Tooltip content={DurationTooltip} />
            <Bar yAxisId="latency" dataKey="unreachableMs" fill="#ef4444" barSize={3} />
            <Line
              yAxisId="latency"
              type="monotone"
              dataKey="pingMs"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              name="Ping"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 grid grid-cols-3 items-center border-t border-slate-200 pt-2 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300">
        <span className="truncate text-left">{fromLabel}</span>
        <span className="text-center font-semibold">{durationLabel ?? "Selected range"}</span>
        <span className="truncate text-right">{toLabel}</span>
      </div>
    </div>
  );
}
