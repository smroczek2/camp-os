import { ReactNode } from "react";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import type { DashboardRole } from "@/components/dashboard/dashboard-nav";

type DashboardShellProps = {
  role?: DashboardRole;
  breadcrumbs?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
};

/**
 * Shared shell for all dashboard roles.
 * Provides consistent top bar, left rail (desktop), optional breadcrumbs/actions row, and mobile bottom nav.
 * Layout: Top bar spans full width, left sidebar + content area below it.
 */
export function DashboardShell({
  role,
  breadcrumbs,
  actions,
  children,
}: DashboardShellProps) {
  const hasMetaRow = breadcrumbs || actions;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar - full width across entire viewport */}
      <DashboardTopbar role={role} />

      {/* Main layout - sidebar + content */}
      <div className="flex-1 flex">
        {/* Left sidebar - fixed width on desktop, hidden on mobile */}
        <aside className="hidden md:block w-64 border-r bg-card flex-shrink-0">
          <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            <DashboardSidebar role={role} />
          </div>
        </aside>

        {/* Content area */}
        <main className="flex-1 min-w-0">
          <div className="container mx-auto px-4 md:px-8 py-6 md:py-8 pb-20 md:pb-8">
            {/* Breadcrumbs and page actions */}
            {hasMetaRow && (
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
                {breadcrumbs ? <div className="min-w-0">{breadcrumbs}</div> : <div />}
                {actions ? <div className="flex-shrink-0">{actions}</div> : null}
              </div>
            )}

            {/* Page content */}
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileBottomNav role={role} />
    </div>
  );
}
