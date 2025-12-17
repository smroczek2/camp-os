import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Get the current session from Better Auth
 */
export async function getSession() {
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

/**
 * Check if user has super_admin role
 */
export async function isSuperAdmin() {
  const user = await getUserWithRole();
  return user?.role === "super_admin";
}

/**
 * Require authentication - throws redirect if not authenticated
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}
