import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const camps = await db.query.camps.findMany({
      columns: { id: true, name: true },
    });

    const sessions = await db.query.sessions.findMany({
      columns: { id: true, campId: true, startDate: true },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      orderBy: (sessions: any, { desc }: any) => [desc(sessions.startDate)],
    });

    return NextResponse.json({ camps, sessions });
  } catch (error) {
    console.error("Error fetching camps:", error);
    return NextResponse.json(
      { error: "Failed to fetch camps" },
      { status: 500 }
    );
  }
}
