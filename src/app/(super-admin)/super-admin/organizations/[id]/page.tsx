import { notFound } from "next/navigation";
import { getOrganizationDetailsAction } from "@/app/actions/super-admin-actions";
import { OrganizationDetails } from "@/components/super-admin/organization-details";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Organization Details - Camp OS Admin",
  description: "View organization details",
};

interface OrganizationPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrganizationPage({
  params,
}: OrganizationPageProps) {
  const { id } = await params;

  try {
    const data = await getOrganizationDetailsAction(id);
    return <OrganizationDetails data={data} />;
  } catch {
    notFound();
  }
}
