"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { user, children, registrations, events, accountContacts, payments, charges } from "@/lib/schema";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";
import { isAdmin } from "@/lib/rbac";
import { z } from "zod";

// ============================================================================
// Types
// ============================================================================

export type AccountDetails = {
  user: typeof user.$inferSelect;
  children: Array<typeof children.$inferSelect & {
    medicalAlerts: string[];
  }>;
  balance: {
    totalCharges: number;
    totalPayments: number;
    balance: number;
  };
  recentActivity: Array<typeof events.$inferSelect>;
};

export type BalanceResult = {
  totalCharges: number;
  totalPayments: number;
  balance: number;
};

// ============================================================================
// Core Data Fetching Actions
// ============================================================================

/**
 * Fetch complete account details including user, children, balance, and recent activity
 *
 * @param accountId - User ID to fetch account details for
 * @returns Account details or error
 */
export async function getAccountDetailsAction(accountId: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Unauthorized", data: null };
    }

    // Enforce admin permission
    const hasAdminAccess = await isAdmin(session.user.id);
    if (!hasAdminAccess) {
      return {
        success: false,
        error: "Admin permission required to view account details",
        data: null
      };
    }

    // Fetch user data
    const userRecord = await db.query.user.findFirst({
      where: eq(user.id, accountId),
    });

    if (!userRecord) {
      return { success: false, error: "Account not found", data: null };
    }

    // Fetch children with medical alerts
    const userChildren = await db.query.children.findMany({
      where: eq(children.userId, accountId),
    });

    // Transform children data to include medical alerts
    const childrenWithAlerts = userChildren.map((child) => ({
      ...child,
      medicalAlerts: [
        ...(child.allergies || []),
        ...(child.medicalNotes ? ["Medical notes on file"] : []),
      ].filter(Boolean),
    }));

    // Calculate balance (currently from registrations, will use charges/payments tables when available)
    const balance = await calculateBalanceAction(accountId);

    // Fetch recent activity (last 5 events)
    const recentActivity = await db.query.events.findMany({
      where: eq(events.userId, accountId),
      orderBy: [desc(events.timestamp)],
      limit: 5,
    });

    const accountDetails: AccountDetails = {
      user: userRecord,
      children: childrenWithAlerts,
      balance: balance.data || { totalCharges: 0, totalPayments: 0, balance: 0 },
      recentActivity,
    };

    return { success: true, data: accountDetails };
  } catch (error) {
    console.error("Failed to fetch account details:", error);
    return {
      success: false,
      error: "Failed to fetch account details",
      data: null
    };
  }
}

/**
 * Calculate account balance on-demand
 *
 * Currently uses registrations.amountPaid field.
 * Will be updated to use charges and payments tables when they are added to schema.
 *
 * @param accountId - User ID to calculate balance for
 * @returns Balance breakdown (totalCharges, totalPayments, balance)
 */
export async function calculateBalanceAction(accountId: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Unauthorized", data: null };
    }

    // Enforce admin permission
    const hasAdminAccess = await isAdmin(session.user.id);
    if (!hasAdminAccess) {
      return {
        success: false,
        error: "Admin permission required to calculate balance",
        data: null
      };
    }

    // TODO: Update this when charges and payments tables are added to schema
    // For now, calculate from registrations table

    // Get all registrations for this account
    const userRegistrations = await db.query.registrations.findMany({
      where: eq(registrations.userId, accountId),
      with: {
        session: true,
      },
    });

    // Calculate charges (session prices for confirmed registrations)
    const totalCharges = userRegistrations
      .filter((reg) => reg.status === "confirmed" || reg.status === "pending")
      .reduce((sum, reg) => {
        const price = parseFloat(reg.session.price);
        return sum + (isNaN(price) ? 0 : price);
      }, 0);

    // Calculate payments (amountPaid from registrations)
    const totalPayments = userRegistrations
      .reduce((sum, reg) => {
        const paid = parseFloat(reg.amountPaid || "0");
        return sum + (isNaN(paid) ? 0 : paid);
      }, 0);

    // Calculate balance (positive = owed to camp, negative = credit)
    const balance = totalCharges - totalPayments;

    const result: BalanceResult = {
      totalCharges,
      totalPayments,
      balance,
    };

    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to calculate balance:", error);
    return {
      success: false,
      error: "Failed to calculate balance",
      data: null
    };
  }
}

