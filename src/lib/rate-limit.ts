import { Ratelimit } from "@upstash/ratelimit";
import { Redis as UpstashRedis } from "@upstash/redis";
import { createClient } from "redis";

/**
 * Rate Limiting with Traditional Redis or Upstash
 *
 * This module supports both:
 * 1. Traditional Redis (redis:// URL from Vercel Marketplace)
 * 2. Upstash Redis (https:// REST API for serverless)
 *
 * For Vercel Marketplace Redis, set: REDIS_URL
 * For Upstash REST API, set: KV_REST_API_URL + KV_REST_API_TOKEN
 */

// Singleton Redis client
let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
  if (!process.env.REDIS_URL) return null;

  if (redisClient?.isReady) return redisClient;

  redisClient = createClient({ url: process.env.REDIS_URL });
  redisClient.on("error", (err) => console.error("Redis Error:", err));
  await redisClient.connect();
  return redisClient;
}

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

/**
 * Simple rate limiter using traditional Redis (sliding window)
 */
async function checkTraditionalRedisLimit(
  userId: string,
  limit: number,
  windowSeconds: number,
  prefix: string
): Promise<RateLimitResult> {
  const client = await getRedisClient();
  if (!client) {
    return {
      success: true,
      limit: 999999,
      remaining: 999999,
      reset: Date.now() + windowSeconds * 1000,
    };
  }

  const key = `${prefix}:${userId}`;
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  try {
    // Use sorted set for sliding window
    await client.zRemRangeByScore(key, 0, windowStart);
    const count = await client.zCard(key);

    if (count >= limit) {
      const oldestTimestamp = await client.zRange(key, 0, 0, { REV: false });
      const resetTime = oldestTimestamp.length > 0
        ? parseInt(oldestTimestamp[0]) + windowSeconds * 1000
        : now + windowSeconds * 1000;

      return {
        success: false,
        limit,
        remaining: 0,
        reset: resetTime,
      };
    }

    // Add current request
    await client.zAdd(key, { score: now, value: `${now}:${Math.random()}` });
    await client.expire(key, windowSeconds);

    return {
      success: true,
      limit,
      remaining: limit - count - 1,
      reset: now + windowSeconds * 1000,
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    return { success: true, limit, remaining: limit, reset: now + windowSeconds * 1000 };
  }
}

// Initialize Upstash rate limiters (if configured)
let upstashLimiters: {
  aiChat: Ratelimit | null;
  formGeneration: Ratelimit | null;
  formApproval: Ratelimit | null;
} | null = null;

function getUpstashLimiters() {
  if (upstashLimiters) return upstashLimiters;

  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const redis = new UpstashRedis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });

    upstashLimiters = {
      aiChat: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1h"),
        analytics: true,
        prefix: "ratelimit:ai-chat",
      }),
      formGeneration: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, "1d"),
        analytics: true,
        prefix: "ratelimit:form-generation",
      }),
      formApproval: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(50, "1d"),
        analytics: true,
        prefix: "ratelimit:form-approval",
      }),
    };
  } else {
    upstashLimiters = { aiChat: null, formGeneration: null, formApproval: null };
  }

  return upstashLimiters;
}

// Export rate limiter configs
type RateLimitConfig = {
  limit: number;
  windowSeconds: number;
  prefix: string;
};

const configs: Record<string, RateLimitConfig> = {
  aiChat: { limit: 10, windowSeconds: 3600, prefix: "ratelimit:ai-chat" }, // 10/hour
  formGeneration: { limit: 20, windowSeconds: 86400, prefix: "ratelimit:form-generation" }, // 20/day
  formApproval: { limit: 50, windowSeconds: 86400, prefix: "ratelimit:form-approval" }, // 50/day
};

/**
 * Check rate limit for a user
 * Works with both traditional Redis and Upstash
 */
export async function checkRateLimit(
  type: "aiChat" | "formGeneration" | "formApproval",
  userId: string
): Promise<RateLimitResult> {
  // Try Upstash first (if configured)
  const upstash = getUpstashLimiters();
  if (upstash[type]) {
    const result = await upstash[type]!.limit(userId);
    return result;
  }

  // Fall back to traditional Redis
  if (process.env.REDIS_URL) {
    const config = configs[type];
    return checkTraditionalRedisLimit(
      userId,
      config.limit,
      config.windowSeconds,
      config.prefix
    );
  }

  // No Redis configured - allow all (development mode)
  console.warn("Rate limiting not configured - skipping");
  return {
    success: true,
    limit: 999999,
    remaining: 999999,
    reset: Date.now() + 3600000,
  };
}

/**
 * Create rate limit headers for HTTP responses
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.reset.toString(),
  };
}

