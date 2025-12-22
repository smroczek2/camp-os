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

export interface RegistrationConfirmationParams {
  parentName: string;
  childName: string;
  sessionName: string;
  sessionStartDate: string;
  sessionEndDate: string;
  sessionPrice: string;
  checkoutUrl: string;
}

export function RegistrationConfirmation({
  parentName,
  childName,
  sessionName,
  sessionStartDate,
  sessionEndDate,
  sessionPrice,
  checkoutUrl,
}: RegistrationConfirmationParams) {
  return (
    <Html>
      <Head />
      <Preview>
        Registration confirmed for {childName} - {sessionName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Registration Confirmed!</Heading>

          <Text style={text}>Hi {parentName},</Text>

          <Text style={text}>
            Great news! Your child <strong>{childName}</strong> has been
            successfully registered for <strong>{sessionName}</strong>.
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
              <strong>Dates:</strong> {sessionStartDate} - {sessionEndDate}
            </Text>
            <Text style={detailsText}>
              <strong>Price:</strong> ${sessionPrice}
            </Text>
          </Section>

          <Text style={text}>
            <strong>Next Step: Complete Payment</strong>
          </Text>

          <Text style={text}>
            To confirm your registration, please complete payment by clicking
            the button below. Your spot will be held temporarily, but final
            confirmation requires payment.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={checkoutUrl}>
              Complete Payment
            </Button>
          </Section>

          <Hr style={divider} />

          <Text style={text}>
            If you have any questions or need to make changes to your
            registration, please contact us or visit your parent dashboard.
          </Text>

          <Text style={footer}>
            Thank you for choosing Camp OS!
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
