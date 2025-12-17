import { config } from "dotenv";
config(); // Load .env file

import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function dropAllTables() {
  console.log("Dropping all tables...");

  try {
    // Drop all tables in reverse dependency order
    await db.execute(sql`DROP TABLE IF EXISTS form_submissions CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS form_snapshots CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS form_options CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS form_fields CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS form_definitions CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS ai_actions CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS medication_logs CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS attendance CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS group_members CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS assignments CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS groups CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS events CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS documents CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS incidents CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS registrations CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS sessions CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS camps CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS medications CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS children CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS organization_users CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS organizations CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS verification CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS session CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS account CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS "user" CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS __drizzle_migrations CASCADE`);

    console.log("✓ All tables dropped successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error dropping tables:", error);
    process.exit(1);
  }
}

dropAllTables();
