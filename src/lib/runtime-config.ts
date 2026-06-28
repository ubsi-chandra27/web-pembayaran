import "server-only";

export function isProductionMode() {
  return process.env.NODE_ENV === "production" || process.env.APP_MODE === "production";
}

export function allowDemoDefaults() {
  return !isProductionMode() && process.env.ALLOW_DEMO_DEFAULTS !== "false";
}

export function appBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002").replace(/\/$/, "");
}
