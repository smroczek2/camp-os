import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Redis client
let redis: Redis | undefined;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

// Rate limit configurations by endpoint type
export const rateLimiters = {
  aiChat: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1h"), // 10 requests per hour
        analytics: true,
        prefix: "ratelimit:ai-chat",
      })
    : null,

  formGeneration: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, "1d"), // 20 requests per day
        analytics: true,
        prefix: "ratelimit:form-generation",
      })
    : null,

  formApproval: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(50, "1d"), // 50 requests per day
        analytics: true,
        prefix: "ratelimit:form-approval",
      })
    : null,
};

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

/**
 * Check rate limit for a user
 * @param limiter - The rate limiter to use
 * @param userId - The user ID to check
 * @returns Rate limit result with success status and headers
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  userId: string
): Promise<RateLimitResult> {
  // If no Redis configured, skip rate limiting (development mode)
  if (!limiter) {
    console.warn("Rate limiting not configured - skipping rate limit check");
    return {
      success: true,
      limit: 999999,
      remaining: 999999,
      reset: Date.now() + 3600000,
    };
  }

  const result = await limiter.limit(userId);
  return result;
}

/**
 * Create rate limit headers for HTTP responses
 * @param result - The rate limit result
 * @returns Headers object with rate limit information
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.reset.toString(),
  };
}

/**
 * Check if rate limiting is enabled
 * @returns true if Redis is configured
 */
export function isRateLimitingEnabled(): boolean {
  return redis !== undefined;
}
