import { db } from "@/lib/db";
import { registrations, events } from "@/lib/schema";
import { eq } from "drizzle-orm";

export class RegistrationService {
  async create(data: {
    userId: string;
    childId: string;
    sessionId: string;
    amountPaid?: string;
  }) {
    return db.transaction(async (tx) => {
      // Create registration
      const [registration] = await tx
        .insert(registrations)
        .values({
          ...data,
          status: "pending",
        })
        .returning();

      // Log event
      await tx.insert(events).values({
        streamId: `registration-${registration.id}`,
        eventType: "RegistrationCreated",
        eventData: registration as unknown as Record<string, unknown>,
        version: 1,
        userId: data.userId,
      });

      return registration;
    });
  }

  async cancel(registrationId: string, userId: string) {
    return db.transaction(async (tx) => {
      // Update registration
      const [registration] = await tx
        .update(registrations)
        .set({ status: "canceled" })
        .where(eq(registrations.id, registrationId))
        .returning();

      // Log event
      await tx.insert(events).values({
        streamId: `registration-${registrationId}`,
        eventType: "RegistrationCanceled",
        eventData: { registrationId, canceledBy: userId },
        version: 2,
        userId,
      });

      return registration;
    });
  }

  async getByUser(userId: string) {
    return db.query.registrations.findMany({
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

  async getBySession(sessionId: string) {
    return db.query.registrations.findMany({
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

  async confirmPayment(registrationId: string, amountPaid: string) {
    return db.transaction(async (tx) => {
      const [registration] = await tx
        .update(registrations)
        .set({
          status: "confirmed",
          amountPaid,
        })
        .where(eq(registrations.id, registrationId))
        .returning();

      await tx.insert(events).values({
        streamId: `registration-${registrationId}`,
        eventType: "PaymentCompleted",
        eventData: { registrationId, amount: amountPaid },
        version: 3,
        userId: registration.userId,
      });

      return registration;
    });
  }
}

export const registrationService = new RegistrationService();