// ============================================================================
// Finance Schemas
// ============================================================================

const recordPaymentSchema = z.object({
  accountId: z.string().min(1, "Account ID is required"),
  amount: z.number().positive("Amount must be positive"),
  paymentMethod: z.enum(["cash", "check", "card", "stripe"]),
  referenceNumber: z.string().optional(),
  description: z.string().optional(),
});

const addChargeSchema = z.object({
  accountId: z.string().min(1, "Account ID is required"),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().min(1, "Description is required"),
  chargeType: z.enum([
    "registration",
    "late_fee",
    "equipment",
    "field_trip",
    "misc",
  ]),
  registrationId: z.string().uuid().optional(),
});

const issueRefundSchema = z.object({
  paymentId: z.string().min(1, "Payment ID is required"),
  amount: z.number().positive("Refund amount must be positive"),
  reason: z.string().min(1, "Reason is required"),
});

// ============================================================================
// Finance Actions
// ============================================================================

/**
 * Get account finance data - payments and charges combined
 * Returns transactions sorted by date, with pagination support
 */
export async function getAccountFinanceAction(
  accountId: string,
  options?: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
  }
) {
  const session = await getSession();

  if (!session?.user || !["admin", "staff"].includes(session.user.role)) {
    return {
      success: false,
      error: "Unauthorized",
      transactions: [],
      summary: null,
    };
  }

  try {
    // Verify account exists
    const account = await db.query.user.findFirst({
      where: eq(user.id, accountId),
    });

    if (!account) {
      return {
        success: false,
        error: "Account not found",
        transactions: [],
        summary: null,
      };
    }

    // Build date filters
    const dateFilters = [];
    if (options?.startDate) {
      dateFilters.push(gte(payments.processedAt, options.startDate));
    }
    if (options?.endDate) {
      dateFilters.push(lte(payments.processedAt, options.endDate));
    }

    // Fetch payments
    const accountPayments = await db.query.payments.findMany({
      where: and(
        eq(payments.accountId, accountId),
        dateFilters.length > 0 ? and(...dateFilters) : undefined
      ),
      orderBy: [desc(payments.processedAt)],
      limit: options?.limit,
      offset: options?.offset,
    });

    // Fetch charges
    const accountCharges = await db.query.charges.findMany({
      where: eq(charges.accountId, accountId),
      orderBy: [desc(charges.createdAt)],
      limit: options?.limit,
      offset: options?.offset,
    });

    // Combine and sort transactions
    const transactions = [
      ...accountPayments.map((p) => ({
        id: p.id,
        type: "payment" as const,
        date: p.processedAt,
        amount: p.amount,
        description: p.description || `${p.paymentMethod} payment`,
        paymentMethod: p.paymentMethod,
        referenceNumber: p.referenceNumber,
        status: p.status,
        refundedAmount: p.refundedAmount,
        refundReason: p.refundReason,
      })),
      ...accountCharges.map((c) => ({
        id: c.id,
        type: "charge" as const,
        date: c.createdAt,
        amount: c.amount,
        description: c.description,
        chargeType: c.chargeType,
        registrationId: c.registrationId,
      })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    // Calculate summary
    const totalCharges = accountCharges.reduce((sum, c) => sum + c.amount, 0);
    const totalPayments = accountPayments.reduce(
      (sum, p) => sum + p.amount - (p.refundedAmount || 0),
      0
    );
    const balance = totalCharges - totalPayments;

    const summary = {
      totalCharges,
      totalPayments,
      balance,
      paymentCount: accountPayments.length,
      chargeCount: accountCharges.length,
    };

    return {
      success: true,
      transactions: options?.limit
        ? transactions.slice(0, options.limit)
        : transactions,
      summary,
    };
  } catch (error) {
    console.error("Failed to get account finance:", error);
    return {
      success: false,
      error: "Failed to load financial data",
      transactions: [],
      summary: null,
    };
  }
}

/**
 * Record a manual payment (cash, check, card)
 */
export async function recordPaymentAction(data: {
  accountId: string;
  amount: number;
  paymentMethod: "cash" | "check" | "card" | "stripe";
  referenceNumber?: string;
  description?: string;
}) {
  const session = await getSession();

  if (!session?.user || !["admin", "staff"].includes(session.user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = recordPaymentSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0].message,
    };
  }

  try {
    // Verify account exists
    const account = await db.query.user.findFirst({
      where: eq(user.id, parsed.data.accountId),
    });

    if (!account) {
      return { success: false, error: "Account not found" };
    }

    // Convert dollars to cents
    const amountInCents = Math.round(parsed.data.amount * 100);

    // Create payment in transaction
    const result = await db.transaction(async (tx) => {
      // Insert payment
      const [payment] = await tx
        .insert(payments)
        .values({
          accountId: parsed.data.accountId,
          amount: amountInCents,
          paymentMethod: parsed.data.paymentMethod,
          referenceNumber: parsed.data.referenceNumber,
          description: parsed.data.description,
          status: "completed",
          processedBy: session.user.id,
          processedAt: new Date(),
        })
        .returning();

      // Log event
      await tx.insert(events).values({
        streamId: `account-${parsed.data.accountId}`,
        eventType: "PaymentRecorded",
        eventData: {
          paymentId: payment.id,
          amount: amountInCents,
          paymentMethod: parsed.data.paymentMethod,
          referenceNumber: parsed.data.referenceNumber,
        },
        version: 1,
        userId: session.user.id,
      });

      return payment;
    });

    revalidatePath(`/dashboard/admin/accounts/${parsed.data.accountId}`);
    revalidatePath(`/dashboard/admin/accounts/${parsed.data.accountId}/finance`);

    return { success: true, payment: result };
  } catch (error) {
    console.error("Failed to record payment:", error);
    return { success: false, error: "Failed to record payment" };
  }
}

/**
 * Add a charge to an account
 */
export async function addChargeAction(data: {
  accountId: string;
  amount: number;
  description: string;
  chargeType: "registration" | "late_fee" | "equipment" | "field_trip" | "misc";
  registrationId?: string;
}) {
  const session = await getSession();

  if (!session?.user || !["admin", "staff"].includes(session.user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = addChargeSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0].message,
    };
  }

  try {
    // Verify account exists
    const account = await db.query.user.findFirst({
      where: eq(user.id, parsed.data.accountId),
    });

    if (!account) {
      return { success: false, error: "Account not found" };
    }

    // Convert dollars to cents
    const amountInCents = Math.round(parsed.data.amount * 100);

    // Create charge in transaction
    const result = await db.transaction(async (tx) => {
      // Insert charge
      const [charge] = await tx
        .insert(charges)
        .values({
          accountId: parsed.data.accountId,
          amount: amountInCents,
          description: parsed.data.description,
          chargeType: parsed.data.chargeType,
          registrationId: parsed.data.registrationId,
          createdBy: session.user.id,
        })
        .returning();

      // Log event
      await tx.insert(events).values({
        streamId: `account-${parsed.data.accountId}`,
        eventType: "ChargeAdded",
        eventData: {
          chargeId: charge.id,
          amount: amountInCents,
          chargeType: parsed.data.chargeType,
          description: parsed.data.description,
        },
        version: 1,
        userId: session.user.id,
      });

      return charge;
    });

    revalidatePath(`/dashboard/admin/accounts/${parsed.data.accountId}`);
    revalidatePath(`/dashboard/admin/accounts/${parsed.data.accountId}/finance`);

    return { success: true, charge: result };
  } catch (error) {
    console.error("Failed to add charge:", error);
    return { success: false, error: "Failed to add charge" };
  }
}

