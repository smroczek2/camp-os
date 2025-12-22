import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { desc } from "drizzle-orm";
import { sessions } from "@/lib/schema";

export async function GET() {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allSessions = await db.query.sessions.findMany({
      orderBy: [desc(sessions.startDate)],
    });

    return NextResponse.json({ sessions: allSessions });
  } catch (error) {
    console.error("Failed to fetch sessions:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}
