import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { assignments } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { Calendar, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/dashboard/breadcrumb";
import { CheckInListWrapper } from "@/components/admin/check-in-list-wrapper";

export const dynamic = "force-dynamic";

export default async function StaffAttendancePage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "staff") {
    redirect("/dashboard");
  }

  const myAssignments = await db.query.assignments.findMany({
    where: eq(assignments.staffId, session.user.id),
    with: {
      session: true,
    },
  });

  const activeSessionsMap = new Map(
    myAssignments
      .filter((assignment) => assignment.session.status === "open")
      .map((assignment) => [assignment.sessionId, assignment.session])
  );

  const activeSessions = Array.from(activeSessionsMap.values());

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard/staff" },
          { label: "Attendance" },
        ]}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Attendance</h1>
        <p className="text-muted-foreground">
          Check in and check out children for your assigned sessions.
        </p>
      </div>

      {activeSessions.length === 0 ? (
        <div className="text-center p-12 border rounded-xl bg-muted/30">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            No active sessions assigned right now
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeSessions.map((activeSession) => (
            <div
              key={activeSession.id}
              className="border rounded-xl p-6 bg-card shadow-sm"
            >
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold">
                    {activeSession.name}
                  </h3>
                  <Badge variant="default">Open</Badge>
                </div>
                {activeSession.description && (
                  <p className="text-sm text-muted-foreground">
                    {activeSession.description}
                  </p>
                )}
                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(activeSession.startDate).toLocaleDateString()} -{" "}
                  {new Date(activeSession.endDate).toLocaleDateString()}
                </p>
              </div>

              <CheckInListWrapper sessionId={activeSession.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
