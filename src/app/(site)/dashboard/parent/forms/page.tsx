import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import {
  formDefinitions,
  formSubmissions,
  registrations,
} from "@/lib/schema";
import { and, eq, inArray } from "drizzle-orm";
import { FileText } from "lucide-react";
import { ActionItemsSection } from "@/components/dashboard/action-items-section";
import { Breadcrumb } from "@/components/dashboard/breadcrumb";

export default async function ParentFormsPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const myRegistrations = await db.query.registrations.findMany({
    where: eq(registrations.userId, session.user.id),
    columns: { sessionId: true },
  });

  const registeredSessionIds = myRegistrations.map((r) => r.sessionId);

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

  const mySubmissions = await db.query.formSubmissions.findMany({
    where: eq(formSubmissions.userId, session.user.id),
    columns: { formDefinitionId: true },
  });

  const completedFormIds = mySubmissions.map((s) => s.formDefinitionId);

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard/parent" },
          { label: "Forms" },
        ]}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Forms</h1>
        <p className="text-muted-foreground">
          Complete required forms for your registered sessions.
        </p>
      </div>

      {availableForms.length === 0 ? (
        <div className="text-center p-12 border rounded-xl bg-muted/30">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            No forms available for your registrations
          </p>
        </div>
      ) : (
        <ActionItemsSection
          availableForms={availableForms}
          completedFormIds={completedFormIds}
        />
      )}
    </div>
  );
}
