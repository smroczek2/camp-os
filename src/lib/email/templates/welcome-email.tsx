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
} from "@react-email/components";
import type { WelcomeEmailParams } from "../send-welcome";

export function WelcomeEmail({
  adminName,
  dashboardUrl,
}: WelcomeEmailParams) {
  return (
    <Html>
      <Head />
      <Preview>
        Welcome to Camp OS - Your camp management system is ready!
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to Camp OS!</Heading>

          <Text style={text}>
            Hi {adminName},
          </Text>

          <Text style={text}>
            Your account has been successfully created and is ready to use.
          </Text>

          <Text style={text}>
            You can now access your dashboard to:
          </Text>

          <ul style={list}>
            <li>Create camps and sessions</li>
            <li>Add staff members and nurses</li>
            <li>Build custom registration forms</li>
            <li>Manage parent and child registrations</li>
            <li>Track attendance and medical records</li>
          </ul>

          <Section style={buttonContainer}>
            <Button style={button} href={dashboardUrl}>
              Go to Dashboard
            </Button>
          </Section>

          <Text style={text}>
            Need help getting started? Check out our documentation or reach out
            to our support team.
          </Text>

          <Text style={footer}>
            Welcome aboard,
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

const list = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 0",
  padding: "0 40px",
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

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "48px 0 0",
  padding: "0 40px",
};
