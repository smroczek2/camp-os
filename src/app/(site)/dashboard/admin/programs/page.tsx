import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { sessions } from "@/lib/schema";
import { desc } from "drizzle-orm";
import {
  Calendar,
  Users,
  ChevronRight,
  DollarSign,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { CreateSessionDialog } from "@/components/admin/create-session-dialog";
import { SessionStatusBadge } from "@/components/admin/session-status-badge";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/dashboard/breadcrumb";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function SessionsManagementPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const allSessions = await db.query.sessions.findMany({
    with: {
      registrations: true,
    },
    orderBy: [desc(sessions.startDate)],
  });

  const totalRegistrations = allSessions.reduce(
    (sum, s) => sum + s.registrations.filter((r) => r.status === "confirmed").length,
    0
  );

  const openSessions = allSessions.filter((s) => s.status === "open").length;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard/admin" },
          { label: "Sessions" },
        ]}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Sessions</h1>
            <p className="text-muted-foreground text-lg">
              Create and manage your camp sessions
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/admin/programs/ai-setup">
              <Button variant="outline">
                <Sparkles className="h-4 w-4 mr-2" />
                AI Setup
              </Button>
            </Link>
            <CreateSessionDialog />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{allSessions.length}</p>
              <p className="text-sm text-muted-foreground">Total Sessions</p>
            </div>
          </div>
        </div>

        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/10">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{openSessions}</p>
              <p className="text-sm text-muted-foreground">Open for Registration</p>
            </div>
          </div>
        </div>

        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-500/10">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalRegistrations}</p>
              <p className="text-sm text-muted-foreground">Total Registrations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      {allSessions.length === 0 ? (
        <div className="text-center p-16 border rounded-xl bg-muted/30">
          <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No sessions yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first session to start accepting registrations
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/dashboard/admin/programs/ai-setup">
              <Button variant="outline">
                <Sparkles className="h-4 w-4 mr-2" />
                AI Setup
              </Button>
            </Link>
            <CreateSessionDialog />
          </div>
        </div>
      ) : (
        <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
          <div className="p-6 border-b bg-muted/30">
            <h2 className="text-xl font-semibold">All Sessions</h2>
          </div>
          <div className="divide-y">
            {allSessions.map((campSession) => {
              const confirmedCount = campSession.registrations.filter(
                (r) => r.status === "confirmed"
              ).length;
              const fillRate = (confirmedCount / campSession.capacity) * 100;
              const isNearlyFull = fillRate >= 90;

              return (
                <Link
                  key={campSession.id}
                  href={`/dashboard/admin/programs/${campSession.id}`}
                  className={`block p-4 hover:bg-muted/30 transition-colors cursor-pointer ${
                    isNearlyFull ? "bg-orange-50 dark:bg-orange-950/20" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-lg">
                          {campSession.name}
                        </span>
                        <SessionStatusBadge
                          sessionId={campSession.id}
                          status={campSession.status}
                        />
                        {isNearlyFull && (
                          <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800">
                            90% Full
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(campSession.startDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          -{" "}
                          {new Date(campSession.endDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />${campSession.price}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {confirmedCount} / {campSession.capacity}
                        </span>
                        <span className={isNearlyFull ? "font-medium text-orange-600 dark:text-orange-400" : ""}>{fillRate.toFixed(0)}% full</span>
                      </div>
                      {campSession.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                          {campSession.description}
                        </p>
                      )}
                    </div>

                    {/* Progress Bar and Chevron */}
                    <div className="flex items-center gap-4 ml-4">
                      <div className="w-32">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              fillRate >= 90
                                ? "bg-orange-500"
                                : fillRate >= 70
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            }`}
                            style={{ width: `${Math.min(fillRate, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-center mt-1 text-muted-foreground">
                          {fillRate.toFixed(0)}%
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
