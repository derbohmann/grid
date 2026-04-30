import "server-only";

import { runDueHealthChecks } from "@/lib/health";

const globalScheduler = globalThis as unknown as {
  smartDashboardSchedulerStarted?: boolean;
};

export function startHealthScheduler() {
  if (globalScheduler.smartDashboardSchedulerStarted) {
    return;
  }

  globalScheduler.smartDashboardSchedulerStarted = true;
  const intervalMs = Number(process.env.HEALTH_SCHEDULER_INTERVAL_MS ?? 30000);

  void runDueHealthChecks();
  setInterval(() => {
    void runDueHealthChecks();
  }, intervalMs);
}
