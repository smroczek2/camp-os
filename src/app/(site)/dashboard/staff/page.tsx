import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { assignments } from "@/lib/schema";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, AlertCircle, Activity } from "lucide-react";
import Link from "next/link";

export default async function StaffDashboard() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Get staff assignments
  const myAssignments = await db.query.assignments.findMany({
    where: eq(assignments.staffId, session.user.id),
    with: {
      group: {
        with: {
          members: {
            with: {
              child: true,
            },
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Staff Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          Welcome, {session.user.name}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/10">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{myAssignments.length}</p>
              <p className="text-sm text-muted-foreground">
                Group{myAssignments.length !== 1 ? "s" : ""} Assigned
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalChildren}</p>
              <p className="text-sm text-muted-foreground">
                Children in Care
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-orange-500/10">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {new Set(myAssignments.map((a) => a.sessionId)).size}
              </p>
              <p className="text-sm text-muted-foreground">Active Sessions</p>
            </div>
          </div>
        </div>
      </div>

      {/* My Groups */}
      <div>
        <h2 className="text-2xl font-bold mb-6">My Groups</h2>

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
                {/* Group Header */}
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
                      {new Date(
                        assignment.session.startDate
                      ).toLocaleDateString()}{" "}
                      -{" "}
                      {new Date(
                        assignment.session.endDate
                      ).toLocaleDateString()}
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

                {/* Children Roster */}
                {assignment.group.members.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="font-medium mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Roster
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {assignment.group.members.map((member) => (
                        <div
                          key={member.id}
                          className="p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <p className="font-medium text-sm">
                            {member.child.firstName} {member.child.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Born{" "}
                            {new Date(
                              member.child.dateOfBirth
                            ).toLocaleDateString()}
                          </p>
                          {member.child.allergies &&
                            member.child.allergies.length > 0 && (
                              <div className="flex items-center gap-1 mt-2">
                                <AlertCircle className="h-3 w-3 text-red-600" />
                                <p className="text-xs text-red-600">
                                  {member.child.allergies.length} allerg
                                  {member.child.allergies.length !== 1
                                    ? "ies"
                                    : "y"}
                                </p>
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
