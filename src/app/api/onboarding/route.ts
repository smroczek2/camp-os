import { NextResponse } from "next/server";
import { onboardingSchema } from "@/types/onboarding";
import type {
  OnboardingResult,
  OnboardingError,
} from "@/types/onboarding";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

/**
 * POST /api/onboarding
 *
 * Admin account signup endpoint
 *
 * Flow:
 * 1. Validate input with Zod
 * 2. Check if email is already in use
 * 3. Create user with admin role using Better Auth
 * 4. Return success with redirect URL
 */
export async function POST(request: Request) {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const data = onboardingSchema.parse(body);

    // 2. Check if email is already in use
    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, data.email),
    });

    if (existingUser) {
      const response: OnboardingError = {
        success: false,
        error: "An account with this email already exists",
      };
      return NextResponse.json(response, { status: 409 });
    }

    // 3. Create user with admin role using Better Auth
    const signUpResult = await auth.api.signUpEmail({
      body: {
        email: data.email,
        password: data.password,
        name: `${data.firstName} ${data.lastName}`,
      },
    });

    if (!signUpResult.user) {
      throw new Error("Failed to create user account");
    }

    // Update user role to admin
    await db
      .update(user)
      .set({ role: "admin" })
      .where(eq(user.id, signUpResult.user.id));

    // 4. Return success
    const response: OnboardingResult = {
      success: true,
      userId: signUpResult.user.id,
      redirectUrl: "/dashboard/admin",
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
          : "Failed to create account. Please try again.",
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
