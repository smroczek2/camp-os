import { getSession } from "@/lib/auth-helper";
import { withOrganizationContext } from "@/lib/db/tenant-context";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.user.activeOrganizationId) {
    return NextResponse.json(
      { error: "No active organization" },
      { status: 400 }
    );
  }

  try {
    const result = await withOrganizationContext(
      session.user.activeOrganizationId,
      async (tx) => {
        const camps = await tx.query.camps.findMany({
          columns: { id: true, name: true },
        });

        const sessions = await tx.query.sessions.findMany({
          columns: { id: true, campId: true, startDate: true },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          orderBy: (sessions: any, { desc }: any) => [desc(sessions.startDate)],
        });

        return { camps, sessions };
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching camps:", error);
    return NextResponse.json(
      { error: "Failed to fetch camps" },
      { status: 500 }
    );
  }
}
