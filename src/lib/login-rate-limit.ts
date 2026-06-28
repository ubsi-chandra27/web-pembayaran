import "server-only";

type Attempt = {
  count: number;
  resetAt: number;
};

const attempts = new Map<string, Attempt>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function now() {
  return Date.now();
}

export function loginRateLimitKey(ip: string, contact: string) {
  return `${ip || "unknown"}:${contact.toLowerCase()}`;
}

export function assertLoginAllowed(key: string) {
  const entry = attempts.get(key);

  if (!entry) return;

  if (entry.resetAt <= now()) {
    attempts.delete(key);
    return;
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const seconds = Math.ceil((entry.resetAt - now()) / 1000);
    throw new Error(`Terlalu banyak percobaan login. Coba lagi sekitar ${seconds} detik.`);
  }
}

export function recordLoginFailure(key: string) {
  const current = attempts.get(key);
  const currentTime = now();

  if (!current || current.resetAt <= currentTime) {
    attempts.set(key, { count: 1, resetAt: currentTime + WINDOW_MS });
    return;
  }

  attempts.set(key, { count: current.count + 1, resetAt: current.resetAt });
}

export function clearLoginFailures(key: string) {
  attempts.delete(key);
}
