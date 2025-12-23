"use server";

import { getSession } from "@/lib/auth-helper";
import { enforcePermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { medications, medicationLogs, children, events, registrations } from "@/lib/schema";
import { eq, and, gte, lte, or, isNull, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  createMedicationSchema,
  updateMedicationSchema,
  deleteMedicationSchema,
  logMedicationAdminSchema,
  getMedicationScheduleSchema,
  type CreateMedicationInput,
  type UpdateMedicationInput,
  type DeleteMedicationInput,
  type LogMedicationAdminInput,
  type GetMedicationScheduleInput,
} from "@/lib/validations/medication";

/**
 * Add a medication for a child
 * Parents can add for their own children
 * Nurses/Admins can add for any child
 */
export async function addMedicationAction(data: CreateMedicationInput) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Validate input
  const validatedData = createMedicationSchema.parse(data);

  // Verify child exists and user has permission
  const child = await db.query.children.findFirst({
    where: eq(children.id, validatedData.childId),
  });

  if (!child) {
    throw new Error("Child not found");
  }

  // Parents can only add medications for their own children
  // Nurses and admins can add for any child
  if (session.user.role === "parent" && child.userId !== session.user.id) {
    throw new Error("You can only add medications for your own children");
  }

  // Check permission
  await enforcePermission(session.user.id, "medication", "create");

  // Create medication
  const result = await db.transaction(async (tx) => {
    const [medication] = await tx
      .insert(medications)
      .values({
        childId: validatedData.childId,
        name: validatedData.name.trim(),
        dosage: validatedData.dosage.trim(),
        frequency: validatedData.frequency.trim(),
        instructions: validatedData.instructions?.trim() || null,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate || null,
      })
      .returning();

    // Log event
    await tx.insert(events).values({
      streamId: `medication-${medication.id}`,
      eventType: "MedicationCreated",
      eventData: medication as unknown as Record<string, unknown>,
      version: 1,
      userId: session.user.id,
    });

    return medication;
  });

  revalidatePath("/dashboard/parent");
  revalidatePath("/dashboard/nurse");
  return { success: true, medication: result };
}

/**
 * Update medication details
 * Parents can update their own children's medications
 * Nurses/Admins can update any medication
 */
export async function updateMedicationAction(data: UpdateMedicationInput) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Validate input
  const validatedData = updateMedicationSchema.parse(data);

  // Get medication with child info
  const medication = await db.query.medications.findFirst({
    where: eq(medications.id, validatedData.medicationId),
    with: {
      child: true,
    },
  });

  if (!medication) {
    throw new Error("Medication not found");
  }

  // Parents can only update their own children's medications
  if (session.user.role === "parent" && medication.child.userId !== session.user.id) {
    throw new Error("You can only update medications for your own children");
  }

  // Check permission
  await enforcePermission(session.user.id, "medication", "update");

  // Update medication
  const result = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(medications)
      .set({
        name: validatedData.name?.trim(),
        dosage: validatedData.dosage?.trim(),
        frequency: validatedData.frequency?.trim(),
        instructions: validatedData.instructions?.trim(),
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
      })
      .where(eq(medications.id, validatedData.medicationId))
      .returning();

    // Log event
    await tx.insert(events).values({
      streamId: `medication-${updated.id}`,
      eventType: "MedicationUpdated",
      eventData: updated as unknown as Record<string, unknown>,
      version: 1,
      userId: session.user.id,
    });

    return updated;
  });

  revalidatePath("/dashboard/parent");
  revalidatePath("/dashboard/nurse");
  return { success: true, medication: result };
}

/**
 * Delete a medication
 * Parents can delete their own children's medications
 * Nurses/Admins can delete any medication
 */
export async function deleteMedicationAction(data: DeleteMedicationInput) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Validate input
  const validatedData = deleteMedicationSchema.parse(data);

  // Get medication with child info
  const medication = await db.query.medications.findFirst({
    where: eq(medications.id, validatedData.medicationId),
    with: {
      child: true,
    },
  });

  if (!medication) {
    throw new Error("Medication not found");
  }

  // Parents can only delete their own children's medications
  if (session.user.role === "parent" && medication.child.userId !== session.user.id) {
    throw new Error("You can only delete medications for your own children");
  }

  // Check permission
  await enforcePermission(session.user.id, "medication", "delete");

  // Delete medication (cascades to logs via schema)
  await db.transaction(async (tx) => {
    await tx
      .delete(medications)
      .where(eq(medications.id, validatedData.medicationId));

    // Log event
    await tx.insert(events).values({
      streamId: `medication-${validatedData.medicationId}`,
      eventType: "MedicationDeleted",
      eventData: { medicationId: validatedData.medicationId } as Record<string, unknown>,
      version: 1,
      userId: session.user.id,
    });
  });

  revalidatePath("/dashboard/parent");
  revalidatePath("/dashboard/nurse");
  return { success: true };
}

