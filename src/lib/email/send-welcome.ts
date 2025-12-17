import { resend, FROM_EMAIL } from "./resend-client";
import { WelcomeEmail } from "./templates/welcome-email";

export interface WelcomeEmailParams {
  to: string;
  organizationName: string;
  adminName: string;
  dashboardUrl: string;
}

/**
 * Send welcome email to new organization admin
 */
export async function sendWelcomeEmail(params: WelcomeEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `Welcome to Camp OS - ${params.organizationName}`,
      react: WelcomeEmail(params),
    });

    if (error) {
      console.error("Failed to send welcome email:", error);
      throw error;
    }

    console.log(`Welcome email sent to ${params.to}:`, data);
    return data;
  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw error;
  }
}
