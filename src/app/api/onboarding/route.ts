import { NextResponse } from "next/server";
import { provisionOrganization } from "@/lib/provisioning/provision-organization";
import { onboardingSchema } from "@/types/onboarding";
import type {
  OnboardingResult,
  OnboardingError,
} from "@/types/onboarding";
import { sendWelcomeEmail } from "@/lib/email/send-welcome";

/**
 * POST /api/onboarding
 *
 * Self-service organization signup endpoint
 *
 * Flow:
 * 1. Validate input with Zod
 * 2. Provision organization (creates org + admin + membership)
 * 3. Send welcome email (async, don't block)
 * 4. Return success with redirect URL
 *
 * SIMPLIFIED: No onboarding_sessions table, no retry logic
 * If provisioning fails, user sees error and must retry manually
 */
export async function POST(request: Request) {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const data = onboardingSchema.parse(body);

    // 2. Provision organization (atomic transaction)
    const result = await provisionOrganization(data);

    // 3. Send welcome email (async, don't block response)
    sendWelcomeEmail({
      to: data.email,
      organizationName: data.organizationName,
      adminName: `${data.firstName} ${data.lastName}`,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}${result.redirectUrl}`,
    }).catch((error) => {
      // Log email error but don't fail the request
      console.error("Failed to send welcome email:", error);
    });

    // 4. Return success
    const response: OnboardingResult = {
      success: true,
      organizationId: result.organizationId,
      userId: result.userId,
      redirectUrl: result.redirectUrl,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Onboarding error:", error);

    // Return user-friendly error
    const response: OnboardingError = {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create organization. Please try again.",
      details: error instanceof Error ? error.message : undefined,
    };

    // Determine status code based on error type
    const statusCode =
      error instanceof Error &&
      (error.message.includes("already taken") ||
        error.message.includes("already exists"))
        ? 409 // Conflict
        : 500; // Internal error

    return NextResponse.json(response, { status: statusCode });
  }
}