/**
 * Log medication administration
 * Only nurses and staff can log medication administration
 */
export async function logMedicationAdminAction(data: LogMedicationAdminInput) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Only nurses and staff can log medication
  if (session.user.role !== "nurse" && session.user.role !== "staff" && session.user.role !== "admin") {
    throw new Error("Only nurses and staff can log medication administration");
  }

  // Validate input
  const validatedData = logMedicationAdminSchema.parse(data);

  // Verify medication exists and belongs to child
  const medication = await db.query.medications.findFirst({
    where: eq(medications.id, validatedData.medicationId),
    with: {
      child: true,
    },
  });

  if (!medication) {
    throw new Error("Medication not found");
  }

  if (medication.childId !== validatedData.childId) {
    throw new Error("Medication does not belong to this child");
  }

  // Check permission
  await enforcePermission(session.user.id, "medication", "update");

  // Create medication log
  const result = await db.transaction(async (tx) => {
    const [log] = await tx
      .insert(medicationLogs)
      .values({
        childId: validatedData.childId,
        medicationId: validatedData.medicationId,
        administeredBy: session.user.id,
        administeredAt: validatedData.administeredAt,
        dosage: validatedData.dosage.trim(),
        photoVerificationUrl: validatedData.photoVerificationUrl || null,
        guardianNotified: validatedData.guardianNotified,
      })
      .returning();

    // Log event
    await tx.insert(events).values({
      streamId: `medication-log-${log.id}`,
      eventType: "MedicationAdministered",
      eventData: log as unknown as Record<string, unknown>,
      version: 1,
      userId: session.user.id,
    });

    return log;
  });

  revalidatePath("/dashboard/nurse");
  revalidatePath("/dashboard/staff");
  return { success: true, log: result };
}

/**
 * Get medication schedule for a session/date
 * Returns medications that are active for the given criteria
 */
export async function getMedicationScheduleAction(data: GetMedicationScheduleInput) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Only staff, nurses, and admins can view medication schedules
  if (session.user.role === "parent") {
    throw new Error("Parents cannot view medication schedules");
  }

  // Validate input
  const validatedData = getMedicationScheduleSchema.parse(data);

  const targetDate = validatedData.date || new Date();

  // Create start/end of day dates without mutating targetDate
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Build query conditions
  let query = db.query.medications.findMany({
    where: and(
      // Medication is active on target date
      lte(medications.startDate, targetDate),
      or(
        isNull(medications.endDate),
        gte(medications.endDate, targetDate)
      ),
      // Filter by childId if provided
      validatedData.childId ? eq(medications.childId, validatedData.childId) : undefined
    ),
    with: {
      child: {
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      logs: {
        where: and(
          gte(medicationLogs.administeredAt, startOfDay),
          lte(medicationLogs.administeredAt, endOfDay)
        ),
        orderBy: desc(medicationLogs.administeredAt),
      },
    },
  });

  // If sessionId provided, filter by children registered for that session
  if (validatedData.sessionId) {
    const sessionRegistrations = await db.query.registrations.findMany({
      where: and(
        eq(registrations.sessionId, validatedData.sessionId),
        eq(registrations.status, "confirmed")
      ),
      columns: {
        childId: true,
      },
    });

    const registeredChildIds = sessionRegistrations.map((r) => r.childId);

    query = db.query.medications.findMany({
      where: and(
        lte(medications.startDate, targetDate),
        or(
          isNull(medications.endDate),
          gte(medications.endDate, targetDate)
        ),
        registeredChildIds.length > 0
          ? or(...registeredChildIds.map((id) => eq(medications.childId, id)))
          : undefined
      ),
      with: {
        child: {
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        logs: {
          where: and(
            gte(medicationLogs.administeredAt, startOfDay),
            lte(medicationLogs.administeredAt, endOfDay)
          ),
          orderBy: desc(medicationLogs.administeredAt),
        },
      },
    });
  }

  const schedule = await query;

  return { success: true, medications: schedule };
}

/**
 * Get medications for a specific child
 * Parents can get their own children's medications
 * Staff/Nurses can get any child's medications
 */
export async function getChildMedicationsAction(childId: string) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Verify child exists
  const child = await db.query.children.findFirst({
    where: eq(children.id, childId),
  });

  if (!child) {
    throw new Error("Child not found");
  }

  // Parents can only view their own children's medications
  if (session.user.role === "parent" && child.userId !== session.user.id) {
    throw new Error("You can only view medications for your own children");
  }

  // Get medications for child
  const childMedications = await db.query.medications.findMany({
    where: eq(medications.childId, childId),
    orderBy: desc(medications.startDate),
    with: {
      logs: {
        limit: 5,
        orderBy: desc(medicationLogs.administeredAt),
        with: {
          administrator: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return { success: true, medications: childMedications };
}
