import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";

export default function ParentDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <div className="container mx-auto px-4 py-6 md:py-8 pb-20 md:pb-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar - Hidden on mobile */}
                    <aside className="hidden md:block w-64 flex-shrink-0">
                        <div className="sticky top-24">
                            <div className="rounded-xl border bg-card text-card-foreground shadow-sm h-[calc(100vh-8rem)]">
                                <DashboardSidebar />
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        {children}
                    </main>
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav />
        </>
    );
}
