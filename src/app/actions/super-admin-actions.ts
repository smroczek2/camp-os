"use server";

import { db } from "@/lib/db";
import { organizations, organizationUsers, user, events } from "@/lib/schema";
import { eq, sql, desc, count, gte } from "drizzle-orm";
import { getSession } from "@/lib/auth-helper";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { cookies } from "next/headers";

// Types for super admin operations
export interface OrganizationStats {
  id: string;
  name: string;
  slug: string;
  status: string;
  subscriptionTier: string;
  contactEmail: string;
  createdAt: Date;
  userCount: number;
  campCount: number;
  childrenCount: number;
}

export interface DashboardStats {
  totalOrganizations: number;
  activeOrganizations: number;
  trialOrganizations: number;
  suspendedOrganizations: number;
  totalUsers: number;
  recentOnboardings: number;
}

/**
 * Verify the current user is a super admin
 */
async function requireSuperAdmin() {
  const session = await getSession();

  if (!session?.user) {
    throw new Error("Unauthorized: Not authenticated");
  }

  if (session.user.role !== "super_admin") {
    throw new Error("Unauthorized: Super admin access required");
  }

  return session.user;
}

/**
 * Log a super admin action to the events table
 */
async function logSuperAdminAction(
  superAdminUserId: string,
  action: string,
  targetOrganizationId?: string,
  metadata?: Record<string, unknown>
) {
  const headersList = await headers();

  await db.insert(events).values({
    streamId: `super_admin:${superAdminUserId}`,
    eventType: `super_admin.${action}`,
    eventData: {
      superAdminUserId,
      targetOrganizationId,
      ipAddress: headersList.get("x-forwarded-for") || "unknown",
      userAgent: headersList.get("user-agent") || "unknown",
      ...metadata,
    },
    version: 1,
    userId: superAdminUserId,
    organizationId: targetOrganizationId || null,
  });
}

/**
 * Get dashboard statistics for super admin
 */
export async function getDashboardStatsAction(): Promise<DashboardStats> {
  await requireSuperAdmin();

  // Get organization counts by status
  const orgStats = await db
    .select({
      status: organizations.status,
      count: count(),
    })
    .from(organizations)
    .groupBy(organizations.status);

  const statusCounts = orgStats.reduce(
    (acc, row) => {
      acc[row.status] = Number(row.count);
      return acc;
    },
    {} as Record<string, number>
  );

  // Get total users
  const [{ totalUsers }] = await db
    .select({ totalUsers: count() })
    .from(user);

  // Get recent onboardings (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [{ recentOnboardings }] = await db
    .select({ recentOnboardings: count() })
    .from(organizations)
    .where(gte(organizations.createdAt, sevenDaysAgo));

  return {
    totalOrganizations:
      (statusCounts["active"] || 0) +
      (statusCounts["trial"] || 0) +
      (statusCounts["suspended"] || 0) +
      (statusCounts["inactive"] || 0),
    activeOrganizations: statusCounts["active"] || 0,
    trialOrganizations: statusCounts["trial"] || 0,
    suspendedOrganizations: statusCounts["suspended"] || 0,
    totalUsers: Number(totalUsers),
    recentOnboardings: Number(recentOnboardings),
  };
}

/**
 * Get all organizations with stats
 */
export async function getOrganizationsAction(): Promise<OrganizationStats[]> {
  await requireSuperAdmin();

  // Get organizations with related counts
  const orgs = await db.query.organizations.findMany({
    orderBy: [desc(organizations.createdAt)],
  });

  // Get counts for each organization
  const orgStats = await Promise.all(
    orgs.map(async (org) => {
      const [userCountResult] = await db
        .select({ count: count() })
        .from(organizationUsers)
        .where(eq(organizationUsers.organizationId, org.id));

      // We'll add camp and children counts when those tables exist
      // For now, return 0
      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        status: org.status,
        subscriptionTier: org.subscriptionTier,
        contactEmail: org.contactEmail,
        createdAt: org.createdAt,
        userCount: Number(userCountResult.count),
        campCount: 0, // TODO: Add when camps table is populated
        childrenCount: 0, // TODO: Add when children table is populated
      };
    })
  );

  return orgStats;
}

