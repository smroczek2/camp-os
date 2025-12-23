# Vercel KV Setup Guide

This guide walks you through setting up Vercel KV (Redis) for rate limiting in Camp OS.

## What is Vercel KV (Redis via Marketplace)?

Vercel KV is a serverless Redis database service built on top of Upstash Redis. As of 2025, it's available through the **Vercel Marketplace as "Redis"** (powered by Upstash).

**It's Real Redis, But Serverless:**
- Same Redis data structures (strings, hashes, lists, sets, sorted sets)
- Same Redis commands (SET, GET, INCR, EXPIRE, etc.)
- HTTP REST API instead of TCP (works in serverless/edge)
- No persistent connections needed
- Auto-configured by Vercel

**Key Features:**
- Serverless Redis (no connection management needed)
- REST API (works in edge/serverless functions)
- Global replication for low latency
- Pay-per-use pricing
- **Free tier: 300K commands/month** (plenty for most apps)

---

## Production Setup (Vercel Dashboard)

### Step 1: Create Redis Database via Marketplace

**Updated for 2025 Vercel UI:**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (camp-os)
3. Click the **"Storage"** tab
4. Scroll to **"Marketplace Database Providers"**
5. Click **"Upstash"** (or click **"Redis"** under Serverless DB)
6. Click **"Create Redis Database"** (or "Add Integration" if first time)
7. If first time with Upstash:
   - Click **"Continue"** to connect Upstash account
   - Vercel auto-creates and links your Upstash account
   - Grant permissions
8. Configure database:
   - **Name:** `camp-os-redis`
   - **Region:** Choose closest to your deployment (e.g., us-east-1)
   - **Type:** Regional (recommended for lower cost) or Global (multi-region)
9. Select projects to link:
   - ✅ Check **camp-os**
   - Click **"Add Integration"**

**That's it!** Vercel automatically:
- Provisions an Upstash Redis instance
- Adds environment variables to your project (`KV_REST_API_URL`, `KV_REST_API_TOKEN`)
- Configures them for all deployments (production + previews)

### Step 2: Deploy Your App

Just push to your connected Git repository:

```bash
git push origin main
```

Vercel will automatically:
- Use the KV database
- Enable rate limiting
- No manual env var configuration needed

### Step 3: Verify Rate Limiting Works

After deployment, test an AI endpoint:

```bash
# Make 11 requests quickly (exceeds 10 req/hour limit)
for i in {1..11}; do
  curl -X POST https://your-app.vercel.app/api/chat \
    -H "Cookie: your-session-cookie" \
    -H "Content-Type: application/json" \
    -d '{"messages":[{"role":"user","content":"test"}]}'
done
```

The 11th request should return `429 Too Many Requests`.

---

## Local Development Setup

### Step 1: Pull Environment Variables

```bash
# Install Vercel CLI if you haven't
npm install -g vercel

# Link your local project to Vercel (one-time)
vercel link

# Pull environment variables from Vercel
vercel env pull .env.local
```

This creates `.env.local` with:
```env
KV_REST_API_URL="https://your-region-xxxxx.upstash.io"
KV_REST_API_TOKEN="your-token-here"
KV_REST_API_READ_ONLY_TOKEN="your-readonly-token"
```

### Step 2: Run Development Server

```bash
npm run dev
```

Rate limiting now works locally using the same KV database as production!

---

## Monitoring & Analytics

### View Usage in Vercel Dashboard

1. Go to Vercel Dashboard → Your Project → Storage
2. Click on your KV database
3. View:
   - **Commands per day** - API usage
   - **Storage used** - Data stored
   - **Analytics** - Rate limit hits by endpoint

### View in Upstash Console (Advanced)

Since Vercel KV is powered by Upstash, you can also:

1. Go to [Upstash Console](https://console.upstash.com/)
2. Sign in with the same email as Vercel
3. View detailed analytics:
   - Rate limit hits by user
   - Request patterns
   - Peak usage times

---

## Pricing

### Free Tier (Perfect for Development & Small Apps)

- **300,000 commands/month** (10x more than direct Upstash free tier)
- **256 MB storage**
- **100 MB bandwidth**

**Example usage for Camp OS:**
- 1,000 daily active users
- 5 AI interactions per user
- = 5,000 commands/day = 150,000 commands/month
- **Still within free tier!**

### Pro Tier (When You Scale)

- **$0.15 per 100K commands** (after free tier)
- **$0.25 per GB storage**

**Example cost for 1M commands/month:**
- Free tier: 300K commands
- Paid: 700K commands × $0.15/100K = **$1.05/month**

**Much cheaper than alternatives!**

---

## Configuration Options

### Adjust Rate Limits (src/lib/rate-limit.ts)

```typescript
export const rateLimiters = {
  // AI Chat: 10 requests per hour
  aiChat: new Ratelimit({
    redis: kv,
    limiter: Ratelimit.slidingWindow(10, "1h"),
  }),

  // Form Generation: 20 requests per day
  formGeneration: new Ratelimit({
    redis: kv,
    limiter: Ratelimit.slidingWindow(20, "1d"),
  }),

  // Form Approval: 50 requests per day
  formApproval: new Ratelimit({
    redis: kv,
    limiter: Ratelimit.slidingWindow(50, "1d"),
  }),
};
```

**Customize for your needs:**
- Increase limits for admin users
- Add per-IP limits for anonymous users
- Different limits for different subscription tiers

### Rate Limiting Algorithms

```typescript
// Sliding Window (Recommended - smoothest experience)
Ratelimit.slidingWindow(10, "1h")

// Fixed Window (Simpler, but allows bursts at window boundaries)
Ratelimit.fixedWindow(10, "1h")

// Token Bucket (Allows short bursts, refills over time)
Ratelimit.tokenBucket(10, "1h", 1)
```

---

## Troubleshooting

### Rate Limiting Not Working

**Check 1: Verify KV is configured**
```bash
# In Vercel Dashboard → Storage
# You should see your KV database listed
```

**Check 2: Verify environment variables**
```bash
# In Vercel Dashboard → Settings → Environment Variables
# Should see: KV_REST_API_URL, KV_REST_API_TOKEN
```

**Check 3: Check local .env.local**
```bash
# Should have KV variables
cat .env.local | grep KV_
```

**Check 4: Check logs**
```typescript
// Rate limiting gracefully fails without Redis
// You'll see console warnings if KV not configured:
// "Rate limiting not configured - skipping rate limit check"
```

### Local Development Without KV

Rate limiting gracefully degrades when KV is not configured:
- All rate limit checks return `success: true`
- Console warning printed
- App continues to work (development-friendly)

To enable locally:
```bash
vercel env pull .env.local
```

---

## Security Best Practices

### 1. Different Limits by Role

```typescript
// Example: Higher limits for admins
async function getRateLimiter(userRole: string) {
  const limit = userRole === "admin" ? 100 : 10;
  return new Ratelimit({
    redis: kv,
    limiter: Ratelimit.slidingWindow(limit, "1h"),
  });
}
```

### 2. Add IP-Based Limits

```typescript
// Protect against unauthenticated abuse
const ipLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(50, "1h"),
  prefix: "ratelimit:ip",
});

const ip = request.headers.get("x-forwarded-for") || "unknown";
await ipLimit.limit(ip);
```

### 3. Monitor Rate Limit Hits

```typescript
const result = await checkRateLimit(rateLimiters.aiChat, userId);

if (!result.success) {
  // Log for security monitoring
  console.warn(`Rate limit exceeded for user ${userId}`);
  // Consider alerting if same user hits limit repeatedly
}
```

---

## Migration from Direct Upstash (If Needed)

If you have an existing Upstash Redis instance:

**Option A: Keep Using It**
- Your current code still works
- Vercel KV and direct Upstash are compatible
- No migration needed

**Option B: Migrate to Vercel KV**
- Data is stored in same format
- No data migration needed
- Just create new KV database and switch code

**We chose Option B** for easier setup and better Vercel integration.

---

## Alternative: Vercel Edge Middleware (Advanced)

For even better performance, move rate limiting to Edge Middleware:

```typescript
// middleware.ts
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, "1m"),
});

export async function middleware(request: Request) {
  const ip = request.ip ?? "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/chat/:path*",
};
```

**Benefits:**
- Runs at the edge (faster than API routes)
- Blocks requests before hitting your functions
- Lower costs (edge is cheaper than serverless)

---

## FAQ

**Q: Do I need an Upstash account?**
A: No! Vercel creates and manages everything for you.

**Q: Will this work in development?**
A: Yes, after running `vercel env pull .env.local`

**Q: What if I don't use Vercel?**
A: Keep the current Upstash setup - it works anywhere.

**Q: Can I use this for other projects?**
A: Yes! Same KV database can be shared across projects.

**Q: What happens if KV goes down?**
A: Rate limiting gracefully fails-open (allows requests with warning logged).

---

## Next Steps

1. ✅ Code is ready (migrated to Vercel KV)
2. Create KV database in Vercel Dashboard (1 minute)
3. Deploy to Vercel (automatic)
4. Test rate limiting in production
5. Monitor usage in Vercel Storage dashboard
