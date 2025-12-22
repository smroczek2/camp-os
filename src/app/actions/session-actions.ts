"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { sessions, sessionForms, registrations } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  createSessionSchema,
  updateSessionSchema,
  type CreateSessionInput,
  type UpdateSessionInput,
} from "@/lib/validations/session";

/**
 * Enhanced session creation action that handles all fields including:
 * - Basic info (name, description)
 * - Dates and pricing
 * - Eligibility (age/grade ranges)
 * - Registration window
 * - Additional details (special instructions, what to bring)
 * - Form attachments
 */
export async function createEnhancedSessionAction(data: CreateSessionInput) {
  const session = await getSession();

  if (!session?.user || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  // Validate input
  const parsed = createSessionSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const newSession = await db.transaction(async (tx) => {
      // Create the session with all fields
      const [created] = await tx
        .insert(sessions)
        .values({
          // Basic info
          name: parsed.data.name,
          description: parsed.data.description || null,

          // Dates and pricing
          startDate: parsed.data.startDate,
          endDate: parsed.data.endDate,
          price: parsed.data.price.toString(),
          capacity: parsed.data.capacity,
          status: parsed.data.status,

          // Eligibility
          minAge: parsed.data.minAge || null,
          maxAge: parsed.data.maxAge || null,
          minGrade: parsed.data.minGrade ?? null,
          maxGrade: parsed.data.maxGrade ?? null,

          // Registration window
          registrationOpenDate: parsed.data.registrationOpenDate || null,
          registrationCloseDate: parsed.data.registrationCloseDate || null,

          // Additional details
          specialInstructions: parsed.data.specialInstructions || null,
          whatToBring: parsed.data.whatToBring || null,
        })
        .returning();

      // Attach forms if provided
      if (parsed.data.formIds && parsed.data.formIds.length > 0) {
        await tx.insert(sessionForms).values(
          parsed.data.formIds.map((formAttachment) => ({
            sessionId: created.id,
            formId: formAttachment.formId,
            required: formAttachment.required,
            displayOrder: formAttachment.displayOrder,
          }))
        );
      }

      return created;
    });

    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/admin/programs");

    return { success: true, session: newSession };
  } catch (error) {
    console.error("Failed to create session:", error);
    return { success: false, error: "Failed to create session" };
  }
}

/**
 * Update an existing session
 */
export async function updateSessionAction(data: UpdateSessionInput) {
  const session = await getSession();

  if (!session?.user || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  // Validate input
  const parsed = updateSessionSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};

    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
    if (parsed.data.startDate !== undefined) updateData.startDate = parsed.data.startDate;
    if (parsed.data.endDate !== undefined) updateData.endDate = parsed.data.endDate;
    if (parsed.data.price !== undefined) updateData.price = parsed.data.price.toString();
    if (parsed.data.capacity !== undefined) updateData.capacity = parsed.data.capacity;
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
    if (parsed.data.minAge !== undefined) updateData.minAge = parsed.data.minAge;
    if (parsed.data.maxAge !== undefined) updateData.maxAge = parsed.data.maxAge;
    if (parsed.data.minGrade !== undefined) updateData.minGrade = parsed.data.minGrade;
    if (parsed.data.maxGrade !== undefined) updateData.maxGrade = parsed.data.maxGrade;
    if (parsed.data.registrationOpenDate !== undefined)
      updateData.registrationOpenDate = parsed.data.registrationOpenDate;
    if (parsed.data.registrationCloseDate !== undefined)
      updateData.registrationCloseDate = parsed.data.registrationCloseDate;
    if (parsed.data.specialInstructions !== undefined)
      updateData.specialInstructions = parsed.data.specialInstructions;
    if (parsed.data.whatToBring !== undefined) updateData.whatToBring = parsed.data.whatToBring;

    const [updated] = await db
      .update(sessions)
      .set(updateData)
      .where(eq(sessions.id, parsed.data.sessionId))
      .returning();

    if (!updated) {
      return { success: false, error: "Session not found" };
    }

    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/admin/programs");
    revalidatePath(`/dashboard/admin/programs/${parsed.data.sessionId}`);

    return { success: true, session: updated };
  } catch (error) {
    console.error("Failed to update session:", error);
    return { success: false, error: "Failed to update session" };
  }
}

