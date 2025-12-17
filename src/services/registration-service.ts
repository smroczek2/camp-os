import type { TenantTransaction } from "@/lib/db/tenant-context";
import { registrations, events } from "@/lib/schema";
import { eq } from "drizzle-orm";

/**
 * Registration Service
 *
 * Note: All methods now accept a transaction object from withOrganizationContext
 * to ensure RLS context is maintained and operations are atomic.
 */
export class RegistrationService {
  /**
   * Create a new registration
   *
   * Note: This method should be called within withOrganizationContext
   */
  async create(
    data: {
      userId: string;
      childId: string;
      sessionId: string;
      amountPaid?: string;
    },
    organizationId: string,
    tx?: TenantTransaction
  ) {
    // If no transaction provided, throw error (must use withOrganizationContext)
    if (!tx) {
      throw new Error(
        "RegistrationService.create must be called within withOrganizationContext"
      );
    }

    // Create registration
    const [registration] = await tx
      .insert(registrations)
      .values({
        organizationId,
        userId: data.userId,
        childId: data.childId,
        sessionId: data.sessionId,
        amountPaid: data.amountPaid,
        status: "pending",
      })
      .returning();

    // Log event
    await tx.insert(events).values({
      organizationId,
      streamId: `registration-${registration.id}`,
      eventType: "RegistrationCreated",
      eventData: registration as unknown as Record<string, unknown>,
      version: 1,
      userId: data.userId,
    });

    return registration;
  }

  /**
   * Cancel a registration
   *
   * Note: This method should be called within withOrganizationContext
   */
  async cancel(
    registrationId: string,
    userId: string,
    organizationId: string,
    tx?: TenantTransaction
  ) {
    if (!tx) {
      throw new Error(
        "RegistrationService.cancel must be called within withOrganizationContext"
      );
    }

    // Update registration
    const [registration] = await tx
      .update(registrations)
      .set({ status: "canceled" })
      .where(eq(registrations.id, registrationId))
      .returning();

    // Log event
    await tx.insert(events).values({
      organizationId,
      streamId: `registration-${registrationId}`,
      eventType: "RegistrationCanceled",
      eventData: { registrationId, canceledBy: userId },
      version: 2,
      userId,
    });

    return registration;
  }

  /**
   * Get registrations by user
   *
   * Note: This method should be called within withOrganizationContext
   */
  async getByUser(userId: string, tx: TenantTransaction) {
    return tx.query.registrations.findMany({
      where: eq(registrations.userId, userId),
      with: {
        child: true,
        session: {
          with: {
            camp: true,
          },
        },
      },
    });
  }

  /**
   * Get registrations by session
   *
   * Note: This method should be called within withOrganizationContext
   */
  async getBySession(sessionId: string, tx: TenantTransaction) {
    return tx.query.registrations.findMany({
      where: eq(registrations.sessionId, sessionId),
      with: {
        child: true,
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Confirm payment for a registration
   *
   * Note: This method should be called within withOrganizationContext
   */
  async confirmPayment(
    registrationId: string,
    amountPaid: string,
    organizationId: string,
    tx?: TenantTransaction
  ) {
    if (!tx) {
      throw new Error(
        "RegistrationService.confirmPayment must be called within withOrganizationContext"
      );
    }

    const [registration] = await tx
      .update(registrations)
      .set({
        status: "confirmed",
        amountPaid,
      })
      .where(eq(registrations.id, registrationId))
      .returning();

    await tx.insert(events).values({
      organizationId,
      streamId: `registration-${registrationId}`,
      eventType: "PaymentCompleted",
      eventData: { registrationId, amount: amountPaid },
      version: 3,
      userId: registration.userId,
    });

    return registration;
  }
}

export const registrationService = new RegistrationService();
