import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { organizations, organizationUsers } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

/**
 * Multi-tenant middleware
 *
 * Extracts organization context from URL path and injects it into request headers.
 * Uses path-based routing: /org/{slug}/dashboard
 *
 * Flow:
 * 1. Extract org slug from path (e.g., /org/pine-ridge/dashboard → "pine-ridge")
 * 2. Look up organization by slug
 * 3. Verify user has access to organization (if authenticated)
 * 4. Inject x-organization-id header for downstream use
 *
 * Bug #2 Fix: Preview mode read-only enforcement
 * When a super admin is in preview mode (preview_org_id cookie set),
 * non-GET requests are blocked to enforce read-only access.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Bug #2 Fix: Enforce read-only mode for super admin preview
  const previewOrgId = request.cookies.get("preview_org_id")?.value;
  if (previewOrgId && request.method !== "GET") {
    // Block non-GET requests during preview mode
    // This prevents super admins from accidentally modifying client data
    return NextResponse.json(
      {
        error: "Preview mode is read-only",
        message: "You cannot modify data while in preview mode. Exit preview mode to make changes.",
      },
      { status: 403 }
    );
  }

  // Extract organization slug from path: /org/{slug}/...
  const orgMatch = pathname.match(/^\/org\/([^\/]+)/);

  if (!orgMatch) {
    // No organization in path - redirect to organization selection
    // (or show error if user should have an org)
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/api")) {
      return NextResponse.redirect(new URL("/select-organization", request.url));
    }
    return NextResponse.next();
  }

  const slug = orgMatch[1];

  try {
    // Look up organization by slug
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.slug, slug),
    });

    if (!org) {
      return NextResponse.redirect(new URL("/404", request.url));
    }

    // Check if organization is active
    if (org.status === "suspended" || org.status === "inactive") {
      return NextResponse.redirect(
        new URL(`/org-suspended?org=${slug}`, request.url)
      );
    }

    // For authenticated routes, verify user has access
    // Note: This is a simplified check. In production, you'd want to:
    // 1. Get session from Better Auth
    // 2. Check if user belongs to organization via organization_users
    // 3. Handle super_admin role (can access all orgs)

    // TODO: Add authentication check here when Better Auth session is available
    // const session = await getSession();
    // if (session && session.user.role !== 'super_admin') {
    //   const hasAccess = await userBelongsToOrganization(session.user.id, org.id);
    //   if (!hasAccess) {
    //     return NextResponse.redirect(new URL('/unauthorized', request.url));
    //   }
    // }

    // Inject organization context into request headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-organization-id", org.id);
    requestHeaders.set("x-organization-slug", org.slug);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.redirect(new URL("/error", request.url));
  }
}

/**
 * Check if a route is public and doesn't require organization context
 */
function isPublicRoute(pathname: string): boolean {
  const publicPaths = [
    "/",
    "/login",
    "/signup",
    "/verify-email",
    "/forgot-password",
    "/reset-password",
    "/select-organization",
    "/org-suspended",
    "/unauthorized",
    "/404",
    "/error",
    "/_next", // Next.js internals
    "/api/auth", // Better Auth endpoints
    "/api/onboarding", // Organization signup
    "/api/diagnostics", // System health checks
    "/login", // Sign in page
    "/favicon.ico",
    "/super-admin", // Super admin portal (has own auth guard)
  ];

  return publicPaths.some((path) => pathname.startsWith(path));
}

/**
 * Helper to check if user belongs to organization
 * Called after authentication check
 */
async function userBelongsToOrganization(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const membership = await db.query.organizationUsers.findFirst({
    where: and(
      eq(organizationUsers.userId, userId),
      eq(organizationUsers.organizationId, organizationId),
      eq(organizationUsers.status, "active")
    ),
  });

  return !!membership;
}

/**
 * Configure which routes run through middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
