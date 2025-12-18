import { Suspense } from "react";
import { getOrganizationsAction } from "@/app/actions/super-admin-actions";
import { OrganizationsTable } from "@/components/super-admin/organizations-table";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Organizations - Camp OS Admin",
  description: "Manage all Camp OS organizations",
};

async function OrganizationsList() {
  const organizations = await getOrganizationsAction();

  return <OrganizationsTable organizations={organizations} />;
}

export default function OrganizationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
        <p className="text-muted-foreground">
          Manage and monitor all camp organizations
        </p>
      </div>

      <Suspense fallback={<div>Loading organizations...</div>}>
        <OrganizationsList />
      </Suspense>
    </div>
  );
}