/**
 * Get organization details by ID
 */
export async function getOrganizationDetailsAction(organizationId: string) {
  const superAdmin = await requireSuperAdmin();

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
  });

  if (!org) {
    throw new Error("Organization not found");
  }

  // Get organization users
  const orgUsers = await db.query.organizationUsers.findMany({
    where: eq(organizationUsers.organizationId, organizationId),
    with: {
      user: true,
    },
  });

  // Log the view action
  await logSuperAdminAction(superAdmin.id, "view_organization", organizationId);

  return {
    organization: org,
    users: orgUsers,
  };
}

/**
 * Suspend an organization
 */
export async function suspendOrganizationAction(
  organizationId: string,
  reason: string
) {
  const superAdmin = await requireSuperAdmin();

  await db
    .update(organizations)
    .set({
      status: "suspended",
      metadata: sql`jsonb_set(COALESCE(${organizations.metadata}, '{}'), '{suspensionReason}', ${JSON.stringify(reason)}::jsonb)`,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, organizationId));

  await logSuperAdminAction(superAdmin.id, "suspend_organization", organizationId, {
    reason,
  });

  revalidatePath("/super-admin/organizations");
  revalidatePath(`/super-admin/organizations/${organizationId}`);
}

/**
 * Activate an organization
 */
export async function activateOrganizationAction(organizationId: string) {
  const superAdmin = await requireSuperAdmin();

  await db
    .update(organizations)
    .set({
      status: "active",
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, organizationId));

  await logSuperAdminAction(
    superAdmin.id,
    "activate_organization",
    organizationId
  );

  revalidatePath("/super-admin/organizations");
  revalidatePath(`/super-admin/organizations/${organizationId}`);
}

/**
 * Start preview mode for an organization
 * Sets a cookie to track preview state
 */
export async function startPreviewModeAction(
  organizationId: string,
  organizationName: string
) {
  const superAdmin = await requireSuperAdmin();

  // Set preview mode cookies
  const cookieStore = await cookies();
  cookieStore.set("preview_org_id", organizationId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60, // 1 hour
  });
  cookieStore.set("preview_org_name", organizationName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60, // 1 hour
  });

  await logSuperAdminAction(
    superAdmin.id,
    "preview_mode_start",
    organizationId
  );

  return { success: true };
}

/**
 * End preview mode
 */
export async function endPreviewModeAction() {
  const superAdmin = await requireSuperAdmin();

  const cookieStore = await cookies();
  const previewOrgId = cookieStore.get("preview_org_id")?.value;

  // Clear preview mode cookies
  cookieStore.delete("preview_org_id");
  cookieStore.delete("preview_org_name");

  if (previewOrgId) {
    await logSuperAdminAction(superAdmin.id, "preview_mode_end", previewOrgId);
  }

  return { success: true };
}

/**
 * Get recent super admin audit logs
 */
export async function getAuditLogsAction(limit: number = 50) {
  await requireSuperAdmin();

  const logs = await db.query.events.findMany({
    where: sql`${events.eventType} LIKE 'super_admin.%'`,
    orderBy: [desc(events.timestamp)],
    limit,
  });

  return logs;
}

/**
 * Update organization settings
 */
export async function updateOrganizationAction(
  organizationId: string,
  updates: {
    maxCampers?: number;
    maxStaff?: number;
    subscriptionTier?: string;
  }
) {
  const superAdmin = await requireSuperAdmin();

  await db
    .update(organizations)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, organizationId));

  await logSuperAdminAction(
    superAdmin.id,
    "update_organization",
    organizationId,
    { updates }
  );

  revalidatePath("/super-admin/organizations");
  revalidatePath(`/super-admin/organizations/${organizationId}`);
}
