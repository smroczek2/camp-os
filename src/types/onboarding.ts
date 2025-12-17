import { z } from "zod";

/**
 * Onboarding form validation schema
 * Used for the multi-step signup form
 */
export const onboardingSchema = z.object({
  // Step 1: Organization Details
  organizationName: z
    .string()
    .min(3, "Organization name must be at least 3 characters")
    .max(100, "Organization name must be less than 100 characters"),
  organizationSlug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug must be less than 50 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    ),
  contactEmail: z.string().email("Invalid email address"),
  contactPhone: z.string().optional(),
  timezone: z.string(),

  // Step 2: Admin Account
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

  // Step 3: Team Members (optional)
  teamMembers: z
    .array(
      z.object({
        email: z.string().email(),
        role: z.enum(["admin", "staff", "nurse"]),
        name: z.string().optional(),
      })
    )
    .optional(),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

/**
 * Successful onboarding response
 */
export interface OnboardingResult {
  success: true;
  organizationId: string;
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

/**
 * Helper to generate slug from organization name
 * Safe for client-side use
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ""); // Trim hyphens from start/end
}
