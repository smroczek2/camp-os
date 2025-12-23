import { getSession } from "@/lib/auth-helper";
import type { DashboardRole } from "@/components/dashboard/dashboard-nav";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const role = session?.user?.role as DashboardRole | undefined;

  return (
    <DashboardShell role={role}>
      {children}
    </DashboardShell>
  );
}
