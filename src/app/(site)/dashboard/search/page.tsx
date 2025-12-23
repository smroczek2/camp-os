import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import {
  user,
  sessions,
  formDefinitions,
  incidents,
  registrations,
  children,
  assignments,
  groupMembers,
  medications,
} from "@/lib/schema";
import { and, desc, eq, ilike, or, inArray } from "drizzle-orm";
import Link from "next/link";
import { Breadcrumb } from "@/components/dashboard/breadcrumb";
import { Badge } from "@/components/ui/badge";

type SearchParams = {
  q?: string;
};

type SearchResult = {
  title: string;
  description?: string;
  href: string;
  meta?: string;
};

function Section({
  title,
  results,
}: {
  title: string;
  results: SearchResult[];
}) {
  if (results.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="space-y-2">
        {results.map((result) => (
          <Link key={result.href} href={result.href} className="block">
            <div className="p-4 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{result.title}</p>
                  {result.description && (
                    <p className="text-sm text-muted-foreground">
                      {result.description}
                    </p>
                  )}
                </div>
                {result.meta && (
                  <Badge variant="outline" className="shrink-0">
                    {result.meta}
                  </Badge>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default async function DashboardSearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;
  const query = (params.q || "").trim();
  const queryLower = query.toLowerCase();

  if (!query) {
    return (
      <div>
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Search" },
          ]}
        />
        <div className="text-center p-12 border rounded-xl bg-muted/30">
          <p className="text-muted-foreground">Enter a search term to begin.</p>
        </div>
      </div>
    );
  }

  const role = session.user.role;

  const results: Array<{ title: string; items: SearchResult[] }> = [];

  if (role === "admin") {
    const accounts = await db.query.user.findMany({
      where: or(
        ilike(user.name, `%${query}%`),
        ilike(user.email, `%${query}%`),
        ilike(user.accountNumber, `%${query}%`)
      ),
      orderBy: [desc(user.createdAt)],
      limit: 10,
    });

    const sessionsResults = await db.query.sessions.findMany({
      where: or(
        ilike(sessions.name, `%${query}%`),
        ilike(sessions.description, `%${query}%`)
      ),
      orderBy: [desc(sessions.startDate)],
      limit: 10,
    });

    const forms = await db.query.formDefinitions.findMany({
      where: or(
        ilike(formDefinitions.name, `%${query}%`),
        ilike(formDefinitions.description, `%${query}%`)
      ),
      orderBy: [desc(formDefinitions.createdAt)],
      limit: 10,
    });

    const incidentResults = await db.query.incidents.findMany({
      where: ilike(incidents.description, `%${query}%`),
      orderBy: [desc(incidents.occurredAt)],
      limit: 10,
      with: {
        child: true,
      },
    });

    results.push({
      title: "Accounts",
      items: accounts.map((account) => ({
        title: account.name || account.email,
        description: account.email,
        href: `/dashboard/admin/accounts/${account.id}`,
        meta: "Account",
      })),
    });

    results.push({
      title: "Sessions",
      items: sessionsResults.map((sessionItem) => ({
        title: sessionItem.name,
        description: sessionItem.description || "",
        href: `/dashboard/admin/programs/${sessionItem.id}`,
        meta: sessionItem.status,
      })),
    });

    results.push({
      title: "Forms",
      items: forms.map((form) => ({
        title: form.name,
        description: form.description || "",
        href: `/dashboard/admin/forms/${form.id}`,
        meta: form.isPublished ? "Published" : "Draft",
      })),
    });

    results.push({
      title: "Incidents",
      items: incidentResults.map((incident) => ({
        title: `${incident.child.firstName} ${incident.child.lastName}`,
        description: incident.description,
        href: `/dashboard/admin/incidents/${incident.id}`,
        meta: incident.severity,
      })),
    });
  }

  if (role === "parent") {
    const myChildren = await db.query.children.findMany({
      where: and(
        eq(children.userId, session.user.id),
        or(
          ilike(children.firstName, `%${query}%`),
          ilike(children.lastName, `%${query}%`)
        )
      ),
      limit: 10,
    });

    const sessionsResults = await db.query.sessions.findMany({
      where: and(
        or(eq(sessions.status, "open"), eq(sessions.status, "draft")),
        or(
          ilike(sessions.name, `%${query}%`),
          ilike(sessions.description, `%${query}%`)
        )
      ),
      orderBy: [desc(sessions.startDate)],
      limit: 10,
    });

    const myRegistrations = await db.query.registrations.findMany({
      where: eq(registrations.userId, session.user.id),
      with: {
        child: true,
        session: true,
      },
    });

    const registrationMatches = myRegistrations.filter((registration) => {
      const childName = `${registration.child.firstName} ${registration.child.lastName}`.toLowerCase();
      return (
        childName.includes(queryLower) ||
        registration.session.name.toLowerCase().includes(queryLower)
      );
    });

    results.push({
      title: "Children",
      items: myChildren.map((child) => ({
        title: `${child.firstName} ${child.lastName}`,
        description: "View child profile",
        href: "/dashboard/parent/children",
        meta: "Child",
      })),
    });

    results.push({
      title: "Sessions",
      items: sessionsResults.map((sessionItem) => ({
        title: sessionItem.name,
        description: sessionItem.description || "",
        href: `/sessions/${sessionItem.id}`,
        meta: sessionItem.status,
      })),
    });

    results.push({
      title: "Registrations",
      items: registrationMatches.slice(0, 10).map((registration) => ({
        title: registration.session.name,
        description: `${registration.child.firstName} ${registration.child.lastName}`,
        href: "/dashboard/parent/registrations",
        meta: registration.status,
      })),
    });
  }

  if (role === "staff") {
    const myAssignments = await db.query.assignments.findMany({
      where: eq(assignments.staffId, session.user.id),
      with: {
        group: true,
        session: true,
      },
    });

    const groupMatches = myAssignments.filter((assignment) => {
      return (
        assignment.group.name.toLowerCase().includes(queryLower) ||
        assignment.session.name.toLowerCase().includes(queryLower)
      );
    });

    const groupIds = myAssignments.map((assignment) => assignment.groupId);

    const memberMatches =
      groupIds.length > 0
        ? await db.query.groupMembers.findMany({
            where: inArray(groupMembers.groupId, groupIds),
            with: {
              child: true,
            },
          })
        : [];

    const childMatches = memberMatches.filter((member) => {
      const fullName = `${member.child.firstName} ${member.child.lastName}`.toLowerCase();
      return fullName.includes(queryLower);
    });

    results.push({
      title: "Groups",
      items: groupMatches.map((assignment) => ({
        title: assignment.group.name,
        description: assignment.session.name,
        href: `/dashboard/staff/groups/${assignment.group.id}`,
        meta: assignment.group.type,
      })),
    });

    results.push({
      title: "Children",
      items: childMatches.slice(0, 10).map((member) => ({
        title: `${member.child.firstName} ${member.child.lastName}`,
        description: "Assigned group member",
        href: `/dashboard/staff/groups/${member.groupId}`,
        meta: "Child",
      })),
    });
  }

  if (role === "nurse") {
    const childResults = await db.query.children.findMany({
      where: or(
        ilike(children.firstName, `%${query}%`),
        ilike(children.lastName, `%${query}%`)
      ),
      limit: 10,
    });

    const medicationResults = await db.query.medications.findMany({
      where: ilike(medications.name, `%${query}%`),
      limit: 10,
      with: {
        child: true,
      },
    });

    const incidentResults = await db.query.incidents.findMany({
      where: ilike(incidents.description, `%${query}%`),
      limit: 10,
      orderBy: [desc(incidents.occurredAt)],
      with: {
        child: true,
      },
    });

    results.push({
      title: "Children",
      items: childResults.map((child) => ({
        title: `${child.firstName} ${child.lastName}`,
        description: "Medical profile",
        href: "/dashboard/nurse",
        meta: "Child",
      })),
    });

    results.push({
      title: "Medications",
      items: medicationResults.map((med) => ({
        title: med.name,
        description: `${med.child.firstName} ${med.child.lastName}`,
        href: `/dashboard/nurse/medications/${med.id}`,
        meta: "Medication",
      })),
    });

    results.push({
      title: "Incidents",
      items: incidentResults.map((incident) => ({
        title: `${incident.child.firstName} ${incident.child.lastName}`,
        description: incident.description,
        href: `/dashboard/nurse/incidents/${incident.id}`,
        meta: incident.severity,
      })),
    });
  }

  const nonEmptyResults = results.filter((section) => section.items.length > 0);

  return (
    <div className="space-y-8">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Search" },
        ]}
      />
      <div>
        <h1 className="text-3xl font-bold mb-2">Search Results</h1>
        <p className="text-muted-foreground">
          Showing results for &quot;{query}&quot;.
        </p>
      </div>

      {nonEmptyResults.length === 0 ? (
        <div className="text-center p-12 border rounded-xl bg-muted/30">
          <p className="text-muted-foreground">No results found.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {nonEmptyResults.map((section) => (
            <Section
              key={section.title}
              title={section.title}
              results={section.items}
            />
          ))}
        </div>
      )}
    </div>
  );
}
