import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  databaseProviderFromUrl,
  getProductionReadinessChecks,
  getReadinessSummary,
} from "@/lib/production-readiness";
import { isProductionMode } from "@/lib/runtime-config";
import { storageDriver } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const checkedAt = new Date().toISOString();
  const productionMode = isProductionMode();
  const readinessChecks = getProductionReadinessChecks();
  const readiness = getReadinessSummary(readinessChecks);
  const configurationChecks = readinessChecks.map((item) => ({
    id: item.id,
    ok: item.ok,
    severity: item.severity,
    message: item.message,
  }));

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      ok: !productionMode || readiness.ok,
      app: "web-pembayaran",
      mode: productionMode ? "production" : "development",
      database: {
        status: "ok",
        provider: databaseProviderFromUrl(),
      },
      storage: storageDriver(),
      configuration: {
        ok: readiness.ok,
        errorCount: readiness.errorCount,
        warningCount: readiness.warningCount,
        checks: configurationChecks,
      },
      checkedAt,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        app: "web-pembayaran",
        mode: productionMode ? "production" : "development",
        database: {
          status: "error",
          provider: databaseProviderFromUrl(),
        },
        storage: storageDriver(),
        configuration: {
          ok: readiness.ok,
          errorCount: readiness.errorCount,
          warningCount: readiness.warningCount,
          checks: configurationChecks,
        },
        checkedAt,
        message: error instanceof Error ? error.message : "Health check gagal.",
      },
      { status: 503 }
    );
  }
}
