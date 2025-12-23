"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { attendance, registrations, assignments, groupMembers } from "@/lib/schema";
import { eq, and, gte, lte, inArray } from "drizzle-orm";
import { z } from "zod";

// ============================================================================
// Schemas
// ============================================================================

const checkInSchema = z.object({
  childId: z.string().uuid("Invalid child ID"),
  sessionId: z.string().uuid("Invalid session ID"),
  date: z.coerce.date().optional(),
  notes: z.string().optional(),
});

const checkOutSchema = z.object({
  attendanceId: z.string().uuid("Invalid attendance ID"),
  notes: z.string().optional(),
});

const getExpectedChildrenSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID"),
  date: z.coerce.date().optional(),
});

// ============================================================================
// Check-in Action
// ============================================================================

export async function checkInChildAction(data: z.infer<typeof checkInSchema>) {
  const session = await getSession();

  if (!session?.user || !["admin", "staff"].includes(session.user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = checkInSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const targetDate = parsed.data.date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Check if attendance record already exists for this child today
    const existing = await db.query.attendance.findFirst({
      where: and(
        eq(attendance.childId, parsed.data.childId),
        eq(attendance.sessionId, parsed.data.sessionId),
        gte(attendance.date, startOfDay),
        lte(attendance.date, endOfDay)
      ),
    });

    if (existing) {
      // If already exists but not checked in, update it
      if (!existing.checkedInAt) {
        const [updated] = await db
          .update(attendance)
          .set({
            checkedInAt: new Date(),
            checkedInBy: session.user.id,
            notes: parsed.data.notes || existing.notes,
          })
          .where(eq(attendance.id, existing.id))
          .returning();

        revalidatePath("/dashboard/admin/attendance");
        revalidatePath("/dashboard/staff/attendance");
        return { success: true, attendance: updated };
      } else {
        return { success: false, error: "Child is already checked in" };
      }
    }

    // Verify child is registered for this session
    const registration = await db.query.registrations.findFirst({
      where: and(
        eq(registrations.childId, parsed.data.childId),
        eq(registrations.sessionId, parsed.data.sessionId),
        eq(registrations.status, "confirmed")
      ),
    });

    if (!registration) {
      return { success: false, error: "Child is not registered for this session" };
    }

    // Create new attendance record
    const [newAttendance] = await db
      .insert(attendance)
      .values({
        childId: parsed.data.childId,
        sessionId: parsed.data.sessionId,
        date: targetDate,
        checkedInAt: new Date(),
        checkedInBy: session.user.id,
        notes: parsed.data.notes || null,
      })
      .returning();

    revalidatePath("/dashboard/admin/attendance");
    revalidatePath("/dashboard/staff/attendance");
    return { success: true, attendance: newAttendance };
  } catch (error) {
    console.error("Failed to check in child:", error);
    return { success: false, error: "Failed to check in child" };
  }
}

// ============================================================================
// Check-out Action
// ============================================================================

export async function checkOutChildAction(data: z.infer<typeof checkOutSchema>) {
  const session = await getSession();

  if (!session?.user || !["admin", "staff"].includes(session.user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = checkOutSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    // Get existing attendance record
    const existing = await db.query.attendance.findFirst({
      where: eq(attendance.id, parsed.data.attendanceId),
    });

    if (!existing) {
      return { success: false, error: "Attendance record not found" };
    }

    if (!existing.checkedInAt) {
      return { success: false, error: "Child must be checked in before checking out" };
    }

    if (existing.checkedOutAt) {
      return { success: false, error: "Child is already checked out" };
    }

    // Update attendance record with check-out time
    const [updated] = await db
      .update(attendance)
      .set({
        checkedOutAt: new Date(),
        checkedOutBy: session.user.id,
        notes: parsed.data.notes || existing.notes,
      })
      .where(eq(attendance.id, parsed.data.attendanceId))
      .returning();

    revalidatePath("/dashboard/admin/attendance");
    revalidatePath("/dashboard/staff/attendance");
    return { success: true, attendance: updated };
  } catch (error) {
    console.error("Failed to check out child:", error);
    return { success: false, error: "Failed to check out child" };
  }
}

// ============================================================================
// Get Expected Children Action
// ============================================================================

export async function getExpectedChildrenAction(
  data: z.infer<typeof getExpectedChildrenSchema>
) {
  const session = await getSession();

  if (!session?.user || !["admin", "staff"].includes(session.user.role)) {
    return { success: false, error: "Unauthorized", children: [] };
  }

  const parsed = getExpectedChildrenSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message, children: [] };
  }

  try {
    const targetDate = parsed.data.date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    let allowedChildIds: string[] | null = null;

    if (session.user.role === "staff") {
      const staffAssignments = await db.query.assignments.findMany({
        where: and(
          eq(assignments.staffId, session.user.id),
          eq(assignments.sessionId, parsed.data.sessionId)
        ),
        columns: { groupId: true },
      });

      if (staffAssignments.length === 0) {
        return { success: false, error: "Not assigned to this session", children: [] };
      }

      const groupIds = staffAssignments.map((assignment) => assignment.groupId);
      const groupChildren = await db.query.groupMembers.findMany({
        where: inArray(groupMembers.groupId, groupIds),
        columns: { childId: true },
      });

      allowedChildIds = Array.from(
        new Set(groupChildren.map((member) => member.childId))
      );

      if (allowedChildIds.length === 0) {
        return { success: true, children: [] };
      }
    }

    // Get confirmed registrations for this session
    const registrationFilters = [
      eq(registrations.sessionId, parsed.data.sessionId),
      eq(registrations.status, "confirmed"),
    ];

    if (allowedChildIds) {
      registrationFilters.push(inArray(registrations.childId, allowedChildIds));
    }

    const sessionRegistrations = await db.query.registrations.findMany({
      where: and(...registrationFilters),
      with: {
        child: true,
        user: true,
      },
    });

    // Get today's attendance records for this session
    const todayAttendance = await db.query.attendance.findMany({
      where: and(
        eq(attendance.sessionId, parsed.data.sessionId),
        gte(attendance.date, startOfDay),
        lte(attendance.date, endOfDay)
      ),
    });

    // Map attendance by child ID
    const attendanceMap = new Map(
      todayAttendance.map((a) => [a.childId, a])
    );

    // Combine registration data with attendance status
    const expectedChildren = sessionRegistrations.map((reg) => ({
      childId: reg.child.id,
      firstName: reg.child.firstName,
      lastName: reg.child.lastName,
      parentName: reg.user.name,
      parentEmail: reg.user.email,
      allergies: reg.child.allergies,
      medicalNotes: reg.child.medicalNotes,
      attendance: attendanceMap.get(reg.child.id) || null,
    }));

    return { success: true, children: expectedChildren };
  } catch (error) {
    console.error("Failed to get expected children:", error);
    return { success: false, error: "Failed to get expected children", children: [] };
  }
}

