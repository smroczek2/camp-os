import { auth } from "@/lib/auth";
import { getDevUser, isDevMode } from "@/lib/dev-auth";
import { headers } from "next/headers";

/**
 * Unified authentication helper that supports both Better Auth and dev mode
 *
 * In development: checks for dev user cookie first, falls back to Better Auth
 * In production: only uses Better Auth
 */
export async function getSession() {
  // In dev mode, check for dev user first
  if (isDevMode()) {
    const devUser = await getDevUser();
    if (devUser) {
      return devUser;
    }
  }

  // Fall back to Better Auth
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session;
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}

/**
 * Get user with role information
 */
export async function getUserWithRole() {
  const session = await getSession();

  if (!session?.user) {
    return null;
  }

  return session.user;
}
