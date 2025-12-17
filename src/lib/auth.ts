import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
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
      activeOrganizationId: {
        type: "string",
        required: false,
        input: false, // Set via server action, not user input
      },
    },
  },
  session: {
    // Extend session with organization context
    // Note: Better Auth automatically includes user fields in session
    // Additional custom session fields can be added here if needed
  },
});