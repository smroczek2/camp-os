import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { attendance, sessions } from "@/lib/schema";
import { desc, and, gte, lte, eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Users,
  ChevronLeft,
  Clock,
  CheckCircle2,
  XCircle,
  UserCheck,
  UserX,
} from "lucide-react";
import Link from "next/link";
import { CheckInListWrapper } from "@/components/admin/check-in-list-wrapper";

export const dynamic = "force-dynamic";

export default async function AttendanceDashboardPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (!["admin", "staff"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  // Get today's date range
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  // Get today's attendance records
  const todayAttendance = await db.query.attendance.findMany({
    where: and(
      gte(attendance.date, startOfDay),
      lte(attendance.date, endOfDay)
    ),
    with: {
      child: true,
      session: true,
      checkedInByUser: true,
      checkedOutByUser: true,
    },
    orderBy: [desc(attendance.checkedInAt)],
  });

  // Get active sessions (open status)
  const activeSessions = await db.query.sessions.findMany({
    where: eq(sessions.status, "open"),
    with: {
      registrations: {
        where: (registrations, { eq }) => eq(registrations.status, "confirmed"),
        with: {
          child: true,
        },
      },
    },
    orderBy: [desc(sessions.startDate)],
  });

  // Get all groups for display
  const allGroups = await db.query.groups.findMany({
    with: {
      members: {
        with: {
          child: true,
        },
      },
      session: true,
    },
  });

  // Calculate stats
  const checkedInNow = todayAttendance.filter(
    (a) => a.checkedInAt && !a.checkedOutAt
  ).length;
  const checkedOutToday = todayAttendance.filter((a) => a.checkedOutAt).length;
  const totalRegistered = activeSessions.reduce(
    (sum, s) => sum + s.registrations.length,
    0
  );
  const notCheckedIn = totalRegistered - todayAttendance.length;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/admin"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Attendance Dashboard</h1>
            <p className="text-muted-foreground text-lg flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {today.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/10">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-3xl font-bold">{checkedInNow}</p>
              <p className="text-sm text-muted-foreground">Currently Here</p>
            </div>
          </div>
        </div>

        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10">
              <CheckCircle2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-3xl font-bold">{checkedOutToday}</p>
              <p className="text-sm text-muted-foreground">Checked Out</p>
            </div>
          </div>
        </div>

        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-orange-500/10">
              <UserX className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-3xl font-bold">{notCheckedIn > 0 ? notCheckedIn : 0}</p>
              <p className="text-sm text-muted-foreground">Not Checked In</p>
            </div>
          </div>
        </div>

        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-500/10">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-3xl font-bold">{totalRegistered}</p>
              <p className="text-sm text-muted-foreground">Total Registered</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Sessions Check-In */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">Check-In / Check-Out</h2>

        {activeSessions.length === 0 ? (
          <div className="text-center p-12 border rounded-xl bg-muted/30">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No active sessions today</p>
          </div>
        ) : (
          <div className="space-y-6">
            {activeSessions.map((activeSession) => (
              <div key={activeSession.id} className="border rounded-xl p-6 bg-card shadow-sm">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold">{activeSession.name}</h3>
                    <Badge variant="default">
                      {activeSession.registrations.length} Registered
                    </Badge>
                  </div>
                  {activeSession.description && (
                    <p className="text-sm text-muted-foreground">{activeSession.description}</p>
                  )}
                </div>

                <CheckInListWrapper sessionId={activeSession.id} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Groups Overview */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">Groups</h2>

        {allGroups.length === 0 ? (
          <div className="text-center p-12 border rounded-xl bg-muted/30">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No groups created yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allGroups.map((group) => {
              const groupAttendance = todayAttendance.filter((a) =>
                group.members.some((m) => m.childId === a.childId)
              );
              const present = groupAttendance.filter(
                (a) => a.checkedInAt && !a.checkedOutAt
              ).length;

              return (
                <div
                  key={group.id}
                  className="p-4 border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{group.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {group.session?.name}
                      </p>
                    </div>
                    <Badge variant={group.type === "cabin" ? "default" : "secondary"}>
                      {group.type}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-bold text-green-600">{present}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        / {group.members.length} present
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{
                          width: `${group.members.length > 0 ? (present / group.members.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Today's Activity */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Today&apos;s Activity Log</h2>

        {todayAttendance.length === 0 ? (
          <div className="text-center p-12 border rounded-xl bg-muted/30">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              No check-ins recorded today
            </p>
          </div>
        ) : (
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Child
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Session
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Check In
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Check Out
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {todayAttendance.map((record) => (
                  <tr key={record.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">
                          {record.child.firstName} {record.child.lastName}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {record.session?.name}
                    </td>
                    <td className="px-4 py-3">
                      {record.checkedInAt ? (
                        <div className="text-sm">
                          <p className="font-medium text-green-600">
                            {new Date(record.checkedInAt).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "numeric",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                          {record.checkedInByUser && (
                            <p className="text-xs text-muted-foreground">
                              by {record.checkedInByUser.name}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {record.checkedOutAt ? (
                        <div className="text-sm">
                          <p className="font-medium text-blue-600">
                            {new Date(record.checkedOutAt).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "numeric",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                          {record.checkedOutByUser && (
                            <p className="text-xs text-muted-foreground">
                              by {record.checkedOutByUser.name}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {record.checkedOutAt ? (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Left
                        </Badge>
                      ) : record.checkedInAt ? (
                        <Badge className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Present
                        </Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
