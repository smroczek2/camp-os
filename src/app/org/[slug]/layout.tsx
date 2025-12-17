import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { organizations } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { ThemeProvider } from "@/components/theme-provider";
import { OrgHeader } from "@/components/org/org-header";
import { getSession } from "@/lib/auth-helper";

interface OrgLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

/**
 * Organization-scoped layout
 * Provides organization context to all nested pages
 */
export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { slug } = await params;
  const session = await getSession();

  // Get organization by slug
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
  });

  if (!org) {
    notFound();
  }

  // Check if organization is suspended
  if (org.status === "suspended") {
    return (
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Organization Suspended
            </h1>
            <p className="text-muted-foreground">
              This organization has been suspended. Please contact support.
            </p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="min-h-screen flex flex-col bg-background">
        <OrgHeader organization={org} user={session?.user || null} />
        <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
      </div>
    </ThemeProvider>
  );
}
