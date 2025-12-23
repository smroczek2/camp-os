"use server";

import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { accountNotes, events } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { isAdmin } from "@/lib/rbac";

// ============================================================================
// Account Notes Management
// ============================================================================

/**
 * Get all notes for an account
 *
 * @param accountId - User ID to fetch notes for
 * @returns Account notes or error
 */
export async function getAccountNotesAction(accountId: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Unauthorized", data: [] };
    }

    const hasAdminAccess = await isAdmin(session.user.id);
    if (!hasAdminAccess) {
      return {
        success: false,
        error: "Admin permission required",
        data: []
      };
    }

    const notes = await db.query.accountNotes.findMany({
      where: eq(accountNotes.accountId, accountId),
      orderBy: [desc(accountNotes.createdAt)],
      with: {
        creator: true,
      },
    });

    return { success: true, data: notes };
  } catch (error) {
    console.error("Failed to fetch account notes:", error);
    return {
      success: false,
      error: "Failed to fetch account notes",
      data: []
    };
  }
}

/**
 * Add a note to an account
 *
 * @param accountId - User ID to add note for
 * @param note - Note content
 * @returns Success/error result with created note
 */
export async function addAccountNoteAction(accountId: string, note: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Unauthorized", data: null };
    }

    const hasAdminAccess = await isAdmin(session.user.id);
    if (!hasAdminAccess) {
      return {
        success: false,
        error: "Admin permission required",
        data: null
      };
    }

    // Validate note content
    if (!note || note.trim().length === 0) {
      return {
        success: false,
        error: "Note content cannot be empty",
        data: null
      };
    }

    // Create note and log event in transaction
    const result = await db.transaction(async (tx) => {
      // Create note
      const [createdNote] = await tx
        .insert(accountNotes)
        .values({
          accountId,
          note: note.trim(),
          createdBy: session.user.id,
        })
        .returning();

      // Log event for audit trail
      await tx.insert(events).values({
        streamId: `account-${accountId}`,
        eventType: "AccountNoteAdded",
        eventData: {
          noteId: createdNote.id,
          note: note.trim(),
          createdBy: session.user.id,
        },
        version: 1,
        userId: accountId,
      });

      return createdNote;
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to add account note:", error);
    return {
      success: false,
      error: "Failed to add account note",
      data: null
    };
  }
}

/**
 * Update an existing account note
 *
 * @param noteId - Note ID to update
 * @param note - Updated note content
 * @returns Success/error result
 */
export async function updateAccountNoteAction(noteId: string, note: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const hasAdminAccess = await isAdmin(session.user.id);
    if (!hasAdminAccess) {
      return {
        success: false,
        error: "Admin permission required"
      };
    }

    // Validate note content
    if (!note || note.trim().length === 0) {
      return {
        success: false,
        error: "Note content cannot be empty"
      };
    }

    // Verify note exists and get accountId for event logging
    const existingNote = await db.query.accountNotes.findFirst({
      where: eq(accountNotes.id, noteId),
    });

    if (!existingNote) {
      return {
        success: false,
        error: "Note not found"
      };
    }

    // Update note and log event in transaction
    await db.transaction(async (tx) => {
      // Update note
      await tx
        .update(accountNotes)
        .set({ note: note.trim() })
        .where(eq(accountNotes.id, noteId));

      // Log event for audit trail
      await tx.insert(events).values({
        streamId: `account-${existingNote.accountId}`,
        eventType: "AccountNoteUpdated",
        eventData: {
          noteId,
          oldNote: existingNote.note,
          newNote: note.trim(),
          updatedBy: session.user.id,
        },
        version: 1,
        userId: existingNote.accountId,
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to update account note:", error);
    return {
      success: false,
      error: "Failed to update account note"
    };
  }
}

/**
 * Delete an account note
 *
 * @param noteId - Note ID to delete
 * @returns Success/error result
 */
export async function deleteAccountNoteAction(noteId: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const hasAdminAccess = await isAdmin(session.user.id);
    if (!hasAdminAccess) {
      return {
        success: false,
        error: "Admin permission required"
      };
    }

    // Verify note exists and get accountId for event logging
    const existingNote = await db.query.accountNotes.findFirst({
      where: eq(accountNotes.id, noteId),
    });

    if (!existingNote) {
      return {
        success: false,
        error: "Note not found"
      };
    }

    // Delete note and log event in transaction
    await db.transaction(async (tx) => {
      // Delete note
      await tx
        .delete(accountNotes)
        .where(eq(accountNotes.id, noteId));

      // Log event for audit trail
      await tx.insert(events).values({
        streamId: `account-${existingNote.accountId}`,
        eventType: "AccountNoteDeleted",
        eventData: {
          noteId,
          note: existingNote.note,
          deletedBy: session.user.id,
        },
        version: 1,
        userId: existingNote.accountId,
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete account note:", error);
    return {
      success: false,
      error: "Failed to delete account note"
    };
  }
}
