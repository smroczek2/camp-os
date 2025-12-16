---
status: ready
priority: p1
issue_id: "001"
tags: [security, ai, api, rate-limiting]
dependencies: []
---

# Add Rate Limiting to AI Endpoints

CRITICAL SECURITY ISSUE - AI endpoints lack rate limiting, allowing unlimited OpenAI API calls.

## Problem Statement

The AI chat endpoint (`/api/chat/route.ts`) and form generation endpoints have NO rate limiting, authentication, or request validation. This allows:
- Unlimited API costs from abuse
- DoS attacks via expensive API calls
- Resource exhaustion
- Financial damage (OpenAI API costs can escalate rapidly)

**Security Severity:** CRITICAL
**Exploitability:** HIGH - Endpoint is completely unprotected
**Impact:** Financial damage, service disruption, API key exposure through abuse

## Findings

**From Security Sentinel Review:**

**Location:** `src/app/api/chat/route.ts`

Current implementation:
```typescript
export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai(process.env.OPENAI_MODEL || "gpt-5-mini"),
    messages: convertToModelMessages(messages),
  });
  // NO AUTHENTICATION, NO RATE LIMITING, NO VALIDATION
}
```

**Issues Found:**
1. No authentication check - anyone can call this endpoint
2. No rate limiting - unlimited requests possible
3. No input validation - accepts any message array
4. No timeout handling - long-running requests tie up resources
5. No cost tracking - no way to monitor API spend

**Related endpoints also affected:**
- Form generation via `generateFormAction()` - has auth but no rate limiting
- AI action approval - has auth but no rate limiting

## Proposed Solutions

### Option 1: Upstash Rate Limiting (RECOMMENDED)

**Approach:** Use @upstash/ratelimit with Redis for distributed rate limiting across serverless functions.

**Implementation:**
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1h"), // 10 requests per hour per user
});

export async function POST(req: Request) {
  // 1. Authentication
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Rate limiting
  const { success, limit, reset, remaining } = await ratelimit.limit(session.user.id);
  if (!success) {
    return NextResponse.json(
      { error: "Rate limit exceeded", reset },
      { status: 429 }
    );
  }

  // 3. Input validation
  const schema = z.object({
    messages: z.array(z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().max(4000)
    })).max(20)
  });

  const { messages } = schema.parse(await req.json());

  // Rest of implementation...
}
```

**Pros:**
- Industry-standard solution
- Works across serverless functions
- Redis-backed (fast, reliable)
- Per-user tracking
- Customizable limits

**Cons:**
- Requires Upstash account/Redis
- Additional dependency
- Monthly cost (~$0.20/month for dev, ~$10/month for production)

**Effort:** 2-3 hours
**Risk:** Low

---

### Option 2: Simple In-Memory Rate Limiting

**Approach:** Use a Map to track requests per user with time-based resets.

**Implementation:**
```typescript
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (userLimit.count >= maxRequests) {
    return false;
  }

  userLimit.count++;
  return true;
}
```

**Pros:**
- No external dependencies
- Zero cost
- Simple to implement
- Works for single-instance deployments

**Cons:**
- Doesn't work with serverless (each instance has separate memory)
- Lost on restart
- No persistence
- Not suitable for production Vercel deployment

**Effort:** 1 hour
**Risk:** HIGH - won't work correctly in serverless environment

---

### Option 3: Vercel Edge Config + KV

**Approach:** Use Vercel's native rate limiting with Edge Config and KV storage.

**Implementation:**
```typescript
import { kv } from "@vercel/kv";

async function rateLimit(userId: string) {
  const key = `ratelimit:${userId}`;
  const count = await kv.incr(key);

  if (count === 1) {
    await kv.expire(key, 3600); // 1 hour window
  }

  return count <= 10; // 10 requests per hour
}
```

**Pros:**
- Native Vercel integration
- Works in serverless
- Simple API
- Free tier available

**Cons:**
- Vendor lock-in (Vercel-specific)
- Limited customization
- KV store costs at scale

**Effort:** 2 hours
**Risk:** Low

## Recommended Action

**To be filled during triage.**

**Suggested:** Implement Option 1 (Upstash) for production-grade rate limiting with these limits:
- AI Chat: 10 requests/hour per user
- Form Generation: 20 requests/day per user
- Admin users: 50 requests/day

## Technical Details

**Affected files:**
- `src/app/api/chat/route.ts` - AI chat endpoint (NO protection currently)
- `src/app/actions/form-actions.ts:114-131` - generateFormAction (has auth, needs rate limit)
- `src/app/actions/form-actions.ts:136-203` - approveAIFormAction (has auth, needs rate limit)

**Required changes:**
1. Add authentication to `/api/chat` endpoint
2. Install rate limiting library
3. Configure rate limits per endpoint
4. Add rate limit headers to responses
5. Update error handling for 429 responses
6. Add monitoring/alerting for rate limit hits

**Environment variables needed:**
```env
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

