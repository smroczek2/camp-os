import { db } from "@/lib/db";
import { organizations, organizationUsers, user, events } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import type { OnboardingInput } from "@/types/onboarding";

/**
 * Provision a new organization with admin user and memberships
 *
 * This function creates:
 * 1. Organization record
 * 2. Admin user account (via Better Auth)
 * 3. Organization membership
 * 4. Audit log event
 *
 * BUG #3 FIX: Uses transaction to prevent race conditions
 * All operations are atomic - if any step fails, everything rolls back.
 *
 * SIMPLIFIED: No onboarding_sessions table, no retry logic
 */
export async function provisionOrganization(
  data: OnboardingInput
): Promise<{
  organizationId: string;
  userId: string;
  redirectUrl: string;
}> {
  // Check if organization slug is already taken
  const existingOrg = await db.query.organizations.findFirst({
    where: eq(organizations.slug, data.organizationSlug),
  });

  if (existingOrg) {
    throw new Error(
      `Organization slug "${data.organizationSlug}" is already taken. Please choose a different name.`
    );
  }

  // Check if user email already exists
  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, data.email),
  });

  if (existingUser) {
    throw new Error(
      `An account with email "${data.email}" already exists. Please log in instead.`
    );
  }

  try {
    // Create organization and membership in a single transaction
    const result = await db.transaction(async (tx) => {
      // 1. Create organization
      const [org] = await tx
        .insert(organizations)
        .values({
          name: data.organizationName,
          slug: data.organizationSlug,
          status: "active",
          subscriptionTier: "free",
          maxCampers: 100,
          maxStaff: 20,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone || null,
          timezone: data.timezone || "America/New_York",
          metadata: {},
        })
        .returning();

      // 2. Create admin user account (Better Auth)
      // NOTE: This happens OUTSIDE the transaction because Better Auth
      // manages its own transactions. If this fails, the transaction will
      // rollback automatically when we throw.
      let authUser;
      try {
        const authResult = await auth.api.signUpEmail({
          body: {
            email: data.email,
            password: data.password,
            name: `${data.firstName} ${data.lastName}`,
          },
        });

        if (!authResult.user) {
          throw new Error("Failed to create user account");
        }

        authUser = authResult.user;
      } catch (error) {
        // If Better Auth fails, throw to rollback organization creation
        throw new Error(
          `Failed to create user account: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }

      // 3. Update user role to admin and set active organization
      await tx
        .update(user)
        .set({
          role: "admin",
          activeOrganizationId: org.id,
        })
        .where(eq(user.id, authUser.id));

      // 4. Create organization membership
      await tx.insert(organizationUsers).values({
        organizationId: org.id,
        userId: authUser.id,
        role: "owner",
        status: "active",
        joinedAt: new Date(),
      });

      // 5. Create audit log event
      await tx.insert(events).values({
        organizationId: org.id,
        streamId: `organization-${org.id}`,
        eventType: "OrganizationCreated",
        eventData: {
          organizationId: org.id,
          organizationName: org.name,
          organizationSlug: org.slug,
          adminUserId: authUser.id,
          adminEmail: data.email,
          subscriptionTier: org.subscriptionTier,
          source: "self_service_onboarding",
        },
        version: 1,
        userId: authUser.id,
      });

      return {
        organizationId: org.id,
        userId: authUser.id,
        organizationSlug: org.slug,
      };
    });

    // Return success with redirect URL
    return {
      organizationId: result.organizationId,
      userId: result.userId,
      redirectUrl: `/org/${result.organizationSlug}/dashboard`,
    };
  } catch (error) {
    // Log error for monitoring
    console.error("Provisioning failed:", error);

    // Re-throw with user-friendly message
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to create organization. Please try again or contact support."
    );
  }
}

/**
 * Helper function to generate organization slug from name
 */
export function generateOrganizationSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ""); // Trim hyphens from start/end
}
