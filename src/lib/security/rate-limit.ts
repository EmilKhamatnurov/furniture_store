import "server-only";
import { headers } from "next/headers";
import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Fixed-window rate limiter backed by Redis (INCR + EXPIRE).
// Used to throttle auth endpoints against brute-force / abuse.
//
// Fail-open: if Redis is unavailable we allow the request rather than locking
// everyone out — availability over strictness for a storefront login.
// ---------------------------------------------------------------------------

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the window resets (only meaningful when ok === false) */
  retryAfterSec: number;
}

export async function rateLimit(
  action: string,
  identifier: string,
  opts: { limit: number; windowSec: number }
): Promise<RateLimitResult> {
  const key = `rl:${action}:${identifier}`;
  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, opts.windowSec);
    }
    if (count > opts.limit) {
      const ttl = await redis.ttl(key);
      return { ok: false, retryAfterSec: ttl > 0 ? ttl : opts.windowSec };
    }
    return { ok: true, retryAfterSec: 0 };
  } catch (err) {
    logger.warn({ err, action }, "[rate-limit] check failed — failing open");
    return { ok: true, retryAfterSec: 0 };
  }
}

/** Best-effort client IP from proxy headers (Caddy sets X-Forwarded-For). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/** Human-friendly "через N минут/секунд" for error messages. */
export function retryAfterText(seconds: number): string {
  if (seconds >= 60) {
    const min = Math.ceil(seconds / 60);
    return `через ${min} мин.`;
  }
  return `через ${Math.max(1, seconds)} сек.`;
}
