import { prisma } from '@/lib/db';
import { dispatchHealthAlertsIfNeeded } from '@/lib/health-notify';
import type { DashboardItem, HealthCheckResult } from '@prisma/client';
import { HealthStatus } from '@prisma/client';

const timeoutMs = Number(process.env.HEALTH_TIMEOUT_MS ?? 5000);
const retentionDays = Number(process.env.HEALTH_RETENTION_DAYS ?? 30);

async function probeTarget(target: string, signal: AbortSignal) {
  const headResponse = await fetch(target, {
    method: 'HEAD',
    redirect: 'manual',
    signal,
  });

  if (headResponse.status !== 405 && headResponse.status !== 501) {
    return headResponse;
  }

  const getResponse = await fetch(target, {
    method: 'GET',
    redirect: 'manual',
    signal,
  });

  await getResponse.body?.cancel?.();
  return getResponse;
}

function queueHealthAlerts(item: DashboardItem, previous: HealthCheckResult | null, created: HealthCheckResult) {
  void dispatchHealthAlertsIfNeeded({ item, previous, created }).catch((e) => {
    console.error('[health-notify]', e);
  });
}

export async function checkItem(itemId: string) {
  const item = await prisma.dashboardItem.findUnique({ where: { id: itemId } });
  if (!item) {
    return null;
  }

  const target = item.healthCheckUrl?.trim();
  if (!target) {
    return null;
  }

  const previous = await prisma.healthCheckResult.findFirst({
    where: { dashboardItemId: item.id },
    orderBy: { checkedAt: 'desc' },
  });

  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await probeTarget(target, controller.signal);
    const latencyMs = Date.now() - started;
    const online = (response.status >= 200 && response.status < 400) || response.status === 401;

    const created = await prisma.healthCheckResult.create({
      data: {
        dashboardItemId: item.id,
        checkedAt: new Date(),
        status: online ? HealthStatus.ONLINE : HealthStatus.OFFLINE,
        latencyMs,
        statusCode: response.status,
        errorMessage: online ? null : `HTTP ${response.status}`,
      },
    });
    queueHealthAlerts(item, previous, created);
    return created;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const created = await prisma.healthCheckResult.create({
      data: {
        dashboardItemId: item.id,
        checkedAt: new Date(),
        status: HealthStatus.OFFLINE,
        latencyMs: Date.now() - started,
        errorMessage: message,
      },
    });
    queueHealthAlerts(item, previous, created);
    return created;
  } finally {
    clearTimeout(timeout);
  }
}

export async function runDueHealthChecks() {
  const items = await prisma.dashboardItem.findMany({
    include: {
      healthResults: {
        orderBy: { checkedAt: 'desc' },
        take: 1,
      },
    },
  });

  const monitored = items.filter((item) => Boolean(item.healthCheckUrl?.trim()));

  const now = Date.now();
  const dueItems = monitored.filter((item) => {
    const latest = item.healthResults[0];
    if (!latest) {
      return true;
    }

    return now - latest.checkedAt.getTime() >= item.checkIntervalSeconds * 1000;
  });

  await Promise.allSettled(dueItems.map((item) => checkItem(item.id)));
  await cleanupHealthHistory();
}

export async function cleanupHealthHistory() {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  await prisma.healthCheckResult.deleteMany({
    where: {
      checkedAt: {
        lt: cutoff,
      },
    },
  });
}
