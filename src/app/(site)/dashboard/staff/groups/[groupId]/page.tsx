import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { assignments } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { Users, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/dashboard/breadcrumb";

interface Props {
  params: Promise<{ groupId: string }>;
}

export default async function StaffGroupDetailPage({ params }: Props) {
  const { groupId } = await params;
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "staff") {
    redirect("/dashboard");
  }

  const assignment = await db.query.assignments.findFirst({
    where: and(
      eq(assignments.staffId, session.user.id),
      eq(assignments.groupId, groupId)
    ),
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

  if (!assignment) {
    notFound();
  }

  const { group } = assignment;

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard/staff" },
          { label: "Groups", href: "/dashboard/staff/groups" },
          { label: group.name },
        ]}
      />

      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{group.name}</h1>
            <p className="text-muted-foreground">
              {new Date(assignment.session.startDate).toLocaleDateString()} -{" "}
              {new Date(assignment.session.endDate).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {assignment.role}
            </Badge>
            <Badge variant="outline">{group.type}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/10">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{group.members.length}</p>
              <p className="text-sm text-muted-foreground">Children</p>
            </div>
          </div>
        </div>
        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{group.capacity}</p>
              <p className="text-sm text-muted-foreground">Capacity</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6">Roster</h2>
        {group.members.length === 0 ? (
          <div className="text-center p-12 border rounded-xl bg-muted/30">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No children assigned yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {group.members.map((member) => (
              <div
                key={member.id}
                className="p-3 border rounded-lg bg-muted/30"
              >
                <p className="font-medium text-sm">
                  {member.child.firstName} {member.child.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Born {new Date(member.child.dateOfBirth).toLocaleDateString()}
                </p>
                {member.child.allergies && member.child.allergies.length > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <AlertCircle className="h-3 w-3 text-red-600" />
                    <p className="text-xs text-red-600">
                      {member.child.allergies.length} allerg
                      {member.child.allergies.length !== 1 ? "ies" : "y"}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
