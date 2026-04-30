import { NextResponse } from "next/server";
import { HealthStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";

const ranges = {
  "7d": 7,
  "14d": 14,
  "30d": 30,
  "90d": 90,
  "365d": 365,
  all: null
} as const;

type RangeKey = keyof typeof ranges;

function isRangeKey(value: string): value is RangeKey {
  return Object.prototype.hasOwnProperty.call(ranges, value);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const requestedRange = new URL(request.url).searchParams.get("range") ?? "7d";

  if (!isRangeKey(requestedRange)) {
    return NextResponse.json({ error: "Invalid range." }, { status: 400 });
  }

  const days = ranges[requestedRange];
  const cutoff = days === null ? null : new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const results = await prisma.healthCheckResult.findMany({
    where: {
      dashboardItemId: id,
      ...(cutoff
        ? {
            checkedAt: {
              gte: cutoff
            }
          }
        : {})
    },
    orderBy: {
      checkedAt: "asc"
    }
  });

  return NextResponse.json({
    points: results.map((result) => ({
      checkedAt: formatDateTime(result.checkedAt),
      latencyMs: result.latencyMs,
      online: result.status === HealthStatus.ONLINE ? 1 : 0
    }))
  });
}
