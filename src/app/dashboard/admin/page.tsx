import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helper";
import { withOrganizationContext } from "@/lib/db/tenant-context";
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
} from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/dev-login");
  }

  if (!session.user.activeOrganizationId) {
    redirect("/dev-login");
  }

  const { allCamps, allRegistrations } = await withOrganizationContext(
    session.user.activeOrganizationId,
    async (tx) => {
      // Get all camps and sessions
      const allCamps = await tx.query.camps.findMany({
        with: {
          sessions: {
            with: {
              registrations: {
                with: {
                  child: true,
                  user: true,
                },
              },
            },
          },
        },
      });

      // Get all registrations
      const allRegistrations = await tx.query.registrations.findMany({
        with: {
          child: true,
          session: {
            with: {
              camp: true,
            },
          },
        },
      });

      return { allCamps, allRegistrations };
    }
  );

  // Calculate stats
  const totalRevenue = allRegistrations
    .filter((r) => r.amountPaid)
    .reduce((sum, r) => sum + parseFloat(r.amountPaid || "0"), 0);

  const confirmedRegistrations = allRegistrations.filter(
    (r) => r.status === "confirmed"
  ).length;

  const pendingRegistrations = allRegistrations.filter(
    (r) => r.status === "pending"
  ).length;

  const totalSessions = allCamps.reduce(
    (sum, camp) => sum + camp.sessions.length,
    0
  );

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
          <Link href="/dashboard/admin/forms">
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Form Builder
            </Button>
          </Link>
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
              <p className="text-2xl font-bold">{totalSessions}</p>
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
              <p className="text-2xl font-bold">{confirmedRegistrations}</p>
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
              <p className="text-2xl font-bold">{pendingRegistrations}</p>
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
              <p className="text-2xl font-bold">${totalRevenue.toFixed(0)}</p>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Camps & Sessions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Camps & Sessions</h2>
          {/* TODO: Add "Create Camp" button */}
        </div>

        {allCamps.length === 0 ? (
          <div className="text-center p-12 border rounded-xl bg-muted/30">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No camps created yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {allCamps.map((camp) => (
              <div
                key={camp.id}
                className="p-6 border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-xl mb-2">{camp.name}</h3>
                    {camp.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {camp.description}
                      </p>
                    )}
                    {camp.location && (
                      <p className="text-sm text-muted-foreground">
                        📍 {camp.location}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {camp.sessions.length} sessions
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Capacity: {camp.capacity}
                    </p>
                  </div>
                </div>

                {/* Sessions */}
                {camp.sessions.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="font-medium mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Sessions
                    </p>
                    <div className="space-y-3">
                      {camp.sessions.map((session) => {
                        const sessionRegistrations = session.registrations.length;
                        const confirmedCount = session.registrations.filter(
                          (r) => r.status === "confirmed"
                        ).length;
                        const fillRate =
                          (confirmedCount / session.capacity) * 100;

                        return (
                          <div
                            key={session.id}
                            className="p-4 border rounded-lg bg-muted/30"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <p className="font-medium">
                                    {new Date(
                                      session.startDate
                                    ).toLocaleDateString()}{" "}
                                    -{" "}
                                    {new Date(
                                      session.endDate
                                    ).toLocaleDateString()}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className="capitalize"
                                  >
                                    {session.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span>${session.price}</span>
                                  <span>
                                    {confirmedCount} / {session.capacity}{" "}
                                    registered
                                  </span>
                                  <span>{fillRate.toFixed(0)}% full</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium">
                                  {sessionRegistrations} total
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Registrations */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Recent Registrations</h2>

        {allRegistrations.length === 0 ? (
          <div className="text-center p-12 border rounded-xl bg-muted/30">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No registrations yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allRegistrations.slice(0, 10).map((registration) => (
              <div
                key={registration.id}
                className="p-4 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow"
              >
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
                      {registration.session.camp.name} •{" "}
                      {new Date(
                        registration.session.startDate
                      ).toLocaleDateString()}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
