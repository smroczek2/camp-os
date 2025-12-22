import { resend, FROM_EMAIL } from "./resend-client";
import {
  RegistrationConfirmation,
  type RegistrationConfirmationParams,
} from "./templates/registration-confirmation";
import {
  PaymentReceived,
  type PaymentReceivedParams,
} from "./templates/payment-received";
import {
  SessionReminder,
  type SessionReminderParams,
} from "./templates/session-reminder";
import { WelcomeEmail } from "./templates/welcome-email";
import type { WelcomeEmailParams } from "./send-welcome";

type EmailType =
  | "registration-confirmation"
  | "payment-received"
  | "session-reminder"
  | "welcome";

type EmailData = {
  "registration-confirmation": RegistrationConfirmationParams;
  "payment-received": PaymentReceivedParams;
  "session-reminder": SessionReminderParams;
  welcome: WelcomeEmailParams;
};

type EmailSubjectFn<T> = string | ((data: T) => string);

const emailSubjects: Record<EmailType, EmailSubjectFn<unknown>> = {
  "registration-confirmation": (data: unknown) =>
    `Registration Confirmed - ${(data as RegistrationConfirmationParams).sessionName}`,
  "payment-received": (data: unknown) =>
    `Payment Received - ${(data as PaymentReceivedParams).sessionName}`,
  "session-reminder": (data: unknown) => {
    const reminderData = data as SessionReminderParams;
    const reminderType =
      reminderData.daysUntilStart <= 1 ? "Tomorrow" : `in ${reminderData.daysUntilStart} days`;
    return `Reminder: ${reminderData.sessionName} starts ${reminderType}`;
  },
  welcome: "Welcome to Camp OS",
};

/**
 * Unified email service for sending all types of Camp OS emails
 *
 * @param type - The type of email to send
 * @param to - Recipient email address
 * @param data - Email-specific data matching the template parameters
 * @returns The Resend API response
 */
export async function sendEmail<T extends EmailType>(
  type: T,
  to: string,
  data: EmailData[T]
) {
  try {
    // Get the appropriate email template
    let emailComponent;
    switch (type) {
      case "registration-confirmation":
        emailComponent = RegistrationConfirmation(
          data as RegistrationConfirmationParams
        );
        break;
      case "payment-received":
        emailComponent = PaymentReceived(data as PaymentReceivedParams);
        break;
      case "session-reminder":
        emailComponent = SessionReminder(data as SessionReminderParams);
        break;
      case "welcome":
        emailComponent = WelcomeEmail(data as WelcomeEmailParams);
        break;
      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    // Get the subject line
    const subjectFn = emailSubjects[type];
    const subject: string =
      typeof subjectFn === "function" ? subjectFn(data) : subjectFn;

    // Send the email via Resend
    const { data: responseData, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      react: emailComponent,
    });

    if (error) {
      console.error(`Failed to send ${type} email to ${to}:`, error);
      throw error;
    }

    console.log(`${type} email sent to ${to}:`, responseData);
    return responseData;
  } catch (error) {
    console.error(`Error sending ${type} email to ${to}:`, error);
    throw error;
  }
}

/**
 * Send a registration confirmation email
 */
export async function sendRegistrationConfirmationEmail(
  to: string,
  data: RegistrationConfirmationParams
) {
  return sendEmail("registration-confirmation", to, data);
}

/**
 * Send a payment received email
 */
export async function sendPaymentReceivedEmail(
  to: string,
  data: PaymentReceivedParams
) {
  return sendEmail("payment-received", to, data);
}

/**
 * Send a session reminder email
 */
export async function sendSessionReminderEmail(
  to: string,
  data: SessionReminderParams
) {
  return sendEmail("session-reminder", to, data);
}
