import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";

// Get base URL - prioritize NEXT_PUBLIC_APP_URL so client and server match
const getBaseURL = (): string => {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";
};

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: getBaseURL(),
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "parent",
        input: false, // Don't allow users to set this directly
      },
    },
  },
});
