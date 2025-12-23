import "dotenv/config";
import { db } from "../lib/db";
import { user, accountNotes, accountContacts, payments, charges } from "../lib/schema";

async function verifySchema() {
  console.log("Verifying schema and database setup...\n");

  // Test 1: Check if new columns exist in user table
  console.log("1. Checking user table columns...");
  const users = await db.select().from(user).limit(1);
  if (users.length > 0) {
    const firstUser = users[0];
    console.log(`   - accountNumber: ${firstUser.accountNumber || "NULL"}`);
    console.log(`   - accountStatus: ${firstUser.accountStatus}`);
    console.log(`   - internalNotes: ${firstUser.internalNotes || "NULL"}`);
    console.log("   ✓ User table columns verified\n");
  }

  // Test 2: Check if new tables exist
  console.log("2. Checking new tables...");

  try {
    await db.select().from(accountNotes).limit(0);
    console.log("   ✓ accountNotes table exists");
  } catch {
    console.log("   ✗ accountNotes table missing");
  }

  try {
    await db.select().from(accountContacts).limit(0);
    console.log("   ✓ accountContacts table exists");
  } catch {
    console.log("   ✗ accountContacts table missing");
  }

  try {
    await db.select().from(payments).limit(0);
    console.log("   ✓ payments table exists");
  } catch {
    console.log("   ✗ payments table missing");
  }

  try {
    await db.select().from(charges).limit(0);
    console.log("   ✓ charges table exists");
  } catch {
    console.log("   ✗ charges table missing");
  }

  console.log("\n3. Checking account numbers...");
  const usersWithAccountNumbers = await db
    .select({
      id: user.id,
      name: user.name,
      accountNumber: user.accountNumber,
    })
    .from(user)
    .limit(5);

  console.log(`   Found ${usersWithAccountNumbers.length} users:`);
  usersWithAccountNumbers.forEach((u) => {
    console.log(`   - ${u.name}: ${u.accountNumber}`);
  });

  console.log("\n✓ Schema verification complete!");
}

verifySchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Verification failed:", error);
    process.exit(1);
  });
