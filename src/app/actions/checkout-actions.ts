"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { registrations, events } from "@/lib/schema";
import { sendPaymentReceivedEmail } from "@/lib/email/send";
import { eq } from "drizzle-orm";
import { z } from "zod";

const processPaymentSchema = z.object({
  registrationId: z.string().uuid("Invalid registration ID"),
  amount: z.string().min(1, "Amount is required"),
});

/**
 * Process a mock payment for a registration
 *
 * In production, this would integrate with Stripe or another payment processor.
 * For now, this simulates a successful payment by updating the registration status.
 */
export async function processPaymentAction(
  data: z.infer<typeof processPaymentSchema>
) {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = processPaymentSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    // Get the registration to verify ownership
    const registration = await db.query.registrations.findFirst({
      where: eq(registrations.id, parsed.data.registrationId),
      with: {
        session: true,
      },
    });

    if (!registration) {
      return { success: false, error: "Registration not found" };
    }

    // Verify the user owns this registration
    if (registration.userId !== session.user.id) {
      return { success: false, error: "You can only pay for your own registrations" };
    }

    // Check if already paid
    if (registration.status === "confirmed") {
      return { success: false, error: "This registration is already paid" };
    }

    // Verify the amount matches the session price
    if (parsed.data.amount !== registration.session.price) {
      return { success: false, error: "Payment amount mismatch" };
    }

    // Process the mock payment - in production this would call Stripe
    // For mock mode, we simply update the registration status
    const result = await db.transaction(async (tx) => {
      // Update registration to confirmed with payment amount
      const [updatedReg] = await tx
        .update(registrations)
        .set({
          status: "confirmed",
          amountPaid: parsed.data.amount,
        })
        .where(eq(registrations.id, parsed.data.registrationId))
        .returning();

      // Get full registration details with session and child for email
      const fullRegistration = await tx.query.registrations.findFirst({
        where: eq(registrations.id, parsed.data.registrationId),
        with: {
          session: true,
          child: true,
        },
      });

      // Log the payment event
      await tx.insert(events).values({
        streamId: `registration-${parsed.data.registrationId}`,
        eventType: "MockPaymentProcessed",
        eventData: {
          registrationId: parsed.data.registrationId,
          amount: parsed.data.amount,
          paymentMethod: "mock",
          processedAt: new Date().toISOString(),
        },
        version: 1,
        userId: session.user.id,
      });

      return {
        registration: updatedReg,
        fullData: fullRegistration,
      };
    });

    // Send payment received email
    if (result.fullData) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        const dashboardUrl = `${baseUrl}/dashboard/parent`;

        await sendPaymentReceivedEmail(session.user.email, {
          parentName: session.user.name,
          childName: `${result.fullData.child.firstName} ${result.fullData.child.lastName}`,
          sessionName: result.fullData.session.name,
          sessionStartDate: result.fullData.session.startDate.toLocaleDateString(
            "en-US",
            {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            }
          ),
          sessionEndDate: result.fullData.session.endDate.toLocaleDateString(
            "en-US",
            {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            }
          ),
          amountPaid: parsed.data.amount,
          dashboardUrl,
        });
      } catch (emailError) {
        // Log error but don't fail the payment
        console.error("Failed to send payment received email:", emailError);
      }
    }

    revalidatePath("/dashboard/parent");
    revalidatePath(`/checkout/${parsed.data.registrationId}`);

    return { success: true, registration: result.registration };
  } catch (error) {
    console.error("Failed to process payment:", error);
    return { success: false, error: "Payment processing failed. Please try again." };
  }
}

/**
 * Get a registration for checkout
 */
export async function getRegistrationForCheckout(registrationId: string) {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: "Unauthorized", registration: null };
  }

  try {
    const registration = await db.query.registrations.findFirst({
      where: eq(registrations.id, registrationId),
      with: {
        session: true,
        child: true,
      },
    });

    if (!registration) {
      return { success: false, error: "Registration not found", registration: null };
    }

    // Verify ownership
    if (registration.userId !== session.user.id) {
      return { success: false, error: "Access denied", registration: null };
    }

    return { success: true, registration };
  } catch (error) {
    console.error("Failed to get registration:", error);
    return { success: false, error: "Failed to load registration", registration: null };
  }
}
