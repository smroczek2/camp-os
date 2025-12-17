import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import * as schema from "@/lib/schema";
import type { ExtractTablesWithRelations } from "drizzle-orm";

/**
 * Type for the transaction object passed to callbacks
 */
export type TenantTransaction = PgTransaction<
  PostgresJsQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

/**
 * Execute a database operation within an organization context.
 *
 * CRITICAL: This function wraps all operations in a transaction to hold the
 * database connection and prevent connection pooling race conditions.
 *
 * BUG FIX: Without the transaction wrapper, `SET LOCAL` could be applied to
 * one connection and the query executed on another connection from the pool,
 * causing data leakage between organizations.
 *
 * @param organizationId - The organization ID to set as context
 * @param callback - Async function that receives the transaction object
 * @returns Promise resolving to the callback's return value
 *
 * @example
 * ```typescript
 * export async function getChildrenAction() {
 *   const session = await getSession();
 *   const organizationId = session.user.activeOrganizationId;
 *
 *   return withOrganizationContext(organizationId, async (tx) => {
 *     // All queries now automatically filtered by RLS + use same connection
 *     return tx.query.children.findMany();
 *   });
 * }
 * ```
 */
export async function withOrganizationContext<T>(
  organizationId: string,
  callback: (tx: TenantTransaction) => Promise<T>
): Promise<T> {
  if (!organizationId) {
    throw new Error(
      "Organization ID is required for tenant context. User may not have an active organization."
    );
  }

  // Wrap in transaction to hold the connection (prevents pooling race condition)
  return db.transaction(async (tx) => {
    // Set PostgreSQL session variable for RLS within transaction scope
    // This variable is used by RLS policies to filter rows
    // Note: Using sql.raw() because SET LOCAL doesn't support parameterized queries
    await tx.execute(
      sql.raw(`SET LOCAL app.current_organization_id = '${organizationId}'`)
    );

    // Execute callback with transaction object (must use tx, not db)
    return await callback(tx);
  });
}

/**
 * Helper to get organization context from Next.js headers.
 *
 * This should be used in API routes and Server Actions when the organization
 * is injected by middleware.
 *
 * @returns The organization ID from request headers
 * @throws Error if organization context is not found in headers
 *
 * @example
 * ```typescript
 * export async function GET(request: Request) {
 *   const organizationId = getOrganizationFromHeaders();
 *
 *   return withOrganizationContext(organizationId, async (tx) => {
 *     const camps = await tx.query.camps.findMany();
 *     return Response.json(camps);
 *   });
 * }
 * ```
 */
export async function getOrganizationFromHeaders(): Promise<string> {
  const { headers } = await import("next/headers");
  const headersList = await headers();
  const organizationId = headersList.get("x-organization-id");

  if (!organizationId) {
    throw new Error(
      "Organization context not found in request headers. Middleware may not have set x-organization-id header."
    );
  }

  return organizationId;
}

/**
 * Legacy helper for backward compatibility.
 * Prefer using withOrganizationContext directly for better type safety.
 *
 * @deprecated Use withOrganizationContext instead
 */
export async function getOrgDb(organizationId: string) {
  console.warn(
    "getOrgDb is deprecated. Use withOrganizationContext for transaction-safe queries."
  );

  // This is unsafe for production - kept only for backward compatibility
  // The SET LOCAL will be applied but queries might use a different connection
  await db.execute(
    sql`SET LOCAL app.current_organization_id = ${organizationId}`
  );

  return db;
}
