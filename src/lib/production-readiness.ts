import "server-only";

type CheckSeverity = "error" | "warning" | "info";

export type ReadinessCheck = {
  id: string;
  label: string;
  severity: CheckSeverity;
  ok: boolean;
  message: string;
};

function env(name: string) {
  return process.env[name]?.trim() || "";
}

export function databaseProviderFromUrl(databaseUrl = env("DATABASE_URL")) {
  if (databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("postgres://")) {
    return "postgresql";
  }

  if (databaseUrl.startsWith("mysql://")) {
    return "mysql";
  }

  if (databaseUrl.startsWith("file:")) {
    return "sqlite";
  }

  return databaseUrl ? "unknown" : "missing";
}

function check(
  id: string,
  label: string,
  ok: boolean,
  severity: CheckSeverity,
  message: string
): ReadinessCheck {
  return { id, label, ok, severity, message };
}

export function getProductionReadinessChecks() {
  const appMode = env("APP_MODE");
  const allowDemoDefaults = env("ALLOW_DEMO_DEFAULTS");
  const appUrl = env("NEXT_PUBLIC_APP_URL");
  const databaseUrl = env("DATABASE_URL");
  const databaseProvider = databaseProviderFromUrl(databaseUrl);
  const storageDriver = env("STORAGE_DRIVER") || "local-private";
  const storageEndpoint = env("STORAGE_UPLOAD_ENDPOINT");
  const storagePublicBaseUrl = env("STORAGE_PUBLIC_BASE_URL");
  const superAdminEmail = env("SUPER_ADMIN_EMAIL");
  const superAdminPassword = env("SUPER_ADMIN_PASSWORD");
  const demoData = env("SEED_DEMO_DATA");

  const isProduction = appMode === "production";
  const appUrlIsLocal =
    !appUrl ||
    appUrl.includes("localhost") ||
    appUrl.includes("127.0.0.1") ||
    appUrl.includes("0.0.0.0");

  return [
    check(
      "app-mode",
      "Mode aplikasi",
      isProduction,
      "error",
      isProduction
        ? "APP_MODE sudah mengarah ke production."
        : "Set APP_MODE=production pada environment hosting."
    ),
    check(
      "demo-defaults",
      "Default demo",
      allowDemoDefaults === "false",
      "error",
      allowDemoDefaults === "false"
        ? "Default password demo dan reset demo dimatikan."
        : "Set ALLOW_DEMO_DEFAULTS=false agar production tidak memakai password demo otomatis."
    ),
    check(
      "database-url",
      "Database URL",
      Boolean(databaseUrl),
      "error",
      databaseUrl
        ? `DATABASE_URL terdeteksi sebagai ${databaseProvider}.`
        : "DATABASE_URL wajib diisi."
    ),
    check(
      "database-provider",
      "Database production",
      databaseProvider === "postgresql" || databaseProvider === "mysql",
      "error",
      databaseProvider === "postgresql" || databaseProvider === "mysql"
        ? `Database production memakai ${databaseProvider}.`
        : "Production wajib memakai PostgreSQL atau MySQL/MariaDB, bukan SQLite/file."
    ),
    check(
      "public-url",
      "URL publik aplikasi",
      Boolean(appUrl) && !appUrlIsLocal,
      "error",
      Boolean(appUrl) && !appUrlIsLocal
        ? "NEXT_PUBLIC_APP_URL sudah memakai domain publik."
        : "Isi NEXT_PUBLIC_APP_URL dengan domain production, bukan localhost."
    ),
    check(
      "storage-driver",
      "Storage bukti pembayaran",
      storageDriver === "local-private" || storageDriver === "cloud-http",
      "error",
      storageDriver === "local-private" || storageDriver === "cloud-http"
        ? `Storage driver aktif: ${storageDriver}.`
        : "STORAGE_DRIVER harus local-private atau cloud-http."
    ),
    check(
      "cloud-storage",
      "Konfigurasi cloud storage",
      storageDriver !== "cloud-http" || Boolean(storageEndpoint && storagePublicBaseUrl),
      "error",
      storageDriver !== "cloud-http"
        ? "Cloud storage tidak dipakai pada konfigurasi ini."
        : storageEndpoint && storagePublicBaseUrl
          ? "Endpoint upload dan public base URL cloud storage sudah diisi."
          : "STORAGE_UPLOAD_ENDPOINT dan STORAGE_PUBLIC_BASE_URL wajib diisi untuk cloud-http."
    ),
    check(
      "storage-production-note",
      "Catatan storage production",
      storageDriver === "cloud-http",
      "warning",
      storageDriver === "cloud-http"
        ? "Storage cloud aktif."
        : "local-private boleh untuk VPS tunggal, tetapi cloud/object storage lebih aman untuk redeploy dan scaling."
    ),
    check(
      "super-admin-bootstrap",
      "Bootstrap Super Admin",
      Boolean(superAdminEmail && superAdminPassword),
      "warning",
      superAdminEmail && superAdminPassword
        ? "SUPER_ADMIN_EMAIL dan SUPER_ADMIN_PASSWORD tersedia untuk seed bootstrap."
        : "Isi SUPER_ADMIN_EMAIL dan SUPER_ADMIN_PASSWORD sebelum menjalankan seed production pertama."
    ),
    check(
      "demo-seed",
      "Seed data demo",
      demoData !== "true",
      "error",
      demoData !== "true"
        ? "SEED_DEMO_DATA tidak aktif."
        : "SEED_DEMO_DATA=true akan mengisi dummy; jangan aktifkan di production."
    ),
  ];
}

export function getReadinessSummary(checks = getProductionReadinessChecks()) {
  const errors = checks.filter((item) => item.severity === "error" && !item.ok);
  const warnings = checks.filter((item) => item.severity === "warning" && !item.ok);

  return {
    ok: errors.length === 0,
    errorCount: errors.length,
    warningCount: warnings.length,
  };
}
