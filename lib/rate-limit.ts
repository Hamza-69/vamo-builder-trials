/**
 * In-memory rate limiter for API routes.
 *
 * Uses a sliding-window counter stored in a Map.
 * Suitable for single-instance deployments. For multi-instance / serverless,
 * replace with Redis-backed solution (@upstash/ratelimit, etc.).
 *
 * Usage:
 *   import { rateLimit } from "@/lib/rate-limit";
 *   const limiter = rateLimit({ interval: 60_000, limit: 10 });
 *
 *   // In your route handler:
 *   const { success } = limiter.check(userId);
 *   if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 */

interface RateLimitOptions {
  /** Window size in milliseconds */
  interval: number;
  /** Max requests per window */
  limit: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit({ interval, limit }: RateLimitOptions) {
  const store = new Map<string, RateLimitEntry>();

  // Periodically clean up expired entries to prevent memory leaks
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of Array.from(store)) {
      if (now >= entry.resetAt) {
        store.delete(key);
      }
    }
  }, interval * 2);

  // Allow Node to exit even if the interval is still running
  if (cleanup.unref) cleanup.unref();

  return {
    check(key: string): RateLimitResult {
      const now = Date.now();
      const entry = store.get(key);

      if (!entry || now >= entry.resetAt) {
        // New window
        store.set(key, { count: 1, resetAt: now + interval });
        return { success: true, remaining: limit - 1, resetAt: now + interval };
      }

      if (entry.count >= limit) {
        return { success: false, remaining: 0, resetAt: entry.resetAt };
      }

      entry.count++;
      return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt };
    },
  };
}

// ── Pre-configured limiters for common use cases ──────────────────────────────

/** AI endpoints: 20 requests per minute per user */
export const aiLimiter = rateLimit({ interval: 60_000, limit: 20 });

/** Auth endpoints: 10 requests per minute per IP */
export const authLimiter = rateLimit({ interval: 60_000, limit: 10 });

/** General write endpoints: 30 requests per minute per user */
export const writeLimiter = rateLimit({ interval: 60_000, limit: 30 });

/** File upload endpoints: 10 requests per minute per user */
export const uploadLimiter = rateLimit({ interval: 60_000, limit: 10 });
