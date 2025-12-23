import { getSession } from "@/lib/auth-helper";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import type { DashboardRole } from "@/components/dashboard/dashboard-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const role = session?.user?.role as DashboardRole | undefined;

  return (
    <>
      <div className="container mx-auto px-4 py-6 md:py-8 pb-20 md:pb-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar - Hidden on mobile */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <div className="rounded-xl border bg-card text-card-foreground shadow-sm h-[calc(100vh-8rem)]">
                <DashboardSidebar role={role} />
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <DashboardTopbar role={role} />
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav role={role} />
    </>
  );
}
