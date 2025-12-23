import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { children, sessions } from "@/lib/schema";
import { eq, or } from "drizzle-orm";
import { Calendar } from "lucide-react";
import { BrowseSessionsSection } from "@/components/parent/browse-sessions-section";
import { Breadcrumb } from "@/components/dashboard/breadcrumb";

export default async function ParentSessionsPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const myChildren = await db.query.children.findMany({
    where: eq(children.userId, session.user.id),
  });

  const allSessionsRaw = await db.query.sessions.findMany({
    where: or(eq(sessions.status, "open"), eq(sessions.status, "draft")),
    with: {
      registrations: {
        columns: { status: true },
        where: (reg, { eq }) => eq(reg.status, "confirmed"),
      },
    },
    orderBy: (allSessions, { desc }) => [desc(allSessions.startDate)],
    limit: 50,
  });

  const allSessions = allSessionsRaw.map((campSession) => ({
    ...campSession,
    confirmedCount: campSession.registrations.length,
  }));

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard/parent" },
          { label: "Sessions" },
        ]}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Camp Sessions</h1>
        <p className="text-muted-foreground">
          Browse upcoming sessions and register your children.
        </p>
      </div>

      {allSessions.length === 0 ? (
        <div className="text-center p-12 border rounded-xl bg-muted/30">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No sessions available</p>
        </div>
      ) : (
        <BrowseSessionsSection
          sessions={allSessions}
          childrenList={myChildren}
        />
      )}
    </div>
  );
}
