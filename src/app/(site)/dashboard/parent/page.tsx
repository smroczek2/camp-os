import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { eq, and, inArray, or } from "drizzle-orm";
import {
  children,
  registrations,
  formDefinitions,
  formSubmissions,
  sessions,
} from "@/lib/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Calendar, AlertCircle, CheckCircle2, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { AddChildDialog } from "@/components/parent/add-child-dialog";
import { RegisterSessionDialog } from "@/components/parent/register-session-dialog";
import { AutoRegisterHandler } from "@/components/parent/auto-register-handler";
import { formatDate } from "@/lib/utils";
import { Suspense } from "react";

export default async function ParentDashboard() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Get parent's children
  const myChildren = await db.query.children.findMany({
    where: eq(children.userId, session.user.id),
  });

  // Get all registrations for this parent
  const myRegistrations = await db.query.registrations.findMany({
    where: eq(registrations.userId, session.user.id),
    with: {
      child: true,
      session: true,
    },
  });

  // Get available sessions for browsing (only open/draft, limited to 50, with registration counts only)
  const allSessions = await db.query.sessions.findMany({
    where: or(eq(sessions.status, "open"), eq(sessions.status, "draft")),
    with: {
      registrations: {
        columns: { status: true },
      },
    },
    limit: 50,
  });

  // Get session IDs for registered sessions
  const registeredSessionIds = myRegistrations.map((r) => r.sessionId);

  // Get published forms for registered sessions
  const availableForms =
    registeredSessionIds.length > 0
      ? await db.query.formDefinitions.findMany({
          where: and(
            eq(formDefinitions.isPublished, true),
            inArray(formDefinitions.sessionId, registeredSessionIds)
          ),
          with: {
            fields: { columns: { id: true } },
            session: { columns: { name: true } },
          },
        })
      : [];

  // Get user's form submissions to check what's already completed
  const mySubmissions = await db.query.formSubmissions.findMany({
    where: eq(formSubmissions.userId, session.user.id),
    columns: { formDefinitionId: true },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Auto-register handler for shareable links */}
      <Suspense fallback={null}>
        <AutoRegisterHandler sessions={allSessions} childrenList={myChildren} />
      </Suspense>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Parent Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          Welcome back, {session.user.name}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{myChildren.length}</p>
              <p className="text-sm text-muted-foreground">
                {myChildren.length === 1 ? "Child" : "Children"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/10">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {
                  myRegistrations.filter((r) => r.status === "confirmed")
                    .length
                }
              </p>
              <p className="text-sm text-muted-foreground">
                Active Registrations
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
              <p className="text-2xl font-bold">
                {myRegistrations.filter((r) => r.status === "pending").length}
              </p>
              <p className="text-sm text-muted-foreground">
                Pending Payments
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Forms to Complete */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Forms to Complete
          </h2>
        </div>

        {availableForms.length > 0 ? (
          <div className="space-y-4">
            {availableForms.map((form) => {
              const isCompleted = mySubmissions.some(
                (s) => s.formDefinitionId === form.id
              );

              return (
                <div
                  key={form.id}
                  className="p-6 border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{form.name}</h3>
                        {isCompleted ? (
                          <Badge className="bg-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-600">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Action Required
                          </Badge>
                        )}
                      </div>
                      {form.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {form.description}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {form.fields?.length || 0} fields •{" "}
                        {form.session?.name ?? "General"}
                      </p>
                    </div>
                    <div>
                      {!isCompleted && (
                        <Link href={`/dashboard/parent/forms/${form.id}`}>
                          <Button>
                            Complete Form
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      )}
                      {isCompleted && (
                        <Link href={`/dashboard/parent/forms/${form.id}`}>
                          <Button variant="outline">
                            View Submission
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center p-12 border rounded-xl bg-muted/30">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">
              No forms available at this time
            </p>
            <p className="text-sm text-muted-foreground">
              Forms will appear here once you register for a camp session.
            </p>
          </div>
        )}
      </div>

      {/* My Children */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">My Children</h2>
          <AddChildDialog />
        </div>

        {myChildren.length === 0 ? (
          <div className="text-center p-12 border rounded-xl bg-muted/30">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No children added yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myChildren.map((child) => {
              const childRegistrations = myRegistrations.filter(
                (r) => r.childId === child.id
              );
              return (
                <div
                  key={child.id}
                  className="p-6 border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {child.firstName} {child.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Born {formatDate(child.dateOfBirth)}
                      </p>
                    </div>
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/10">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>

                  {child.allergies && child.allergies.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        Allergies
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {child.allergies.map((allergy, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {allergy}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      {childRegistrations.length} registration
                      {childRegistrations.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Registrations */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Registrations</h2>

        {myRegistrations.length === 0 ? (
          <div className="text-center p-12 border rounded-xl bg-muted/30">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              No camp registrations yet
            </p>
            <Link href="#browse-sessions">
              <Button>
                Browse Available Sessions
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {myRegistrations.map((registration) => (
              <div
                key={registration.id}
                className="p-6 border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        {registration.session.name}
                      </h3>
                      {registration.status === "confirmed" ? (
                        <Badge className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Confirmed
                        </Badge>
                      ) : registration.status === "pending" ? (
                        <Badge variant="outline" className="text-orange-600">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Pending Payment
                        </Badge>
                      ) : (
                        <Badge variant="outline">{registration.status}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {registration.child.firstName} {registration.child.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(registration.session.startDate)} -{" "}
                      {formatDate(registration.session.endDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">${registration.session.price}</p>
                    {registration.amountPaid ? (
                      <p className="text-sm text-green-600">Paid</p>
                    ) : registration.status === "pending" ? (
                      <Link href={`/checkout/${registration.id}`}>
                        <Button size="sm" className="mt-2">
                          Pay Now
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                </div>

                {registration.session.description && (
                  <p className="text-sm text-muted-foreground">
                    {registration.session.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Browse Available Sessions */}
      <div id="browse-sessions" className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Browse Camp Sessions</h2>
        </div>

        {allSessions.length === 0 ? (
          <div className="text-center p-12 border rounded-xl bg-muted/30">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No sessions available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allSessions.map((campSession) => {
              const spotsLeft =
                campSession.capacity -
                campSession.registrations.filter((r) => r.status === "confirmed")
                  .length;
              const isOpen = campSession.status === "open";

              return (
                <div
                  key={campSession.id}
                  className="p-6 border rounded-xl bg-card shadow-sm hover:shadow-lg transition-all hover:-translate-y-1"
                >
                  <div className="mb-4">
                    <h3 className="font-semibold text-xl mb-2">
                      {campSession.name}
                    </h3>
                    {campSession.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {campSession.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Dates</span>
                      <span className="font-medium">
                        {formatDate(campSession.startDate)} -{" "}
                        {formatDate(campSession.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-bold text-lg">${campSession.price}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Spots Left</span>
                      <span
                        className={`font-medium ${
                          spotsLeft < 5 ? "text-orange-600" : "text-green-600"
                        }`}
                      >
                        {spotsLeft} / {campSession.capacity}
                      </span>
                    </div>
                  </div>

                  {isOpen && spotsLeft > 0 ? (
                    <div className="mt-4">
                      <RegisterSessionDialog
                        session={campSession}
                        childrenList={myChildren}
                        disabled={myChildren.length === 0}
                      />
                    </div>
                  ) : !isOpen ? (
                    <Badge variant="outline" className="w-full justify-center mt-4">
                      {campSession.status}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="w-full justify-center text-red-600 mt-4"
                    >
                      Full
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