/**
 * Issue a refund for a payment
 */
export async function issueRefundAction(data: {
  paymentId: string;
  amount: number;
  reason: string;
}) {
  const session = await getSession();

  if (!session?.user || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized - Admin only" };
  }

  const parsed = issueRefundSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0].message,
    };
  }

  try {
    // Get payment
    const payment = await db.query.payments.findFirst({
      where: eq(payments.id, parsed.data.paymentId),
    });

    if (!payment) {
      return { success: false, error: "Payment not found" };
    }

    // Convert dollars to cents
    const refundAmountInCents = Math.round(parsed.data.amount * 100);

    // Check refund amount doesn't exceed payment
    const currentRefunded = payment.refundedAmount || 0;
    const totalRefunded = currentRefunded + refundAmountInCents;

    if (totalRefunded > payment.amount) {
      return {
        success: false,
        error: "Refund amount exceeds payment amount",
      };
    }

    // Update payment with refund
    const result = await db.transaction(async (tx) => {
      const [updatedPayment] = await tx
        .update(payments)
        .set({
          refundedAmount: totalRefunded,
          refundReason: parsed.data.reason,
          status: totalRefunded === payment.amount ? "refunded" : "completed",
        })
        .where(eq(payments.id, parsed.data.paymentId))
        .returning();

      // Log event
      await tx.insert(events).values({
        streamId: `account-${payment.accountId}`,
        eventType: "RefundIssued",
        eventData: {
          paymentId: payment.id,
          refundAmount: refundAmountInCents,
          totalRefunded,
          reason: parsed.data.reason,
        },
        version: 1,
        userId: session.user.id,
      });

      return updatedPayment;
    });

    revalidatePath(`/dashboard/admin/accounts/${payment.accountId}`);
    revalidatePath(`/dashboard/admin/accounts/${payment.accountId}/finance`);

    return { success: true, payment: result };
  } catch (error) {
    console.error("Failed to issue refund:", error);
    return { success: false, error: "Failed to issue refund" };
  }
}

