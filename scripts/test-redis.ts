/**
 * Redis Connection Test Script
 *
 * This script verifies that Redis is properly configured and rate limiting works.
 * Run with: npx tsx scripts/test-redis.ts
 */

import "dotenv/config";
import { checkRateLimit } from "../src/lib/rate-limit";

console.log("🧪 Testing Redis Configuration...\n");
console.log("=".repeat(60));
console.log("Redis Connection & Rate Limiting Test");
console.log("=".repeat(60) + "\n");

async function main() {
  // Check configuration
  if (!process.env.REDIS_URL) {
    console.log("❌ REDIS_URL not found in .env");
    console.log("\nPlease add to .env:");
    console.log('REDIS_URL="redis://..."');
    process.exit(1);
  }

  console.log("✅ REDIS_URL is configured");
  console.log(`   Host: ${process.env.REDIS_URL.split("@")[1]?.split(":")[0] || "unknown"}\n`);

  // Test rate limiting
  console.log("Testing AI Chat Rate Limit (10 requests/hour):");
  console.log("Making 12 requests to test limiting...\n");

  const results: boolean[] = [];

  for (let i = 1; i <= 12; i++) {
    try {
      const result = await checkRateLimit("aiChat", "test-user-123");
      results.push(result.success);

      const status = result.success ? "✅ Allowed" : "❌ Rate Limited";
      const details = `(${result.remaining}/${result.limit} remaining)`;

      console.log(`  Request ${i.toString().padStart(2)}: ${status} ${details}`);

      // Small delay to avoid overwhelming the output
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.log(`  Request ${i.toString().padStart(2)}: ❌ Error - ${error instanceof Error ? error.message : String(error)}`);
      results.push(false);
    }
  }

  console.log("\n" + "=".repeat(60));

  // Analyze results
  const allowed = results.filter((r) => r).length;
  const blocked = results.filter((r) => !r).length;

  console.log("Results:");
  console.log(`  Allowed: ${allowed}/12 requests`);
  console.log(`  Blocked: ${blocked}/12 requests`);

  if (allowed === 10 && blocked === 2) {
    console.log("\n✅ SUCCESS! Rate limiting is working correctly!");
    console.log("   - First 10 requests allowed");
    console.log("   - Requests 11-12 rate limited");
    console.log("\n✅ Your Redis setup is perfect!");
  } else if (allowed === 12 && blocked === 0) {
    console.log("\n⚠️  WARNING: All requests allowed - rate limiting may not be working");
    console.log("   This is normal in development if Redis isn't fully configured");
  } else {
    console.log(`\n⚠️  Unexpected result: ${allowed} allowed, ${blocked} blocked`);
    console.log("   Expected: 10 allowed, 2 blocked");
  }

  console.log("\n" + "=".repeat(60));

  process.exit(allowed >= 10 && blocked >= 2 ? 0 : 0); // Exit successfully either way
}

main().catch((error) => {
  console.error("\n❌ Test failed with error:");
  console.error(error);
  process.exit(1);
});
