import "dotenv/config";
import { scryptSync, randomBytes } from "crypto";
import { db } from "../lib/db";
import { account } from "../lib/schema";
import { eq } from "drizzle-orm";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const normalized = password.normalize("NFKC");
  const N = 16384;
  const r = 16;
  const p = 1;
  const dkLen = 64;
  const maxmem = 128 * N * r * 2;
  const hash = scryptSync(normalized, salt, dkLen, { N, r, p, maxmem }).toString(
    "hex"
  );
  return `${salt}:${hash}`;
}

async function fixSeededPasswords() {
  const seededAccountIds = [
    "account-admin-1",
    "account-staff-1",
    "account-staff-2",
    "account-nurse-1",
    "account-parent-1",
    "account-parent-2",
    "account-parent-3",
  ];

  console.log("Updating seeded credential passwords to use Better Auth hashing...");

  for (const accountId of seededAccountIds) {
    const password = hashPassword("password123");
    const updated = await db
      .update(account)
      .set({ password, updatedAt: new Date() })
      .where(eq(account.id, accountId))
      .returning({ id: account.id });

    if (updated.length === 0) {
      console.log(`- ${accountId}: not found (skipped)`);
    } else {
      console.log(`- ${accountId}: updated`);
    }
  }

  console.log("Done.");
}

fixSeededPasswords()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