/**
 * Get account activity/audit log
 *
 * @param accountId - User ID to fetch activity for
 * @param filters - Optional filters (limit, offset, eventType, dateFrom, dateTo)
 * @returns Activity log events with total count
 */
export async function getAccountActivityAction(
  accountId: string,
  filters?: {
    limit?: number;
    offset?: number;
    eventType?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }
) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Unauthorized", data: [], total: 0 };
    }

    const hasAdminAccess = await isAdmin(session.user.id);
    if (!hasAdminAccess) {
      return {
        success: false,
        error: "Admin permission required",
        data: [],
        total: 0
      };
    }

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    // Build where conditions
    const whereConditions = [eq(events.userId, accountId)];

    if (filters?.eventType) {
      whereConditions.push(eq(events.eventType, filters.eventType));
    }

    if (filters?.dateFrom) {
      whereConditions.push(gte(events.timestamp, filters.dateFrom));
    }

    if (filters?.dateTo) {
      whereConditions.push(lte(events.timestamp, filters.dateTo));
    }

    // Fetch activity log with filters
    const activityLog = await db
      .select()
      .from(events)
      .where(and(...whereConditions))
      .orderBy(desc(events.timestamp))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(events)
      .where(and(...whereConditions));

    const total = Number(totalResult[0]?.count || 0);

    return { success: true, data: activityLog, total };
  } catch (error) {
    console.error("Failed to fetch account activity:", error);
    return {
      success: false,
      error: "Failed to fetch account activity",
      data: [],
      total: 0
    };
  }
}

/**
 * Get account reservations (registrations with session details)
 *
 * @param accountId - User ID to fetch reservations for
 * @returns Registrations with session and child details
 */
export async function getAccountReservationsAction(accountId: string) {
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

    const userRegistrations = await db.query.registrations.findMany({
      where: eq(registrations.userId, accountId),
      with: {
        child: true,
        session: true,
      },
      orderBy: [desc(registrations.createdAt)],
    });

    return { success: true, data: userRegistrations };
  } catch (error) {
    console.error("Failed to fetch account reservations:", error);
    return {
      success: false,
      error: "Failed to fetch account reservations",
      data: []
    };
  }
}

// ============================================================================
// Contact Management Actions
// ============================================================================

/**
 * Add a contact to an account
 *
 * @param accountId - User ID to add contact for
 * @param contactData - Contact details
 * @returns Success/error result with created contact
 */
