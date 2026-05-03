import { prisma } from '@/lib/db';
import { HealthStatus } from '@prisma/client';

const timeoutMs = Number(process.env.HEALTH_TIMEOUT_MS ?? 5000);
const retentionDays = Number(process.env.HEALTH_RETENTION_DAYS ?? 30);

export async function checkItem(itemId: string) {
  const item = await prisma.dashboardItem.findUnique({ where: { id: itemId } });
  if (!item) {
    return null;
  }

  const target = item.healthCheckUrl?.trim();
  if (!target) {
    return null;
  }
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(target, {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
    });
    const latencyMs = Date.now() - started;
    const online = response.status >= 200 && response.status < 400;

    return prisma.healthCheckResult.create({
      data: {
        dashboardItemId: item.id,
        checkedAt: new Date(),
        status: online ? HealthStatus.ONLINE : HealthStatus.OFFLINE,
        latencyMs,
        statusCode: response.status,
        errorMessage: online ? null : `HTTP ${response.status}`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return prisma.healthCheckResult.create({
      data: {
        dashboardItemId: item.id,
        checkedAt: new Date(),
        status: HealthStatus.OFFLINE,
        latencyMs: Date.now() - started,
        errorMessage: message,
      },
    });
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
