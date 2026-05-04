"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis
} from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";

type Point = {
  checkedAt: string;
  latencyMs: number | null;
  online: number;
};

const SLOW_THRESHOLD_MS = 10_000;
const SEGMENT_MIN_WIDTH_PX = 6;

type DisplayState = "ok" | "slow" | "down";

function getDisplayState(point: Point): DisplayState {
  if (point.online !== 1) {
    return "down";
  }

  if (typeof point.latencyMs === "number" && point.latencyMs >= SLOW_THRESHOLD_MS) {
    return "slow";
  }

  return "ok";
}

function getStateLabel(state: DisplayState) {
  if (state === "down") {
    return "Offline";
  }

  if (state === "slow") {
    return "Slow answer";
  }

  return "Online";
}

function getStateColor(state: DisplayState) {
  if (state === "down") {
    return "#ef4444";
  }

  if (state === "slow") {
    return "#f97316";
  }

  return "#22c55e";
}

function DurationTooltip({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const point = payload[0]?.payload as { latencyMs?: number | null; state?: DisplayState } | undefined;
  const state = point?.state ?? "down";
  const latency = point?.latencyMs ?? null;

  return (
    <div className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-xl dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <p className="font-semibold text-slate-900 dark:text-slate-100">{label}</p>
      <p className="mt-1 text-slate-700 dark:text-slate-300">
        Status: {getStateLabel(state)}
      </p>
      <p className="mt-1 text-slate-700 dark:text-slate-300">
        Latency: {typeof latency === "number" ? `${Math.round(latency)} ms` : "n/a"}
      </p>
    </div>
  );
}

export function HealthChart({ data, durationLabel }: { data: Point[]; durationLabel?: string }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500">No health data yet.</p>;
  }

  const fromLabel = data[0]?.checkedAt ?? "n/a";
  const toLabel = data[data.length - 1]?.checkedAt ?? "n/a";
  const chartData = data.map((point) => ({
    ...point,
    state: getDisplayState(point),
    value: 1
  }));
  const chartMinWidth = Math.max(300, chartData.length * SEGMENT_MIN_WIDTH_PX);

  return (
    <div className="w-full">
      <p className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-300">Uptime history</p>
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
          Online
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-orange-500" />
          Slow answer
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-red-500" />
          Offline
        </span>
      </div>
      <div className="w-full overflow-x-auto">
        <div className="h-24" style={{ minWidth: `${chartMinWidth}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 0, left: 0, bottom: 8 }} barCategoryGap={0}>
              <XAxis dataKey="checkedAt" hide />
              <Tooltip content={DurationTooltip} cursor={{ fill: "rgba(51, 65, 85, 0.35)" }} />
              <Bar
                dataKey="value"
                barSize={4}
                radius={0}
                shape={({ x, y, width, height, payload }) => (
                  <rect
                    x={typeof x === "number" ? x : 0}
                    y={typeof y === "number" ? y : 0}
                    width={typeof width === "number" ? width : 0}
                    height={typeof height === "number" ? height : 0}
                    fill={getStateColor((payload as { state: DisplayState }).state)}
                  />
                )}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-3 items-center border-t border-slate-200 pt-2 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300">
        <span className="truncate text-left">{fromLabel}</span>
        <span className="text-center font-semibold">{durationLabel ?? "Selected range"}</span>
        <span className="truncate text-right">{toLabel}</span>
      </div>
    </div>
  );
}
