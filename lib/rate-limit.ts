/**
 * @fileoverview In-memory rate limiter for API routes.
 * Limits requests per session ID to prevent abuse.
 * Uses a simple token bucket algorithm with a Map.
 *
 * Note: In-memory means limits reset on server restart/cold start.
 * For production, replace with Redis via rate-limiter-flexible.
 */

interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, RateLimitBucket>();

/**
 * Checks if a session ID has exceeded the rate limit.
 * Uses a token bucket: tokens refill every windowMs milliseconds.
 *
 * @param sessionId - The session to rate limit
 * @param limit - Max requests per window (default 10)
 * @param windowMs - Window size in ms (default 60000 = 1 minute)
 * @returns Whether the request is allowed
 */
export function checkRateLimit(
  sessionId: string,
  limit = 10,
  windowMs = 60_000
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const bucket = buckets.get(sessionId);

  if (!bucket) {
    buckets.set(sessionId, { tokens: limit - 1, lastRefill: now });
    return { allowed: true, remaining: limit - 1, resetMs: windowMs };
  }

  // Refill tokens if window has passed
  const elapsed = now - bucket.lastRefill;
  if (elapsed >= windowMs) {
    bucket.tokens = limit - 1;
    bucket.lastRefill = now;
    return { allowed: true, remaining: limit - 1, resetMs: windowMs };
  }

  if (bucket.tokens > 0) {
    bucket.tokens--;
    return {
      allowed: true,
      remaining: bucket.tokens,
      resetMs: windowMs - elapsed,
    };
  }

  return {
    allowed: false,
    remaining: 0,
    resetMs: windowMs - elapsed,
  };
}
