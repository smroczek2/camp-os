import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

/**
 * Development-only authentication helper
 * Allows bypassing Better Auth for testing different user roles
 *
 * WARNING: Only use in development mode. This completely bypasses
 * all authentication and should NEVER be enabled in production.
 */

export const DEV_SESSION_COOKIE = "camp_os_dev_user_id";

/**
 * Set a development user session
 */
export async function setDevUser(userId: string) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Dev auth not available in production");
  }

  const cookieStore = await cookies();
  cookieStore.set(DEV_SESSION_COOKIE, userId, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });
}

/**
 * Get the current development user session
 */
export async function getDevUser() {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const cookieStore = await cookies();
  const devUserId = cookieStore.get(DEV_SESSION_COOKIE);

  if (!devUserId?.value) {
    return null;
  }

  // Get user from database
  const userRecord = await db.query.user.findFirst({
    where: eq(user.id, devUserId.value),
  });

  if (!userRecord) {
    return null;
  }

  // Return a session-like object
  return {
    user: {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      image: userRecord.image,
      emailVerified: userRecord.emailVerified,
      role: userRecord.role, // CRITICAL: Include role for RBAC checks
    },
    session: {
      id: "dev-session",
      userId: userRecord.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
    },
  };
}

/**
 * Clear development session
 */
export async function clearDevUser() {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.delete(DEV_SESSION_COOKIE);
}

/**
 * Check if we're in development mode
 */
export function isDevMode() {
  return process.env.NODE_ENV !== "production";
}
