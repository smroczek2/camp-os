"use client";

import { usePathname } from "next/navigation";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

/**
 * Site layout with header and footer
 * Used for main site pages (home, dashboard, profile, etc.)
 * Dashboard routes use their own DashboardShell layout, so header/footer are hidden
 */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {isDashboard ? (
        // Dashboard has its own shell with header/footer
        children
      ) : (
        // Regular site pages get header and footer
        <div className="min-h-screen flex flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      )}
    </ThemeProvider>
  );
}