/**
 * Delete a session (only if no registrations exist)
 */
const deleteSessionSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID"),
});

export async function deleteSessionAction(data: z.infer<typeof deleteSessionSchema>) {
  const session = await getSession();

  if (!session?.user || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = deleteSessionSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    // Check for existing registrations
    const existingRegistrations = await db.query.registrations.findMany({
      where: eq(registrations.sessionId, parsed.data.sessionId),
    });

    if (existingRegistrations.length > 0) {
      return { success: false, error: "Cannot delete session with existing registrations" };
    }

    await db.delete(sessions).where(eq(sessions.id, parsed.data.sessionId));

    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/admin/programs");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete session:", error);
    return { success: false, error: "Failed to delete session" };
  }
}

/**
 * Duplicate a session with new dates
 */
const duplicateSessionSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID"),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  name: z.string().optional(),
});

export async function duplicateSessionAction(data: z.infer<typeof duplicateSessionSchema>) {
  const session = await getSession();

  if (!session?.user || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = duplicateSessionSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const original = await db.query.sessions.findFirst({
      where: eq(sessions.id, parsed.data.sessionId),
    });

    if (!original) {
      return { success: false, error: "Session not found" };
    }

    // Calculate new dates - default to 1 week after original
    const originalDuration = new Date(original.endDate).getTime() - new Date(original.startDate).getTime();
    const newStartDate = parsed.data.startDate || new Date(new Date(original.endDate).getTime() + 7 * 24 * 60 * 60 * 1000);
    const newEndDate = parsed.data.endDate || new Date(newStartDate.getTime() + originalDuration);

    const [duplicated] = await db
      .insert(sessions)
      .values({
        name: parsed.data.name || original.name + " (Copy)",
        description: original.description,
        startDate: newStartDate,
        endDate: newEndDate,
        price: original.price,
        capacity: original.capacity,
        status: "draft",
        minAge: original.minAge,
        maxAge: original.maxAge,
        minGrade: original.minGrade,
        maxGrade: original.maxGrade,
        registrationOpenDate: original.registrationOpenDate,
        registrationCloseDate: original.registrationCloseDate,
        specialInstructions: original.specialInstructions,
        whatToBring: original.whatToBring,
      })
      .returning();

    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/admin/programs");

    return { success: true, session: duplicated };
  } catch (error) {
    console.error("Failed to duplicate session:", error);
    return { success: false, error: "Failed to duplicate session" };
  }
}

/**
 * Archive a session (set status to completed)
 */
const archiveSessionSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID"),
});

export async function archiveSessionAction(data: z.infer<typeof archiveSessionSchema>) {
  const session = await getSession();

  if (!session?.user || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = archiveSessionSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const [updated] = await db
      .update(sessions)
      .set({ status: "completed" })
      .where(eq(sessions.id, parsed.data.sessionId))
      .returning();

    if (!updated) {
      return { success: false, error: "Session not found" };
    }

    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/admin/programs");
    revalidatePath("/dashboard/admin/programs/" + parsed.data.sessionId);

    return { success: true, session: updated };
  } catch (error) {
    console.error("Failed to archive session:", error);
    return { success: false, error: "Failed to archive session" };
  }
}

/**
 * Update registration status
 */
const updateRegistrationStatusSchema = z.object({
  registrationId: z.string().uuid("Invalid registration ID"),
  status: z.enum(["pending", "confirmed", "canceled", "refunded"]),
  amountPaid: z.string().optional(),
});

export async function updateRegistrationStatusAction(
  data: z.infer<typeof updateRegistrationStatusSchema>
) {
  const session = await getSession();

  if (!session?.user || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = updateRegistrationStatusSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const updateData: { status: string; amountPaid?: string } = {
      status: parsed.data.status,
    };

    if (parsed.data.amountPaid) {
      updateData.amountPaid = parsed.data.amountPaid;
    }

    const [updated] = await db
      .update(registrations)
      .set(updateData)
      .where(eq(registrations.id, parsed.data.registrationId))
      .returning();

    if (!updated) {
      return { success: false, error: "Registration not found" };
    }

    revalidatePath("/dashboard/admin/programs");

    return { success: true, registration: updated };
  } catch (error) {
    console.error("Failed to update registration status:", error);
    return { success: false, error: "Failed to update registration status" };
  }
}