export async function addAccountContactAction(
  accountId: string,
  contactData: {
    firstName: string;
    lastName: string;
    relationship: string;
    phone: string;
    email?: string;
    isPrimary?: boolean;
    receivesBilling?: boolean;
    receivesUpdates?: boolean;
    notes?: string;
  }
) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const hasAdminAccess = await isAdmin(session.user.id);
    if (!hasAdminAccess) {
      return { success: false, error: "Admin permission required" };
    }

    // If this contact is marked as primary, unset other primary contacts first
    if (contactData.isPrimary) {
      await db
        .update(accountContacts)
        .set({ isPrimary: false })
        .where(eq(accountContacts.accountId, accountId));
    }

    // Create the contact
    const [contact] = await db
      .insert(accountContacts)
      .values({
        accountId,
        firstName: contactData.firstName,
        lastName: contactData.lastName,
        relationship: contactData.relationship,
        phone: contactData.phone,
        email: contactData.email,
        isPrimary: contactData.isPrimary || false,
        receivesBilling: contactData.receivesBilling ?? false,
        receivesUpdates: contactData.receivesUpdates ?? true,
        notes: contactData.notes,
      })
      .returning();

    // Log to events
    await db.insert(events).values({
      streamId: `account-${accountId}`,
      eventType: "AccountContactAdded",
      eventData: {
        contactId: contact.id,
        contactName: `${contactData.firstName} ${contactData.lastName}`,
        relationship: contactData.relationship,
        isPrimary: contactData.isPrimary,
      },
      version: 1,
      userId: session.user.id,
    });

    revalidatePath(`/dashboard/admin/accounts/${accountId}`);
    return { success: true, data: contact };
  } catch (error) {
    console.error("Failed to add account contact:", error);
    return {
      success: false,
      error: "Failed to add account contact"
    };
  }
}

/**
 * Update an account contact
 *
 * @param contactId - Contact ID to update
 * @param contactData - Updated contact details
 * @returns Success/error result with updated contact
 */
export async function updateAccountContactAction(
  contactId: string,
  contactData: {
    firstName?: string;
    lastName?: string;
    relationship?: string;
    phone?: string;
    email?: string;
    isPrimary?: boolean;
    receivesBilling?: boolean;
    receivesUpdates?: boolean;
    notes?: string;
  }
) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const hasAdminAccess = await isAdmin(session.user.id);
    if (!hasAdminAccess) {
      return { success: false, error: "Admin permission required" };
    }

    // Get existing contact to find accountId
    const existingContact = await db.query.accountContacts.findFirst({
      where: eq(accountContacts.id, contactId),
    });

    if (!existingContact) {
      return { success: false, error: "Contact not found" };
    }

    // If setting as primary, unset other primary contacts first
    if (contactData.isPrimary) {
      await db
        .update(accountContacts)
        .set({ isPrimary: false })
        .where(
          and(
            eq(accountContacts.accountId, existingContact.accountId),
            sql`${accountContacts.id} != ${contactId}`
          )
        );
    }

    // Update the contact
    const [updatedContact] = await db
      .update(accountContacts)
      .set({
        ...contactData,
        updatedAt: new Date(),
      })
      .where(eq(accountContacts.id, contactId))
      .returning();

    // Log to events
    await db.insert(events).values({
      streamId: `account-${existingContact.accountId}`,
      eventType: "AccountContactUpdated",
      eventData: {
        contactId,
        contactName: `${updatedContact.firstName} ${updatedContact.lastName}`,
        changes: contactData,
      },
      version: 1,
      userId: session.user.id,
    });

    revalidatePath(`/dashboard/admin/accounts/${existingContact.accountId}`);
    return { success: true, data: updatedContact };
  } catch (error) {
    console.error("Failed to update account contact:", error);
    return {
      success: false,
      error: "Failed to update account contact"
    };
  }
}

/**
 * Remove an account contact
 *
 * @param contactId - Contact ID to remove
 * @returns Success/error result
 */
