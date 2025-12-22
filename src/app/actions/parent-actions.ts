"use server";

import { getSession } from "@/lib/auth-helper";
import { enforcePermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { children, registrations, events } from "@/lib/schema";
import { registrationService } from "@/services/registration-service";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Add a new child for the current parent user
 */
export async function addChildAction(data: {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date string
  allergies?: string[];
  medicalNotes?: string;
}) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Check permission
  await enforcePermission(session.user.id, "child", "create");

  // Validate date
  const dob = new Date(data.dateOfBirth);
  if (isNaN(dob.getTime())) {
    throw new Error("Invalid date of birth");
  }

  // Create child
  const result = await db.transaction(async (tx) => {
    const [child] = await tx
      .insert(children)
      .values({
        userId: session.user.id,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        dateOfBirth: dob,
        allergies: data.allergies || [],
        medicalNotes: data.medicalNotes?.trim() || null,
      })
      .returning();

    // Log event
    await tx.insert(events).values({
      streamId: `child-${child.id}`,
      eventType: "ChildCreated",
      eventData: child as unknown as Record<string, unknown>,
      version: 1,
      userId: session.user.id,
    });

    return child;
  });

  revalidatePath("/dashboard/parent");
  return { success: true, child: result };
}

/**
 * Register a child for a camp session
 */
export async function registerForSessionAction(data: {
  childId: string;
  sessionId: string;
}) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Check permission
  await enforcePermission(session.user.id, "registration", "create");

  // Verify child belongs to user and create registration
  const registration = await db.transaction(async (tx) => {
    // Verify child belongs to user
    const child = await tx.query.children.findFirst({
      where: and(
        eq(children.id, data.childId),
        eq(children.userId, session.user.id)
      ),
    });

    if (!child) {
      throw new Error("Child not found or you don't have permission");
    }

    // Check if already registered
    const existing = await tx.query.registrations.findFirst({
      where: and(
        eq(registrations.childId, data.childId),
        eq(registrations.sessionId, data.sessionId)
      ),
    });

    if (existing) {
      throw new Error("Child is already registered for this session");
    }

    // Create registration
    const newRegistration = await registrationService.create({
      userId: session.user.id,
      childId: data.childId,
      sessionId: data.sessionId,
    });

    return newRegistration;
  });

  revalidatePath("/dashboard/parent");
  return { success: true, registration };
}

/**
 * Cancel a registration
 */
export async function cancelRegistrationAction(registrationId: string) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Verify registration belongs to user
  const registration = await db.query.registrations.findFirst({
    where: eq(registrations.id, registrationId),
  });

  if (!registration) {
    throw new Error("Registration not found");
  }

  if (registration.userId !== session.user.id) {
    throw new Error("You don't have permission to cancel this registration");
  }

  // Check permission
  await enforcePermission(session.user.id, "registration", "update");

  // Cancel registration
  await registrationService.cancel(registrationId, session.user.id);

  revalidatePath("/dashboard/parent");
  return { success: true };
}
