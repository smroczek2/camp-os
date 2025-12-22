import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Simplified middleware for single-tenant Camp OS
 *
 * Only handles basic routing - authentication is checked in individual pages/actions
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

/**
 * Check if a route is public and doesn't require authentication
 */
function isPublicRoute(pathname: string): boolean {
  const publicPaths = [
    "/",
    "/login",
    "/signup",
    "/verify-email",
    "/forgot-password",
    "/reset-password",
    "/unauthorized",
    "/404",
    "/error",
    "/_next", // Next.js internals
    "/api/auth", // Better Auth endpoints
    "/favicon.ico",
  ];

  return publicPaths.some((path) => pathname.startsWith(path));
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
