import type { HealthStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

export function StatusDot({
  status,
  monitoringEnabled = true
}: {
  status?: HealthStatus | null;
  /** When false, show a neutral indicator (health checks disabled for this item). */
  monitoringEnabled?: boolean;
}) {
  if (!monitoringEnabled) {
    return (
      <span
        className="inline-flex h-3 w-3 rounded-full border border-white/40 bg-slate-400/80 shadow-lg shadow-slate-900/20 dark:bg-slate-500"
        title="Health check disabled"
      />
    );
  }

  if (status == null) {
    return (
      <span
        className="inline-flex h-3 w-3 rounded-full border border-white/40 bg-slate-300 shadow-lg dark:bg-slate-600"
        title="No check data yet"
      />
    );
  }

  const online = status === "ONLINE";

  return (
    <span
      className={cn(
        "inline-flex h-3 w-3 rounded-full border border-white/40 shadow-lg",
        online ? "bg-emerald-400 shadow-emerald-400/40" : "bg-red-500 shadow-red-500/40"
      )}
      title={online ? "Online" : "Offline"}
    />
  );
}
