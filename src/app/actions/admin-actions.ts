"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { sessions, incidents, attendance } from "@/lib/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { z } from "zod";

// ============================================================================
// Schemas
// ============================================================================

const updateSessionStatusSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID"),
  status: z.enum(["draft", "open", "closed", "completed"]),
});

// ============================================================================
// Session Actions
// ============================================================================

export async function updateSessionStatusAction(formData: FormData) {
  const session = await getSession();

  if (!session?.user || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  const rawData = {
    sessionId: formData.get("sessionId"),
    status: formData.get("status"),
  };

  const parsed = updateSessionStatusSchema.safeParse(rawData);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    await db
      .update(sessions)
      .set({ status: parsed.data.status })
      .where(eq(sessions.id, parsed.data.sessionId));

    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/admin/programs");

    return { success: true };
  } catch (error) {
    console.error("Failed to update session status:", error);
    return { success: false, error: "Failed to update session status" };
  }
}

// ============================================================================
// Attendance Actions
// ============================================================================

export async function getAttendanceStatsAction(date?: Date) {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: "Unauthorized", stats: null };
  }

  const targetDate = date || new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    // Get today's attendance records
    const todayAttendance = await db.query.attendance.findMany({
      where: and(
        gte(attendance.date, startOfDay),
        lte(attendance.date, endOfDay)
      ),
      with: {
        child: true,
        session: true,
      },
    });

    const checkedIn = todayAttendance.filter(
      (a) => a.checkedInAt && !a.checkedOutAt
    ).length;
    const checkedOut = todayAttendance.filter((a) => a.checkedOutAt).length;
    const total = todayAttendance.length;

    const stats = {
      date: targetDate,
      checkedIn,
      checkedOut,
      total,
      records: todayAttendance,
    };

    return { success: true, stats };
  } catch (error) {
    console.error("Failed to get attendance stats:", error);
    return { success: false, error: "Failed to get attendance stats", stats: null };
  }
}

// ============================================================================
// Incident Actions
// ============================================================================

export async function getIncidentsAction(limit: number = 20) {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: "Unauthorized", incidents: [] };
  }

  try {
    const allIncidents = await db.query.incidents.findMany({
      orderBy: [desc(incidents.occurredAt)],
      limit,
      with: {
        child: true,
        reporter: true,
      },
    });

    return { success: true, incidents: allIncidents };
  } catch (error) {
    console.error("Failed to get incidents:", error);
    return { success: false, error: "Failed to get incidents", incidents: [] };
  }
}

export async function getIncidentByIdAction(incidentId: string) {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: "Unauthorized", incident: null };
  }

  try {
    const incident = await db.query.incidents.findFirst({
      where: eq(incidents.id, incidentId),
      with: {
        child: true,
        reporter: true,
      },
    });

    if (!incident) {
      return { success: false, error: "Incident not found", incident: null };
    }

    return { success: true, incident };
  } catch (error) {
    console.error("Failed to get incident:", error);
    return { success: false, error: "Failed to get incident", incident: null };
  }
}

export async function resolveIncidentAction(formData: FormData) {
  const session = await getSession();

  if (!session?.user || !["admin", "nurse"].includes(session.user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  const incidentId = formData.get("incidentId") as string;
  const resolution = formData.get("resolution") as string;

  if (!incidentId || !resolution) {
    return { success: false, error: "Missing required fields" };
  }

  try {
    await db
      .update(incidents)
      .set({ resolution })
      .where(eq(incidents.id, incidentId));

    revalidatePath("/dashboard/admin/incidents");

    return { success: true };
  } catch (error) {
    console.error("Failed to resolve incident:", error);
    return { success: false, error: "Failed to resolve incident" };
  }
}
