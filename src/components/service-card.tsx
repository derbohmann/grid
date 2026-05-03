"use client";

import { HealthChart } from "@/components/health-chart";
import { IconView } from "@/components/icon-view";
import { StatusDot } from "@/components/status-dot";
import { cn } from "@/lib/utils";
import type { HealthStatus } from "@prisma/client";
import { XIcon } from "lucide-react";
import { useEffect, useState, type MouseEvent } from "react";

type RangeKey = "7d" | "14d" | "30d" | "90d" | "365d" | "all";

type Point = {
  checkedAt: string;
  latencyMs: number | null;
  online: number;
};

const ranges: { label: string; value: RangeKey }[] = [
  { label: "7 days", value: "7d" },
  { label: "14 days", value: "14d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
  { label: "365 days", value: "365d" },
  { label: "All time", value: "all" }
];

function getRangeLabel(value: RangeKey) {
  return ranges.find((range) => range.value === value)?.label ?? "Selected range";
}

export function ServiceCard({
  id,
  title,
  description,
  icon,
  url,
  status,
  healthMonitoringEnabled,
  openInNewTab
}: {
  id: string;
  title: string;
  description?: string | null;
  icon?: string | null;
  url: string;
  status?: HealthStatus | null;
  healthMonitoringEnabled: boolean;
  openInNewTab: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<RangeKey>("7d");
  const [data, setData] = useState<Point[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const controller = new AbortController();

    async function loadHealthData() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/items/${id}/health?range=${range}`, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error("Unable to load uptime history.");
        }

        const payload = (await response.json()) as { points?: Point[] };
        setData(payload.points ?? []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setData([]);
        setError(error instanceof Error ? error.message : "Unable to load uptime history.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadHealthData();

    return () => controller.abort();
  }, [id, open, range]);

  function openDialog(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setOpen(true);
  }

  function closeDialog() {
    setOpen(false);
  }

  return (
    <>
      <div className="group relative flex min-h-16 items-center gap-4 rounded-2xl border border-slate-300/70 bg-white/70 p-4 text-slate-900 shadow-2xl shadow-slate-900/10 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/85 dark:border-white/10 dark:bg-slate-950/60 dark:text-white dark:shadow-black/20 dark:hover:bg-slate-900/70">
        <a
          aria-label={`Open ${title}`}
          className="absolute inset-0 rounded-2xl"
          href={url}
          {...(openInNewTab ? { target: "_blank", rel: "noreferrer" } : {})}
        />
        <IconView icon={icon} alt="" className="pointer-events-none relative z-10 h-11 w-11 shrink-0" />
        <span className="pointer-events-none relative z-10 min-w-0">
          <span className="block truncate text-base font-semibold">{title}</span>
          {description ? <span className="block truncate text-sm text-slate-600 dark:text-slate-300">{description}</span> : null}
        </span>
        <button
          aria-label={
            healthMonitoringEnabled ? `Show uptime chart for ${title}` : `Health monitoring disabled for ${title}`
          }
          className={cn(
            "absolute right-4 top-3 z-20 flex shrink-0 items-center justify-center rounded-full p-1 transition",
            healthMonitoringEnabled
              ? "cursor-pointer hover:bg-slate-900/10 dark:hover:bg-white/10"
              : "cursor-default opacity-70"
          )}
          type="button"
          onClick={healthMonitoringEnabled ? openDialog : undefined}
          disabled={!healthMonitoringEnabled}
        >
          <StatusDot status={status} monitoringEnabled={healthMonitoringEnabled} />
        </button>
      </div>

      {open ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
          role="dialog"
          onClick={closeDialog}
        >
          <div
            className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white p-6 text-slate-950 shadow-2xl dark:bg-slate-900 dark:text-slate-50"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-xl font-black">{title}</h3>
                <p className="truncate text-sm text-slate-500 dark:text-slate-400">{url}</p>
              </div>
              <button className="btn-rounded btn-secondary" type="button" onClick={closeDialog}>
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {ranges.map((option) => (
                <button
                  key={option.value}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold cursor-pointer",
                    range === option.value
                      ? "border border-violet-500 bg-violet-500 text-white"
                      : "border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  )}

                  type="button"
                  onClick={() => setRange(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="mt-6">
              {loading ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 h-[262px]">Loading uptime history...</p>
              ) : error ? (
                <p className="text-sm font-semibold text-red-600">{error}</p>
              ) : (
                <HealthChart data={data} durationLabel={getRangeLabel(range)} />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
