import { Ratelimit } from "@upstash/ratelimit";
import { Redis as UpstashRedis } from "@upstash/redis";
import { createClient } from "redis";

/**
 * Rate Limiting with Traditional Redis or Upstash
 *
 * This module supports both:
 * 1. Traditional Redis (redis:// URL from Redis Labs, Vercel Redis, etc.)
 * 2. Upstash Redis (https:// REST API for serverless)
 *
 * Setup Options:
 *
 * OPTION A: Traditional Redis (what you have now)
 * Set environment variable:
 *   REDIS_URL=redis://default:password@host:port
 *
 * OPTION B: Upstash Redis (serverless alternative)
 * Set environment variables:
 *   KV_REST_API_URL=https://...
 *   KV_REST_API_TOKEN=...
 *
 * The code automatically detects which you have configured.
 */

// Singleton Redis client for traditional Redis
let redisClient: ReturnType<typeof createClient> | null = null;
let redisClientPromise: Promise<ReturnType<typeof createClient>> | null = null;

/**
 * Get or create Redis client (singleton pattern for serverless)
 */
async function getRedisClient(): Promise<ReturnType<typeof createClient> | null> {
  if (!process.env.REDIS_URL) {
    return null;
  }

  // Return existing client if connected
  if (redisClient?.isReady) {
    return redisClient;
  }

  // Return pending connection if in progress
  if (redisClientPromise) {
    return redisClientPromise;
  }

  // Create new connection
  redisClientPromise = (async () => {
    const client = createClient({
      url: process.env.REDIS_URL,
    });

    client.on("error", (err) => {
      console.error("Redis Client Error:", err);
    });

    await client.connect();
    redisClient = client;
    return client;
  })();

  return redisClientPromise;
}

/**
 * Redis adapter for Upstash Ratelimit library
 * Adapts traditional Redis to work with @upstash/ratelimit
 */
class RedisAdapter {
  constructor(private client: ReturnType<typeof createClient>) {}

  async eval(script: string, keys: string[], args: string[]): Promise<unknown> {
    return this.client.eval(script, {
      keys,
      arguments: args,
    });
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string): Promise<void> {
    await this.client.set(key, value);
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    await this.client.setEx(key, seconds, value);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async decr(key: string): Promise<number> {
    return this.client.decr(key);
  }
}

// Initialize rate limiters
let rateLimitersCache: {
  aiChat: Ratelimit | null;
  formGeneration: Ratelimit | null;
  formApproval: Ratelimit | null;
} | null = null;

async function initializeRateLimiters() {
  if (rateLimitersCache) {
    return rateLimitersCache;
  }

  // Check for Upstash Redis (REST API - serverless-native)
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const upstashRedis = new UpstashRedis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });

    rateLimitersCache = {
      aiChat: new Ratelimit({
        redis: upstashRedis,
        limiter: Ratelimit.slidingWindow(10, "1h"),
        analytics: true,
        prefix: "ratelimit:ai-chat",
      }),
      formGeneration: new Ratelimit({
        redis: upstashRedis,
        limiter: Ratelimit.slidingWindow(20, "1d"),
        analytics: true,
        prefix: "ratelimit:form-generation",
      }),
      formApproval: new Ratelimit({
        redis: upstashRedis,
        limiter: Ratelimit.slidingWindow(50, "1d"),
        analytics: true,
        prefix: "ratelimit:form-approval",
      }),
    };

    return rateLimitersCache;
  }

  // Check for traditional Redis (TCP connection)
  if (process.env.REDIS_URL) {
    const client = await getRedisClient();

    if (!client) {
      rateLimitersCache = {
        aiChat: null,
        formGeneration: null,
        formApproval: null,
      };
      return rateLimitersCache;
    }

    const adapter = new RedisAdapter(client) as unknown as UpstashRedis;

    rateLimitersCache = {
      aiChat: new Ratelimit({
        redis: adapter,
        limiter: Ratelimit.slidingWindow(10, "1h"),
        analytics: true,
        prefix: "ratelimit:ai-chat",
      }),
      formGeneration: new Ratelimit({
        redis: adapter,
        limiter: Ratelimit.slidingWindow(20, "1d"),
        analytics: true,
        prefix: "ratelimit:form-generation",
      }),
      formApproval: new Ratelimit({
        redis: adapter,
        limiter: Ratelimit.slidingWindow(50, "1d"),
        analytics: true,
        prefix: "ratelimit:form-approval",
      }),
    };

    return rateLimitersCache;
  }

  // No Redis configured
  rateLimitersCache = {
    aiChat: null,
    formGeneration: null,
    formApproval: null,
  };

  return rateLimitersCache;
}

// Export rate limiters (lazy-loaded)
export const rateLimiters = {
  get aiChat() {
    return initializeRateLimiters().then((r) => r.aiChat);
  },
  get formGeneration() {
    return initializeRateLimiters().then((r) => r.formGeneration);
  },
  get formApproval() {
    return initializeRateLimiters().then((r) => r.formApproval);
  },
};

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

/**
 * Check rate limit for a user
 * @param limiter - The rate limiter to use (Promise<Ratelimit | null>)
 * @param userId - The user ID to check
 * @returns Rate limit result with success status and headers
 */
export async function checkRateLimit(
  limiterPromise: Promise<Ratelimit | null>,
  userId: string
): Promise<RateLimitResult> {
  const limiter = await limiterPromise;

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
export function createRateLimitHeaders(
  result: RateLimitResult
): Record<string, string> {
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
  return !!(process.env.REDIS_URL || (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN));
}