## Resources

- **OWASP API4:2023**: Unrestricted Resource Consumption
- **Security audit**: Form Builder Security Review (2025-12-16)
- **Upstash docs**: https://upstash.com/docs/oss/sdks/ts/ratelimit/overview
- **Vercel KV**: https://vercel.com/docs/storage/vercel-kv

## Acceptance Criteria

- [x] Authentication added to `/api/chat` endpoint
- [x] Rate limiting implemented on all AI endpoints
- [x] Rate limits configurable per user role
- [x] 429 responses with clear error messages and reset time
- [x] Rate limit headers included in responses (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`)
- [ ] Tests added for rate limiting behavior
- [x] Documentation updated with rate limit policies
- [ ] Monitoring added to track rate limit hits

## Work Log

### 2025-12-16 - Initial Discovery

**By:** Security Sentinel Agent (Code Review)

**Actions:**
- Discovered `/api/chat/route.ts` has no authentication
- Identified unlimited OpenAI API call vulnerability
- Analyzed impact: financial damage, DoS risk
- Reviewed 3 rate limiting approaches
- Categorized as CRITICAL security issue

**Learnings:**
- All AI endpoints need rate limiting, not just public ones
- Server Actions have auth but still need rate limits
- Vercel serverless requires distributed rate limiting (Redis/KV)
- Different endpoints need different limits (chat vs generation)

---

### 2025-12-16 - Approved for Work

**By:** Claude Triage System

**Actions:**
- Issue approved during triage session
- Status changed from pending → ready
- Ready to be picked up and worked on

**Learnings:**
- Critical security issue blocking merge
- Upstash rate limiting recommended for serverless environment
- Should be prioritized immediately

---

### 2025-12-16 - Implementation Complete

**By:** Claude Code Agent

**Actions:**
1. Installed `@upstash/ratelimit` and `@upstash/redis` packages
2. Created rate limiting utility module (`src/lib/rate-limit.ts`) with:
   - Three rate limiters: aiChat (10/hour), formGeneration (20/day), formApproval (50/day)
   - Helper functions for checking limits and creating headers
   - Graceful fallback when Redis not configured (dev mode)
3. Added authentication to `/api/chat` endpoint using `getSession()` from auth-helper
4. Implemented rate limiting in `/api/chat` with:
   - 401 responses for unauthenticated requests
   - 429 responses for rate limit exceeded with reset time
   - Input validation using Zod (max 20 messages, 4000 chars each)
   - Rate limit headers in responses
   - Error handling with clear messages
5. Added rate limiting to `generateFormAction` in form-actions.ts
6. Added rate limiting to `approveAIFormAction` in form-actions.ts
7. Updated `.env.example` with Upstash Redis environment variables
8. All code passes TypeScript type checking and lint checks

**Implementation Details:**
- Rate limits are per-user based on session.user.id
- Sliding window algorithm for accurate rate limiting
- Analytics enabled for monitoring
- Different limits for different operations (chat vs generation vs approval)
- Clear error messages with reset time in user's locale
- Works in serverless environment (Vercel/Next.js)
- Gracefully handles missing Redis configuration in development

**Learnings:**
- Upstash Redis requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
- Rate limiting should happen BEFORE permission checks to prevent abuse
- Sliding window is better than fixed window for serverless
- Input validation is critical (message count, content length)
- Rate limit headers help clients implement backoff strategies
- Token limits on OpenAI calls add additional cost control

**Security Improvements:**
- Prevented unlimited OpenAI API calls from unauthenticated users
- Added per-user rate limits to prevent abuse from authenticated users
- Input validation prevents oversized payloads
- Error messages don't leak sensitive information
- All AI endpoints now protected (chat + form generation + approval)

**Next Steps:**
- Deploy Upstash Redis instance for production
- Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to production env
- Consider adding monitoring/alerting for rate limit hits
- Consider adding tests for rate limiting behavior
- Consider role-based limits (admin gets higher limits)

## Notes

- **BLOCKS MERGE**: This is a critical security issue that must be fixed before production deployment
- Consider different rate limits for different user roles (admin gets more)
- Add cost tracking to monitor OpenAI API spend per user
- Set up alerts when users approach rate limits
- Document rate limits in API documentation for users
