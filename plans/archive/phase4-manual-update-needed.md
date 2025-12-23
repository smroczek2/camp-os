# Phase 4: Manual Update Required

## Server Action Update

The file `/Users/smroczek/Projects/camp-os/src/app/actions/account-actions.ts` needs manual update for the `getAccountActivityAction` function.

The function at line 597-650 needs to be replaced with the enhanced version that supports date filtering and returns total count.

### Current Implementation Issues:
- The file keeps being modified by a linter/formatter
- Automated edit attempts failed due to file modifications

### Required Changes:

Replace the `getAccountActivityAction` function (lines 597-650) with:

```typescript
/**
 * Get account activity/audit log with filtering and pagination
 *
 * @param accountId - User ID to fetch activity for
 * @param filters - Optional filters (limit, offset, eventType, dateFrom, dateTo)
 * @returns Activity log events with total count for pagination
 */
export async function getAccountActivityAction(
  accountId: string,
  filters?: {
    limit?: number;
    offset?: number;
    eventType?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }
) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { success: false, error: "Unauthorized", data: [], total: 0 };
    }

    const hasAdminAccess = await isAdmin(session.user.id);
    if (!hasAdminAccess) {
      return {
        success: false,
        error: "Admin permission required",
        data: [],
        total: 0
      };
    }

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    // Build where conditions
    const whereConditions = [eq(events.userId, accountId)];

    if (filters?.eventType) {
      whereConditions.push(eq(events.eventType, filters.eventType));
    }

    if (filters?.dateFrom) {
      whereConditions.push(gte(events.timestamp, filters.dateFrom));
    }

    if (filters?.dateTo) {
      whereConditions.push(lte(events.timestamp, filters.dateTo));
    }

    // Fetch activity log with filters
    const activityLog = await db
      .select()
      .from(events)
      .where(and(...whereConditions))
      .orderBy(desc(events.timestamp))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(events)
      .where(and(...whereConditions));

    const total = Number(totalResult[0]?.count || 0);

    return { success: true, data: activityLog, total };
  } catch (error) {
    console.error("Failed to fetch account activity:", error);
    return {
      success: false,
      error: "Failed to fetch account activity",
      data: [],
      total: 0
    };
  }
}
```

### Key Changes:
1. Added `dateFrom` and `dateTo` parameters to filters
2. Added `total` to return type for pagination
3. Implemented date range filtering using `gte` and `lte`
4. Added total count query for pagination
5. Using `db.select()` instead of `db.query.events.findMany()` for better filtering support

### Verification:
After making this change:
1. Run `npm run typecheck` to ensure no type errors
2. Test the activity log page at `/dashboard/admin/accounts/[accountId]/activity`
3. Verify filtering and pagination work correctly
