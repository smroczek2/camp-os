import { z } from "zod";

/**
 * Onboarding form validation schema
 * Used for the admin account signup form
 */
export const onboardingSchema = z.object({
  // Admin Account
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters"),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

/**
 * Successful onboarding response
 */
export interface OnboardingResult {
  success: true;
  userId: string;
  redirectUrl: string;
}

/**
 * Failed onboarding response
 */
export interface OnboardingError {
  success: false;
  error: string;
  details?: string;
}