// ============================================================================
// Quick Check-in by Child ID (for barcode scanning, etc.)
// ============================================================================

const quickCheckInSchema = z.object({
  childId: z.string().uuid("Invalid child ID"),
  notes: z.string().optional(),
});

export async function quickCheckInAction(data: z.infer<typeof quickCheckInSchema>) {
  const session = await getSession();

  if (!session?.user || !["admin", "staff"].includes(session.user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = quickCheckInSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const today = new Date();

    // Find active registrations for this child
    const activeRegistrations = await db.query.registrations.findMany({
      where: and(
        eq(registrations.childId, parsed.data.childId),
        eq(registrations.status, "confirmed")
      ),
      with: {
        session: true,
      },
    });

    // Filter for sessions happening today
    const todaySessions = activeRegistrations.filter((reg) => {
      const sessionStart = new Date(reg.session.startDate);
      const sessionEnd = new Date(reg.session.endDate);
      return today >= sessionStart && today <= sessionEnd;
    });

    if (todaySessions.length === 0) {
      return { success: false, error: "Child has no active sessions today" };
    }

    if (todaySessions.length > 1) {
      return {
        success: false,
        error: "Child is registered for multiple sessions today. Please select specific session.",
        sessions: todaySessions.map((reg) => ({
          sessionId: reg.session.id,
          sessionName: reg.session.name,
        })),
      };
    }

    // Check in to the single active session
    const sessionId = todaySessions[0].session.id;
    return checkInChildAction({
      childId: parsed.data.childId,
      sessionId,
      notes: parsed.data.notes,
    });
  } catch (error) {
    console.error("Failed to quick check in:", error);
    return { success: false, error: "Failed to check in child" };
  }
}
