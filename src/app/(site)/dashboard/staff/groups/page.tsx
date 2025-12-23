import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { assignments } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { Users } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/dashboard/breadcrumb";

export default async function StaffGroupsPage() {
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
      group: {
        with: {
          members: {
            with: { child: true },
          },
        },
      },
      session: true,
    },
  });

  const totalChildren = myAssignments.reduce(
    (sum, assignment) => sum + assignment.group.members.length,
    0
  );
  const sessionCount = new Set(myAssignments.map((a) => a.sessionId)).size;

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard/staff" },
          { label: "Groups" },
        ]}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Groups</h1>
        <p className="text-muted-foreground">
          View the groups you are assigned to and their rosters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/10">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{myAssignments.length}</p>
              <p className="text-sm text-muted-foreground">Groups</p>
            </div>
          </div>
        </div>
        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalChildren}</p>
              <p className="text-sm text-muted-foreground">Children</p>
            </div>
          </div>
        </div>
        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-orange-500/10">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{sessionCount}</p>
              <p className="text-sm text-muted-foreground">Sessions</p>
            </div>
          </div>
        </div>
      </div>

      {myAssignments.length === 0 ? (
        <div className="text-center p-12 border rounded-xl bg-muted/30">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No groups assigned yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {myAssignments.map((assignment) => (
            <Link
              key={assignment.id}
              href={`/dashboard/staff/groups/${assignment.group.id}`}
              className="block"
            >
              <div className="p-6 border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-xl">
                        {assignment.group.name}
                      </h3>
                      <Badge variant="outline" className="capitalize">
                        {assignment.role}
                      </Badge>
                      <Badge variant="outline">{assignment.group.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(assignment.session.startDate).toLocaleDateString()}{" "}
                      -{" "}
                      {new Date(assignment.session.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {assignment.group.members.length} /{" "}
                      {assignment.group.capacity}
                    </p>
                    <p className="text-sm text-muted-foreground">Children</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Click to view roster and attendance for this group.
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
