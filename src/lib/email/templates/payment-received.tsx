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

export interface PaymentReceivedParams {
  parentName: string;
  childName: string;
  sessionName: string;
  sessionStartDate: string;
  sessionEndDate: string;
  amountPaid: string;
  dashboardUrl: string;
}

export function PaymentReceived({
  parentName,
  childName,
  sessionName,
  sessionStartDate,
  sessionEndDate,
  amountPaid,
  dashboardUrl,
}: PaymentReceivedParams) {
  return (
    <Html>
      <Head />
      <Preview>
        Payment received - {childName} is confirmed for {sessionName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Payment Received!</Heading>

          <Text style={text}>Hi {parentName},</Text>

          <Text style={text}>
            Thank you! Your payment has been successfully processed and{" "}
            <strong>{childName}</strong>&apos;s registration for{" "}
            <strong>{sessionName}</strong> is now confirmed.
          </Text>

          <Section style={confirmationBox}>
            <Text style={confirmationText}>
              Registration Status: <strong style={confirmedBadge}>CONFIRMED</strong>
            </Text>
          </Section>

          <Section style={detailsBox}>
            <Text style={detailsHeading}>Registration Summary</Text>
            <Text style={detailsText}>
              <strong>Session:</strong> {sessionName}
            </Text>
            <Text style={detailsText}>
              <strong>Child:</strong> {childName}
            </Text>
            <Text style={detailsText}>
              <strong>Dates:</strong> {sessionStartDate} - {sessionEndDate}
            </Text>
            <Text style={detailsText}>
              <strong>Amount Paid:</strong> ${amountPaid}
            </Text>
          </Section>

          <Text style={text}>
            <strong>What&apos;s Next?</strong>
          </Text>

          <Text style={text}>
            We&apos;ll send you a reminder before the session starts with all the
            details you need, including what to bring and drop-off information.
            You can view your complete registration details anytime in your
            parent dashboard.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={dashboardUrl}>
              View Dashboard
            </Button>
          </Section>

          <Hr style={divider} />

          <Text style={text}>
            If you have any questions about your registration, please don&apos;t
            hesitate to contact us. We look forward to seeing {childName} at
            camp!
          </Text>

          <Text style={footer}>
            See you at camp!
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

const confirmationBox = {
  backgroundColor: "#e8f5e9",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 40px",
  textAlign: "center" as const,
};

const confirmationText = {
  color: "#1b5e20",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0",
};

const confirmedBadge = {
  color: "#2e7d32",
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
