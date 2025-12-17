import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";

/**
 * Check if an email domain should get super_admin role
 * Camp OS employees (campminder.com) are automatically super admins
 */
function isSuperAdminEmail(email: string): boolean {
  const superAdminDomains = ["campminder.com"];
  const domain = email.split("@")[1]?.toLowerCase();
  return superAdminDomains.includes(domain);
}

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
  // Hooks to customize user creation
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Auto-assign super_admin role to campminder.com emails
          if (user.email && isSuperAdminEmail(user.email)) {
            return {
              data: {
                ...user,
                role: "super_admin",
              },
            };
          }
          return { data: user };
        },
      },
    },
  },
});
