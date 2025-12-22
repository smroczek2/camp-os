"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { emergencyContacts, children } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Validation schemas
const createEmergencyContactSchema = z.object({
  childId: z.string().uuid("Invalid child ID"),
  name: z.string().min(1, "Name is required").max(100),
  relationship: z.string().min(1, "Relationship is required").max(50),
  phone: z.string().min(10, "Phone must be at least 10 digits").max(20),
  email: z.string().email("Invalid email").optional().nullable(),
  priority: z.number().int().min(1).max(10).optional().default(1),
  isAuthorizedPickup: z.boolean().optional().default(false),
  notes: z.string().max(500).optional().nullable(),
});

const updateEmergencyContactSchema = z.object({
  id: z.string().uuid("Invalid contact ID"),
  name: z.string().min(1).max(100).optional(),
  relationship: z.string().min(1).max(50).optional(),
  phone: z.string().min(10).max(20).optional(),
  email: z.string().email().optional().nullable(),
  priority: z.number().int().min(1).max(10).optional(),
  isAuthorizedPickup: z.boolean().optional(),
  notes: z.string().max(500).optional().nullable(),
});

const deleteEmergencyContactSchema = z.object({
  id: z.string().uuid("Invalid contact ID"),
});

/**
 * Create a new emergency contact for a child
 */
export async function createEmergencyContactAction(
  data: z.infer<typeof createEmergencyContactSchema>
) {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = createEmergencyContactSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    // Verify the user owns this child
    const child = await db.query.children.findFirst({
      where: eq(children.id, parsed.data.childId),
    });

    if (!child) {
      return { success: false, error: "Child not found" };
    }

    // Parents can only add contacts to their own children
    // Admins can add contacts to any child
    if (session.user.role !== "admin" && child.userId !== session.user.id) {
      return { success: false, error: "You can only add contacts to your own children" };
    }

    const [contact] = await db
      .insert(emergencyContacts)
      .values({
        childId: parsed.data.childId,
        name: parsed.data.name,
        relationship: parsed.data.relationship,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        priority: parsed.data.priority,
        isAuthorizedPickup: parsed.data.isAuthorizedPickup,
        notes: parsed.data.notes || null,
      })
      .returning();

    revalidatePath("/dashboard/parent");
    revalidatePath("/dashboard/admin");

    return { success: true, contact };
  } catch (error) {
    console.error("Failed to create emergency contact:", error);
    return { success: false, error: "Failed to create emergency contact" };
  }
}

/**
 * Update an emergency contact
 */
export async function updateEmergencyContactAction(
  data: z.infer<typeof updateEmergencyContactSchema>
) {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = updateEmergencyContactSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    // Get the contact to verify ownership
    const existingContact = await db.query.emergencyContacts.findFirst({
      where: eq(emergencyContacts.id, parsed.data.id),
      with: {
        child: true,
      },
    });

    if (!existingContact) {
      return { success: false, error: "Contact not found" };
    }

    // Parents can only update contacts for their own children
    if (
      session.user.role !== "admin" &&
      existingContact.child.userId !== session.user.id
    ) {
      return { success: false, error: "You can only update your own contacts" };
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof emergencyContacts.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.relationship !== undefined) updateData.relationship = parsed.data.relationship;
    if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone;
    if (parsed.data.email !== undefined) updateData.email = parsed.data.email;
    if (parsed.data.priority !== undefined) updateData.priority = parsed.data.priority;
    if (parsed.data.isAuthorizedPickup !== undefined) updateData.isAuthorizedPickup = parsed.data.isAuthorizedPickup;
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;

    const [updated] = await db
      .update(emergencyContacts)
      .set(updateData)
      .where(eq(emergencyContacts.id, parsed.data.id))
      .returning();

    revalidatePath("/dashboard/parent");
    revalidatePath("/dashboard/admin");

    return { success: true, contact: updated };
  } catch (error) {
    console.error("Failed to update emergency contact:", error);
    return { success: false, error: "Failed to update emergency contact" };
  }
}

/**
 * Delete an emergency contact
 */
export async function deleteEmergencyContactAction(
  data: z.infer<typeof deleteEmergencyContactSchema>
) {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = deleteEmergencyContactSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    // Get the contact to verify ownership
    const existingContact = await db.query.emergencyContacts.findFirst({
      where: eq(emergencyContacts.id, parsed.data.id),
      with: {
        child: true,
      },
    });

    if (!existingContact) {
      return { success: false, error: "Contact not found" };
    }

    // Parents can only delete contacts for their own children
    if (
      session.user.role !== "admin" &&
      existingContact.child.userId !== session.user.id
    ) {
      return { success: false, error: "You can only delete your own contacts" };
    }

    await db
      .delete(emergencyContacts)
      .where(eq(emergencyContacts.id, parsed.data.id));

    revalidatePath("/dashboard/parent");
    revalidatePath("/dashboard/admin");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete emergency contact:", error);
    return { success: false, error: "Failed to delete emergency contact" };
  }
}

/**
 * Get emergency contacts for a child (for staff/admin view)
 */
export async function getEmergencyContactsForChild(childId: string) {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: "Unauthorized", contacts: [] };
  }

  try {
    // Verify access to this child
    const child = await db.query.children.findFirst({
      where: eq(children.id, childId),
    });

    if (!child) {
      return { success: false, error: "Child not found", contacts: [] };
    }

    // Parents can only view contacts for their own children
    // Staff and admins can view any child's contacts
    if (
      session.user.role === "parent" &&
      child.userId !== session.user.id
    ) {
      return { success: false, error: "Access denied", contacts: [] };
    }

    const contacts = await db.query.emergencyContacts.findMany({
      where: eq(emergencyContacts.childId, childId),
      orderBy: (contacts, { asc }) => [asc(contacts.priority)],
    });

    return { success: true, contacts };
  } catch (error) {
    console.error("Failed to get emergency contacts:", error);
    return { success: false, error: "Failed to get contacts", contacts: [] };
  }
}
