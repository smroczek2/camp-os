import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY environment variable is required");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Default sender email for Camp OS emails
 * Update this to your verified domain in Resend
 */
export const FROM_EMAIL = "Camp OS <onboarding@resend.dev>";
