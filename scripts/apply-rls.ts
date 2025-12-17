import { config } from "dotenv";
config();

import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";
import { readFileSync } from "fs";
import { join } from "path";

async function applyRLS() {
  console.log("Applying RLS policies...");

  try {
    const rlsSQL = readFileSync(
      join(process.cwd(), "drizzle", "0005_enable_rls.sql"),
      "utf-8"
    );

    // Execute the RLS migration
    await db.execute(sql.raw(rlsSQL));

    console.log("✓ RLS policies applied successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error applying RLS policies:", error);
    process.exit(1);
  }
}

applyRLS();
