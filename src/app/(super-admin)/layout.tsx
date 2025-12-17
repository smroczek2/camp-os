import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helper";
import { ThemeProvider } from "@/components/theme-provider";
import { SuperAdminHeader } from "@/components/super-admin/super-admin-header";
import { PreviewModeBanner } from "@/components/super-admin/preview-mode-banner";

/**
 * Super Admin Layout
 *
 * Protects all super-admin routes with role-based access control.
 * Only users with role="super_admin" can access these pages.
 *
 * Implements Bug #2 fix: Preview mode read-only enforcement is handled
 * in middleware.ts - this layout just shows the banner.
 */
export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // Redirect if not authenticated
  if (!session?.user) {
    redirect("/login");
  }

  // Redirect if not a super admin
  if (session.user.role !== "super_admin") {
    redirect("/unauthorized");
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="min-h-screen bg-background">
        <SuperAdminHeader user={session.user} />
        <PreviewModeBanner />
        <main className="container mx-auto px-4 py-8">{children}</main>
      </div>
    </ThemeProvider>
  );
}
