"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { waitlist, sessions, registrations, children } from "@/lib/schema";
import { eq, and, sql } from "drizzle-orm";
import {
  joinWaitlistSchema,
  leaveWaitlistSchema,
  getWaitlistPositionSchema,
  promoteFromWaitlistSchema,
  type JoinWaitlistInput,
  type LeaveWaitlistInput,
  type GetWaitlistPositionInput,
  type PromoteFromWaitlistInput,
} from "@/lib/validations/waitlist";

/**
 * Add a child to the waitlist for a full session
 */
export async function joinWaitlistAction(data: JoinWaitlistInput) {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = joinWaitlistSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    // Verify child belongs to user
    const child = await db.query.children.findFirst({
      where: and(
        eq(children.id, parsed.data.childId),
        eq(children.userId, session.user.id)
      ),
    });

    if (!child) {
      return { success: false, error: "Child not found" };
    }

    // Verify session exists and is open
    const campSession = await db.query.sessions.findFirst({
      where: eq(sessions.id, parsed.data.sessionId),
    });

    if (!campSession) {
      return { success: false, error: "Session not found" };
    }

    if (campSession.status !== "open") {
      return { success: false, error: "Session is not open for registration" };
    }

    // Check if already registered
    const existingRegistration = await db.query.registrations.findFirst({
      where: and(
        eq(registrations.sessionId, parsed.data.sessionId),
        eq(registrations.childId, parsed.data.childId)
      ),
    });

    if (existingRegistration) {
      return { success: false, error: "Already registered for this session" };
    }

    // Check if already on waitlist
    const existingWaitlist = await db.query.waitlist.findFirst({
      where: and(
        eq(waitlist.sessionId, parsed.data.sessionId),
        eq(waitlist.childId, parsed.data.childId)
      ),
    });

    if (existingWaitlist) {
      return { success: false, error: "Already on waitlist for this session" };
    }

    // Get the next position number for this session
    const maxPositionResult = await db
      .select({ maxPosition: sql<number>`COALESCE(MAX(${waitlist.position}), 0)` })
      .from(waitlist)
      .where(eq(waitlist.sessionId, parsed.data.sessionId));

    const nextPosition = (maxPositionResult[0]?.maxPosition ?? 0) + 1;

    // Add to waitlist
    const [newWaitlistEntry] = await db
      .insert(waitlist)
      .values({
        sessionId: parsed.data.sessionId,
        childId: parsed.data.childId,
        userId: session.user.id,
        position: nextPosition,
        status: "waiting",
      })
      .returning();

    revalidatePath("/dashboard/parent");

    return {
      success: true,
      waitlistEntry: newWaitlistEntry,
      position: nextPosition,
    };
  } catch (error) {
    console.error("Failed to join waitlist:", error);
    return { success: false, error: "Failed to join waitlist" };
  }
}

/**
 * Remove a child from the waitlist
 */
export async function leaveWaitlistAction(data: LeaveWaitlistInput) {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = leaveWaitlistSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    // Verify waitlist entry belongs to user
    const waitlistEntry = await db.query.waitlist.findFirst({
      where: and(
        eq(waitlist.id, parsed.data.waitlistId),
        eq(waitlist.userId, session.user.id)
      ),
    });

    if (!waitlistEntry) {
      return { success: false, error: "Waitlist entry not found" };
    }

    // Delete the entry
    await db.delete(waitlist).where(eq(waitlist.id, parsed.data.waitlistId));

    // Reorder positions for remaining entries in the same session
    await db.execute(sql`
      UPDATE ${waitlist}
      SET ${waitlist.position} = ${waitlist.position} - 1
      WHERE ${waitlist.sessionId} = ${waitlistEntry.sessionId}
        AND ${waitlist.position} > ${waitlistEntry.position}
        AND ${waitlist.status} = 'waiting'
    `);

    revalidatePath("/dashboard/parent");

    return { success: true };
  } catch (error) {
    console.error("Failed to leave waitlist:", error);
    return { success: false, error: "Failed to leave waitlist" };
  }
}

/**
 * Get the waitlist position for a child in a session
 */
export async function getWaitlistPositionAction(data: GetWaitlistPositionInput) {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = getWaitlistPositionSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const waitlistEntry = await db.query.waitlist.findFirst({
      where: and(
        eq(waitlist.sessionId, parsed.data.sessionId),
        eq(waitlist.childId, parsed.data.childId),
        eq(waitlist.userId, session.user.id)
      ),
    });

    if (!waitlistEntry) {
      return { success: false, error: "Not on waitlist" };
    }

    return {
      success: true,
      position: waitlistEntry.position,
      status: waitlistEntry.status,
      waitlistId: waitlistEntry.id,
    };
  } catch (error) {
    console.error("Failed to get waitlist position:", error);
    return { success: false, error: "Failed to get waitlist position" };
  }
}

/**
 * Admin action: Promote the first person on the waitlist to offered status
 * This gives them a time-limited opportunity to register
 */
export async function promoteFromWaitlistAction(data: PromoteFromWaitlistInput) {
  const session = await getSession();

  if (!session?.user || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = promoteFromWaitlistSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    // Get the waitlist entry
    const waitlistEntry = await db.query.waitlist.findFirst({
      where: eq(waitlist.id, parsed.data.waitlistId),
      with: {
        child: true,
        user: true,
        session: true,
      },
    });

    if (!waitlistEntry) {
      return { success: false, error: "Waitlist entry not found" };
    }

    if (waitlistEntry.status !== "waiting") {
      return {
        success: false,
        error: "This waitlist entry is not in waiting status",
      };
    }

    // Calculate expiration time (default 48 hours)
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + parsed.data.expirationHours * 60 * 60 * 1000
    );

    // Update status to offered
    const [updated] = await db
      .update(waitlist)
      .set({
        status: "offered",
        offeredAt: now,
        expiresAt: expiresAt,
      })
      .where(eq(waitlist.id, parsed.data.waitlistId))
      .returning();

    revalidatePath("/dashboard/admin/programs");
    revalidatePath("/dashboard/parent");

    // TODO: Send email notification to parent about the offer
    // This would be implemented in a future iteration

    return {
      success: true,
      waitlistEntry: updated,
      expiresAt: expiresAt,
    };
  } catch (error) {
    console.error("Failed to promote from waitlist:", error);
    return { success: false, error: "Failed to promote from waitlist" };
  }
}
