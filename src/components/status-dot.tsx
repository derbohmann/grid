import type { HealthStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

export function StatusDot({ status }: { status?: HealthStatus | null }) {
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
