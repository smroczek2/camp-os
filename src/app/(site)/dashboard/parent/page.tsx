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
  waitlist,
} from "@/lib/schema";
import { Users, Calendar, FileText } from "lucide-react";
import { Suspense } from "react";
import { AddChildDialog } from "@/components/parent/add-child-dialog";
import { AutoRegisterHandler } from "@/components/parent/auto-register-handler";
import { BrowseSessionsSection } from "@/components/parent/browse-sessions-section";

// New modular components
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { ActionItemsSection } from "@/components/dashboard/action-items-section";
import { MyChildrenSection } from "@/components/dashboard/my-children-section";
import { RegistrationsSection } from "@/components/dashboard/registrations-section";

export default async function ParentDashboard() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Get parent's children with medications
  const myChildren = await db.query.children.findMany({
    where: eq(children.userId, session.user.id),
    with: {
      medications: {
        orderBy: (meds, { desc }) => [desc(meds.startDate)],
      },
    },
  });

  // Get all registrations for this parent
  const myRegistrations = await db.query.registrations.findMany({
    where: eq(registrations.userId, session.user.id),
    with: {
      child: true,
      session: true,
    },
  });

  // Get available sessions for browsing (only open/draft, limited to 50)
  const allSessionsRaw = await db.query.sessions.findMany({
    where: or(eq(sessions.status, "open"), eq(sessions.status, "draft")),
    with: {
      registrations: {
        columns: { status: true },
        where: (reg, { eq }) => eq(reg.status, "confirmed"),
      },
    },
    limit: 50,
  });

  // Pre-compute confirmed counts
  const allSessions = allSessionsRaw.map((s) => ({
    ...s,
    confirmedCount: s.registrations.length,
  }));

  // Get session IDs for registered sessions
  const registeredSessionIds = myRegistrations.map((r) => r.sessionId);

  // Get user's waitlist entries
  const myWaitlistEntries = await db.query.waitlist.findMany({
    where: eq(waitlist.userId, session.user.id),
    with: {
      child: true,
      session: true,
    },
  });

  // Get total waitlist counts per session for context
  const waitlistCounts = new Map<string, number>();
  for (const entry of myWaitlistEntries) {
    if (!waitlistCounts.has(entry.sessionId)) {
      const total = await db.query.waitlist.findMany({
        where: eq(waitlist.sessionId, entry.sessionId),
        columns: { id: true },
      });
      waitlistCounts.set(entry.sessionId, total.length);
    }
  }

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

  // Get user's form submissions
  const mySubmissions = await db.query.formSubmissions.findMany({
    where: eq(formSubmissions.userId, session.user.id),
    columns: { formDefinitionId: true },
  });

  // Pre-compute stats
  const childrenCount = myChildren.length;
  const activeRegistrationsCount = myRegistrations.filter(
    (r) => r.status === "confirmed"
  ).length;
  const pendingPaymentsCount = myRegistrations.filter(
    (r) => r.status === "pending"
  ).length;
  const waitlistCount = myWaitlistEntries.filter(
    (w) => w.status === "waiting"
  ).length;

  // Pre-compute registration counts per child
  const registrationCountByChild = new Map<string, number>();
  for (const r of myRegistrations) {
    registrationCountByChild.set(
      r.childId,
      (registrationCountByChild.get(r.childId) ?? 0) + 1
    );
  }

  // Pre-compute completed form IDs
  const completedFormIds = mySubmissions.map((s) => s.formDefinitionId);

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
      <div className="mb-8">
        <DashboardStats
          childrenCount={childrenCount}
          activeRegistrationsCount={activeRegistrationsCount}
          pendingPaymentsCount={pendingPaymentsCount}
          waitlistCount={waitlistCount}
        />
      </div>

      {/* Forms to Complete */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Forms to Complete
          </h2>
        </div>
        <ActionItemsSection
          availableForms={availableForms}
          completedFormIds={completedFormIds}
        />
      </div>

      {/* My Children */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            My Children
          </h2>
          <AddChildDialog />
        </div>
        <MyChildrenSection
          childrenList={myChildren}
          registrationCounts={registrationCountByChild}
        />
      </div>

      {/* Active Registrations */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Registrations
          </h2>
        </div>
        <RegistrationsSection registrations={myRegistrations} />
      </div>

      {/* Browse Available Sessions */}
      <div id="browse-sessions" className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Browse Camp Sessions
          </h2>
        </div>
        <BrowseSessionsSection
          sessions={allSessions}
          childrenList={myChildren}
        />
      </div>
    </div>
  );
}
