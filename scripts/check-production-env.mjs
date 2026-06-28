import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const envFiles = [".env", ".env.production", ".env.local"];

function loadEnvFile(fileName) {
  const filePath = path.join(process.cwd(), fileName);

  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...rawParts] = trimmed.split("=");
    const rawValue = rawParts.join("=").trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

for (const file of envFiles) {
  loadEnvFile(file);
}

function env(name) {
  return process.env[name]?.trim() || "";
}

function databaseProviderFromUrl(databaseUrl = env("DATABASE_URL")) {
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

function check(id, label, ok, severity, message) {
  return { id, label, ok, severity, message };
}

function getChecks() {
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
      isProduction ? "OK" : "Set APP_MODE=production pada environment hosting."
    ),
    check(
      "demo-defaults",
      "Default demo",
      allowDemoDefaults === "false",
      "error",
      allowDemoDefaults === "false" ? "OK" : "Set ALLOW_DEMO_DEFAULTS=false."
    ),
    check(
      "database-url",
      "Database URL",
      Boolean(databaseUrl),
      "error",
      databaseUrl ? `Terdeteksi ${databaseProvider}.` : "DATABASE_URL wajib diisi."
    ),
    check(
      "database-provider",
      "Database production",
      databaseProvider === "postgresql" || databaseProvider === "mysql",
      "error",
      databaseProvider === "postgresql" || databaseProvider === "mysql"
        ? "OK"
        : "Production wajib memakai PostgreSQL atau MySQL/MariaDB."
    ),
    check(
      "public-url",
      "URL publik aplikasi",
      Boolean(appUrl) && !appUrlIsLocal,
      "error",
      Boolean(appUrl) && !appUrlIsLocal
        ? "OK"
        : "Isi NEXT_PUBLIC_APP_URL dengan domain production."
    ),
    check(
      "storage-driver",
      "Storage driver",
      storageDriver === "local-private" || storageDriver === "cloud-http",
      "error",
      storageDriver === "local-private" || storageDriver === "cloud-http"
        ? storageDriver
        : "STORAGE_DRIVER harus local-private atau cloud-http."
    ),
    check(
      "cloud-storage",
      "Cloud storage",
      storageDriver !== "cloud-http" || Boolean(storageEndpoint && storagePublicBaseUrl),
      "error",
      storageDriver !== "cloud-http"
        ? "Tidak dipakai."
        : storageEndpoint && storagePublicBaseUrl
          ? "OK"
          : "STORAGE_UPLOAD_ENDPOINT dan STORAGE_PUBLIC_BASE_URL wajib diisi."
    ),
    check(
      "storage-production-note",
      "Catatan storage",
      storageDriver === "cloud-http",
      "warning",
      storageDriver === "cloud-http"
        ? "OK"
        : "local-private boleh untuk VPS tunggal, cloud/object storage lebih aman."
    ),
    check(
      "super-admin-bootstrap",
      "Bootstrap Super Admin",
      Boolean(superAdminEmail && superAdminPassword),
      "warning",
      superAdminEmail && superAdminPassword
        ? "OK"
        : "Isi SUPER_ADMIN_EMAIL dan SUPER_ADMIN_PASSWORD sebelum seed production pertama."
    ),
    check(
      "demo-seed",
      "Seed data demo",
      demoData !== "true",
      "error",
      demoData !== "true" ? "OK" : "SEED_DEMO_DATA=true jangan aktif di production."
    ),
  ];
}

const checks = getChecks();
const errors = checks.filter((item) => item.severity === "error" && !item.ok);
const warnings = checks.filter((item) => item.severity === "warning" && !item.ok);

console.log("Production readiness check\n");

for (const item of checks) {
  const icon = item.ok ? "[OK]" : item.severity === "warning" ? "[WARN]" : "[FAIL]";
  console.log(`${icon} ${item.label}: ${item.message}`);
}

console.log(`\nSummary: ${errors.length} error, ${warnings.length} warning`);

if (errors.length > 0) {
  process.exit(1);
}
