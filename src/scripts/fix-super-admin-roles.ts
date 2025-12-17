import "dotenv/config";
import { db } from "../lib/db";
import { user } from "../lib/schema";
import { eq, like } from "drizzle-orm";

/**
 * Fix super_admin roles for @campminder.com users
 *
 * This script updates existing users with @campminder.com emails
 * to have the super_admin role.
 *
 * Run with: npx tsx src/scripts/fix-super-admin-roles.ts
 */
async function fixSuperAdminRoles() {
  console.log("Checking for @campminder.com users without super_admin role...\n");

  // Find all campminder.com users
  const campmiderUsers = await db.query.user.findMany({
    where: like(user.email, "%@campminder.com"),
  });

  if (campmiderUsers.length === 0) {
    console.log("No @campminder.com users found in database.");
    return;
  }

  console.log(`Found ${campmiderUsers.length} @campminder.com user(s):\n`);

  for (const u of campmiderUsers) {
    console.log(`  - ${u.name} (${u.email})`);
    console.log(`    Current role: ${u.role}`);

    if (u.role !== "super_admin") {
      await db
        .update(user)
        .set({ role: "super_admin", updatedAt: new Date() })
        .where(eq(user.id, u.id));

      console.log(`    ✅ Updated to: super_admin`);
    } else {
      console.log(`    Already super_admin, no change needed`);
    }
    console.log("");
  }

  console.log("Done!");
}

fixSuperAdminRoles()
  .catch(console.error)
  .finally(() => process.exit(0));
