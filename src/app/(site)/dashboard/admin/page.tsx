import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { sessions, registrations } from "@/lib/schema";
import { sql, desc, eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Calendar,
  DollarSign,
  Shield,
  Activity,
  AlertCircle,
  FileText,
  UserCircle,
} from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Efficient aggregated stats query - single query for all counts
  const [stats] = await db
    .select({
      totalSessions: sql<number>`COUNT(DISTINCT ${sessions.id})`.mapWith(Number),
      confirmedRegistrations: sql<number>`COUNT(CASE WHEN ${registrations.status} = 'confirmed' THEN 1 END)`.mapWith(Number),
      pendingRegistrations: sql<number>`COUNT(CASE WHEN ${registrations.status} = 'pending' THEN 1 END)`.mapWith(Number),
      totalRevenue: sql<number>`COALESCE(SUM(${registrations.amountPaid}::numeric), 0)`.mapWith(Number),
    })
    .from(sessions)
    .leftJoin(registrations, eq(sessions.id, registrations.sessionId));

  // Recent 5 sessions with registration counts only
  const recentSessions = await db.query.sessions.findMany({
    with: {
      registrations: {
        columns: { status: true },
      },
    },
    orderBy: [desc(sessions.createdAt)],
    limit: 5,
  });

  // Recent 10 registrations with minimal data
  const recentRegistrations = await db.query.registrations.findMany({
    with: {
      child: {
        columns: { firstName: true, lastName: true },
      },
      session: {
        columns: { name: true, startDate: true, price: true },
      },
      user: {
        columns: { id: true, name: true, email: true },
      },
    },
    orderBy: [desc(registrations.createdAt)],
    limit: 10,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground text-lg">
              Welcome, {session.user.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline">
              <Link href="/dashboard/admin/accounts">
                <UserCircle className="h-4 w-4 mr-2" />
                Accounts
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/admin/programs">
                <Calendar className="h-4 w-4 mr-2" />
                Sessions
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/admin/attendance">
                <Users className="h-4 w-4 mr-2" />
                Attendance
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/admin/incidents">
                <AlertCircle className="h-4 w-4 mr-2" />
                Incidents
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/admin/forms">
                <FileText className="h-4 w-4 mr-2" />
                Form Builder
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-500/10">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalSessions}</p>
              <p className="text-sm text-muted-foreground">Total Sessions</p>
            </div>
          </div>
        </div>

        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/10">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.confirmedRegistrations}</p>
              <p className="text-sm text-muted-foreground">
                Confirmed Registrations
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-orange-500/10">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pendingRegistrations}</p>
              <p className="text-sm text-muted-foreground">Pending Payments</p>
            </div>
          </div>
        </div>

        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(0)}</p>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Sessions</h2>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/admin/programs">View All</Link>
          </Button>
        </div>

        {recentSessions.length === 0 ? (
          <div className="text-center p-12 border rounded-xl bg-muted/30">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No sessions created yet</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/admin/programs">Create Your First Session</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentSessions.map((campSession) => {
              const confirmedCount = campSession.registrations.filter(
                (r) => r.status === "confirmed"
              ).length;
              const fillRate = (confirmedCount / campSession.capacity) * 100;

              return (
                <Link
                  key={campSession.id}
                  href={`/dashboard/admin/programs/${campSession.id}`}
                  className="block"
                >
                  <div className="p-4 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold text-lg">{campSession.name}</p>
                        <Badge variant="outline" className="capitalize">
                          {campSession.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          {new Date(campSession.startDate).toLocaleDateString()} -{" "}
                          {new Date(campSession.endDate).toLocaleDateString()}
                        </span>
                        <span>${campSession.price}</span>
                        <span>
                          {confirmedCount} / {campSession.capacity} registered
                        </span>
                        <span>{fillRate.toFixed(0)}% full</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">
                        {campSession.registrations.length} total
                      </span>
                    </div>
                  </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Registrations */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Recent Registrations</h2>

        {recentRegistrations.length === 0 ? (
          <div className="text-center p-12 border rounded-xl bg-muted/30">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No registrations yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentRegistrations.map((registration) => (
              <Link
                key={registration.id}
                href={`/dashboard/admin/accounts/${registration.user.id}`}
                className="block"
              >
                <div className="p-4 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">
                          {registration.child.firstName}{" "}
                          {registration.child.lastName}
                        </p>
                        {registration.status === "confirmed" ? (
                          <Badge className="bg-green-500">Confirmed</Badge>
                        ) : (
                          <Badge variant="outline">{registration.status}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {registration.session.name} •{" "}
                        {new Date(registration.session.startDate).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Parent: {registration.user.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        ${registration.session.price}
                      </p>
                      {registration.amountPaid && (
                        <p className="text-sm text-green-600">Paid</p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