export async function removeAccountContactAction(contactId: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const hasAdminAccess = await isAdmin(session.user.id);
    if (!hasAdminAccess) {
      return { success: false, error: "Admin permission required" };
    }

    // Get existing contact to find accountId and check if it's the last contact
    const existingContact = await db.query.accountContacts.findFirst({
      where: eq(accountContacts.id, contactId),
    });

    if (!existingContact) {
      return { success: false, error: "Contact not found" };
    }

    // Check if this is the last contact
    const contactCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(accountContacts)
      .where(eq(accountContacts.accountId, existingContact.accountId));

    if (contactCount[0]?.count <= 1) {
      return {
        success: false,
        error: "Cannot remove the last contact from an account"
      };
    }

    // Delete the contact
    await db
      .delete(accountContacts)
      .where(eq(accountContacts.id, contactId));

    // Log to events
    await db.insert(events).values({
      streamId: `account-${existingContact.accountId}`,
      eventType: "AccountContactRemoved",
      eventData: {
        contactId,
        contactName: `${existingContact.firstName} ${existingContact.lastName}`,
        relationship: existingContact.relationship,
      },
      version: 1,
      userId: session.user.id,
    });

    revalidatePath(`/dashboard/admin/accounts/${existingContact.accountId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to remove account contact:", error);
    return {
      success: false,
      error: "Failed to remove account contact"
    };
  }
}

/**
 * Set a contact as the primary contact
 *
 * @param contactId - Contact ID to set as primary
 * @returns Success/error result with updated contact
 */
export async function setPrimaryContactAction(contactId: string) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const hasAdminAccess = await isAdmin(session.user.id);
    if (!hasAdminAccess) {
      return { success: false, error: "Admin permission required" };
    }

    // Get existing contact to find accountId
    const existingContact = await db.query.accountContacts.findFirst({
      where: eq(accountContacts.id, contactId),
    });

    if (!existingContact) {
      return { success: false, error: "Contact not found" };
    }

    // Unset all other primary contacts for this account
    await db
      .update(accountContacts)
      .set({ isPrimary: false })
      .where(eq(accountContacts.accountId, existingContact.accountId));

    // Set this contact as primary
    const [updatedContact] = await db
      .update(accountContacts)
      .set({
        isPrimary: true,
        updatedAt: new Date(),
      })
      .where(eq(accountContacts.id, contactId))
      .returning();

    // Log to events
    await db.insert(events).values({
      streamId: `account-${existingContact.accountId}`,
      eventType: "PrimaryContactChanged",
      eventData: {
        contactId,
        contactName: `${updatedContact.firstName} ${updatedContact.lastName}`,
      },
      version: 1,
      userId: session.user.id,
    });

    revalidatePath(`/dashboard/admin/accounts/${existingContact.accountId}`);
    return { success: true, data: updatedContact };
  } catch (error) {
    console.error("Failed to set primary contact:", error);
    return {
      success: false,
      error: "Failed to set primary contact"
    };
  }
}

/**
 * Get all contacts for an account
 *
 * @param accountId - User ID to fetch contacts for
 * @returns Account contacts
 */
export async function getAccountContactsAction(accountId: string) {
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

    const contacts = await db.query.accountContacts.findMany({
      where: eq(accountContacts.accountId, accountId),
      orderBy: [desc(accountContacts.isPrimary), accountContacts.firstName],
    });

    return { success: true, data: contacts };
  } catch (error) {
    console.error("Failed to fetch account contacts:", error);
    return {
      success: false,
      error: "Failed to fetch account contacts",
      data: []
    };
  }
}

// ============================================================================
// Statement Export Action
// ============================================================================

/**
 * Generate account statement (PDF export)
 *
 * @param accountId - User ID to generate statement for
 * @param dateRange - Optional date range for transactions
 * @returns Success/error result with statement data
 */
export async function generateAccountStatementAction(
  accountId: string,
  dateRange?: {
    startDate: Date;
    endDate: Date;
  }
) {
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

    // Fetch account details
    const accountDetails = await getAccountDetailsAction(accountId);
    if (!accountDetails.success || !accountDetails.data) {
      return {
        success: false,
        error: "Failed to fetch account details",
        data: null
      };
    }

    // Fetch reservations
    const reservations = await getAccountReservationsAction(accountId);
    if (!reservations.success) {
      return {
        success: false,
        error: "Failed to fetch reservations",
        data: null
      };
    }

    // Fetch contacts
    const contacts = await getAccountContactsAction(accountId);

    // Return statement data (PDF generation can be done client-side or with a library)
    const statementData = {
      account: accountDetails.data.user,
      balance: accountDetails.data.balance,
      children: accountDetails.data.children,
      contacts: contacts.data || [],
      reservations: reservations.data || [],
      generatedAt: new Date(),
      generatedBy: session.user.name,
      dateRange,
    };

    // Log to events
    await db.insert(events).values({
      streamId: `account-${accountId}`,
      eventType: "AccountStatementGenerated",
      eventData: {
        accountId,
        dateRange,
        generatedBy: session.user.id,
      },
      version: 1,
      userId: session.user.id,
    });

    return { success: true, data: statementData };
  } catch (error) {
    console.error("Failed to generate account statement:", error);
    return {
      success: false,
      error: "Failed to generate account statement",
      data: null
    };
  }
}
