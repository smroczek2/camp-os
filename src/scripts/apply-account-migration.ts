import "dotenv/config";
import { db } from "../lib/db";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

async function applyMigration() {
  console.log("Applying account management migration...");

  const migrationSQL = fs.readFileSync(
    path.join(process.cwd(), "drizzle", "0010_military_spirit.sql"),
    "utf-8"
  );

  // Split by statement-breakpoint and filter out empty statements
  const statements = migrationSQL
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`Found ${statements.length} SQL statements to execute.`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    try {
      await db.execute(sql.raw(statement));
      console.log(`✓ Statement ${i + 1}/${statements.length} executed successfully`);
    } catch (error: unknown) {
      // Check if error is because table/column already exists
      const err = error as { message?: string; code?: string };
      if (
        err.message?.includes("already exists") ||
        err.code === "42P07" || // duplicate table
        err.code === "42701" // duplicate column
      ) {
        console.log(
          `  Skipping statement ${i + 1}/${statements.length} (already exists)`
        );
      } else {
        console.error(`✗ Error executing statement ${i + 1}:`, err.message);
        throw error;
      }
    }
  }

  console.log("\nMigration completed successfully!");
}

applyMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
