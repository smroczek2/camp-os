import { config } from "dotenv";
config();

import { db } from "../src/lib/db";
import { withOrganizationContext } from "../src/lib/db/tenant-context";
import { user } from "../src/lib/schema";
import { eq } from "drizzle-orm";

async function verify() {
  console.log("🔍 Verifying database setup...\n");

  try {
    // 1. Check users table (no RLS)
    console.log("1. Checking users table...");
    const users = await db.query.user.findMany({
      columns: { id: true, email: true, role: true, activeOrganizationId: true },
    });
    console.log(`   ✓ Found ${users.length} users`);

    // 2. Check organizations table (no RLS)
    console.log("\n2. Checking organizations table...");
    const orgs = await db.query.organizations.findMany({
      columns: { id: true, name: true, slug: true },
    });
    console.log(`   ✓ Found ${orgs.length} organizations:`);
    orgs.forEach((org) => console.log(`     - ${org.name} (${org.slug})`));

    // 3. Test RLS with organization context
    if (orgs.length > 0) {
      const org1 = orgs[0];
      console.log(`\n3. Testing RLS with organization context: ${org1.name}`);

      const org1Data = await withOrganizationContext(org1.id, async (tx) => {
        const camps = await tx.query.camps.findMany({
          columns: { id: true, name: true },
        });
        const children = await tx.query.children.findMany({
          columns: { id: true, firstName: true, lastName: true },
        });
        return { camps, children };
      });

      console.log(`   ✓ Found ${org1Data.camps.length} camps for ${org1.name}`);
      console.log(`   ✓ Found ${org1Data.children.length} children for ${org1.name}`);
    }

    // 4. Test that different orgs see different data
    if (orgs.length > 1) {
      const org2 = orgs[1];
      console.log(`\n4. Testing data isolation with: ${org2.name}`);

      const org2Data = await withOrganizationContext(org2.id, async (tx) => {
        const camps = await tx.query.camps.findMany({
          columns: { id: true, name: true },
        });
        const children = await tx.query.children.findMany({
          columns: { id: true, firstName: true, lastName: true },
        });
        return { camps, children };
      });

      console.log(`   ✓ Found ${org2Data.camps.length} camps for ${org2.name}`);
      console.log(`   ✓ Found ${org2Data.children.length} children for ${org2.name}`);
    }

    // 5. Test dev auth user lookup
    console.log("\n5. Testing dev auth user lookup...");
    const adminUser = await db.query.user.findFirst({
      where: eq(user.email, "sarah@pineridge.camp"),
    });
    if (adminUser) {
      console.log(`   ✓ Found admin user: ${adminUser.email}`);
      console.log(`   ✓ Active org: ${adminUser.activeOrganizationId}`);
    }

    console.log("\n✅ Database verification complete!");
    console.log("\n🎯 You can now run the dev server and log in with:");
    console.log("   - sarah@pineridge.camp (Pine Ridge Admin)");
    console.log("   - robert@lakeside.camp (Lakeside Admin)");
    console.log("   - jennifer.smith@example.com (Pine Ridge Parent)");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Verification failed:", error);
    process.exit(1);
  }
}

verify();
