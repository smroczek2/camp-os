import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";

export interface SessionReminderParams {
  parentName: string;
  childName: string;
  sessionName: string;
  sessionStartDate: string;
  sessionEndDate: string;
  daysUntilStart: number;
  whatToBring?: string;
  specialInstructions?: string;
  dashboardUrl: string;
}

export function SessionReminder({
  parentName,
  childName,
  sessionName,
  sessionStartDate,
  sessionEndDate,
  daysUntilStart,
  whatToBring,
  specialInstructions,
  dashboardUrl,
}: SessionReminderParams) {
  const reminderType = daysUntilStart <= 1 ? "tomorrow" : `in ${daysUntilStart} days`;
  const subject = daysUntilStart <= 1
    ? `Tomorrow: ${sessionName}`
    : `Reminder: ${sessionName} starts ${reminderType}`;

  return (
    <Html>
      <Head />
      <Preview>
        {subject} - {childName} is registered
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            {daysUntilStart <= 1 ? "Camp Starts Tomorrow!" : "Camp Reminder"}
          </Heading>

          <Text style={text}>Hi {parentName},</Text>

          <Text style={text}>
            This is a friendly reminder that <strong>{childName}</strong> is
            registered for <strong>{sessionName}</strong>, which starts{" "}
            <strong>{reminderType}</strong>!
          </Text>

          <Section style={detailsBox}>
            <Text style={detailsHeading}>Session Details</Text>
            <Text style={detailsText}>
              <strong>Session:</strong> {sessionName}
            </Text>
            <Text style={detailsText}>
              <strong>Child:</strong> {childName}
            </Text>
            <Text style={detailsText}>
              <strong>Start Date:</strong> {sessionStartDate}
            </Text>
            <Text style={detailsText}>
              <strong>End Date:</strong> {sessionEndDate}
            </Text>
          </Section>

          {whatToBring && (
            <>
              <Text style={text}>
                <strong>What to Bring:</strong>
              </Text>
              <Section style={infoBox}>
                <Text style={infoText}>{whatToBring}</Text>
              </Section>
            </>
          )}

          {specialInstructions && (
            <>
              <Text style={text}>
                <strong>Special Instructions:</strong>
              </Text>
              <Section style={infoBox}>
                <Text style={infoText}>{specialInstructions}</Text>
              </Section>
            </>
          )}

          <Text style={text}>
            Please ensure all required forms are completed and any medications
            are properly labeled and packaged. You can review all registration
            details in your parent dashboard.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={dashboardUrl}>
              View Dashboard
            </Button>
          </Section>

          <Hr style={divider} />

          <Text style={text}>
            If you have any last-minute questions or need to make changes,
            please contact us as soon as possible.
          </Text>

          <Text style={footer}>
            We&apos;re excited to see {childName} at camp!
            <br />
            The Camp OS Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0 40px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 0",
  padding: "0 40px",
};

const detailsBox = {
  backgroundColor: "#f8f9fa",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 40px",
};

const detailsHeading = {
  color: "#333",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0 0 16px 0",
};

const detailsText = {
  color: "#333",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "8px 0",
};

const infoBox = {
  backgroundColor: "#fff8e1",
  borderLeft: "4px solid #ffc107",
  borderRadius: "4px",
  padding: "16px",
  margin: "12px 40px",
};

const infoText = {
  color: "#333",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0",
  whiteSpace: "pre-wrap" as const,
};

const buttonContainer = {
  padding: "27px 40px",
};

const button = {
  backgroundColor: "#5469d4",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 20px",
};

const divider = {
  borderColor: "#e6ebf1",
  margin: "32px 40px",
};

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "48px 0 0",
  padding: "0 40px",
};
