"use server";

import { db } from "@/lib/db";
import {
  organizations,
  organizationUsers,
  user as userTable,
} from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Get all organizations that the current user belongs to
 */
export async function getUserOrganizationsAction() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  // Get all organizations the user is a member of
  const memberships = await db.query.organizationUsers.findMany({
    where: and(
      eq(organizationUsers.userId, session.user.id),
      eq(organizationUsers.status, "active")
    ),
    with: {
      organization: true,
    },
  });

  return memberships.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug,
    role: m.role,
    status: m.organization.status,
    subscriptionTier: m.organization.subscriptionTier,
  }));
}

/**
 * Switch the user's active organization
 *
 * This updates the user's activeOrganizationId field in the database
 * and the session will be refreshed on next request.
 */
export async function switchOrganizationAction(organizationId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  // Verify user has access to this organization
  const membership = await db.query.organizationUsers.findFirst({
    where: and(
      eq(organizationUsers.userId, session.user.id),
      eq(organizationUsers.organizationId, organizationId),
      eq(organizationUsers.status, "active")
    ),
  });

  if (!membership && session.user.role !== "super_admin") {
    throw new Error("You do not have access to this organization");
  }

  // Update user's active organization
  await db
    .update(userTable)
    .set({
      activeOrganizationId: organizationId,
    })
    .where(eq(userTable.id, session.user.id));

  return { success: true };
}

/**
 * Get the current organization from request headers
 * (set by middleware)
 */
export async function getCurrentOrganizationAction() {
  const headersList = await headers();
  const organizationId = headersList.get("x-organization-id");

  if (!organizationId) {
    return null;
  }

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
  });

  return org;
}

/**
 * Get organization details by slug
 */
export async function getOrganizationBySlugAction(slug: string) {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
  });

  if (!org) {
    throw new Error("Organization not found");
  }

  return org;
}

/**
 * Check if user belongs to an organization
 */
export async function userBelongsToOrganizationAction(
  organizationId: string
): Promise<boolean> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return false;
  }

  // Super admins have access to all organizations
  if (session.user.role === "super_admin") {
    return true;
  }

  const membership = await db.query.organizationUsers.findFirst({
    where: and(
      eq(organizationUsers.userId, session.user.id),
      eq(organizationUsers.organizationId, organizationId),
      eq(organizationUsers.status, "active")
    ),
  });

  return !!membership;
}

/**
 * Get organization statistics (for super-admin dashboard)
 */
export async function getOrganizationStatsAction(organizationId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || session.user.role !== "super_admin") {
    throw new Error("Unauthorized - super admin only");
  }

  // Get organization with related counts
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
    with: {
      organizationUsers: true,
      children: true,
      camps: true,
    },
  });

  if (!org) {
    throw new Error("Organization not found");
  }

  return {
    organization: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      status: org.status,
      subscriptionTier: org.subscriptionTier,
      maxCampers: org.maxCampers,
      maxStaff: org.maxStaff,
      createdAt: org.createdAt,
    },
    stats: {
      userCount: org.organizationUsers.length,
      childCount: org.children.length,
      campCount: org.camps.length,
    },
  };
}
