# ADR-0001: Use Better Auth for Authentication

## Status

Accepted

## Context

We need a robust authentication solution that:
- Supports OAuth providers (Google, GitHub, etc.)
- Works seamlessly with Next.js App Router
- Provides session management
- Is type-safe with TypeScript
- Has minimal boilerplate
- Is actively maintained

Options considered: Next-Auth (Auth.js), Clerk, Supabase Auth, Better Auth, custom implementation.

## Decision

Use **Better Auth** as the authentication framework for this project.

## Consequences

### Positive

- **Native Next.js Integration**: Built specifically for Next.js App Router
- **Type Safety**: Full TypeScript support out of the box
- **Flexible Database**: Works with Drizzle ORM and our PostgreSQL setup
- **Simple API**: Clean, intuitive API for both server and client
- **Session Management**: Built-in session handling with secure cookies
- **OAuth Support**: Easy integration with Google, GitHub, and other providers
- **Minimal Boilerplate**: Less code to maintain compared to alternatives
- **Active Development**: New, modern, actively maintained

### Negative

- **Newer Library**: Less mature than Next-Auth (potential for breaking changes)
- **Smaller Community**: Fewer community resources and examples
- **Documentation**: Still evolving, some advanced use cases may require source code reading

### Neutral

- **Migration Path**: If needed later, migration to other auth solutions is possible (session data is in PostgreSQL)
- **Learning Curve**: Team needs to learn Better Auth API (but it's simpler than alternatives)

## Alternatives Considered

- **Next-Auth (Auth.js)**: More mature, larger community, but more complex configuration and not as well-integrated with App Router
- **Clerk**: Excellent developer experience, but introduces vendor lock-in and ongoing costs
- **Supabase Auth**: Good option, but would require using Supabase's PostgreSQL instance and additional services
- **Custom Implementation**: Maximum flexibility, but requires building session management, OAuth flows, security measures from scratch

## References

- [Better Auth Documentation](https://better-auth.com)
- [Better Auth GitHub](https://github.com/better-auth/better-auth)
- Configured in `src/lib/auth.ts` (server) and `src/lib/auth-client.ts` (client)
