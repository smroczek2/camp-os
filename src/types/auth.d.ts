/**
 * Better Auth type extensions for multi-tenant support
 *
 * This file extends the Better Auth session types to include
 * organization context fields.
 */

import "better-auth";

declare module "better-auth" {
  interface User {
    activeOrganizationId?: string;
  }

  interface Session {
    user: User & {
      id: string;
      email: string;
      name: string;
      image?: string | null;
      emailVerified: boolean;
      role: string;
      activeOrganizationId?: string;
    };
  }
}
