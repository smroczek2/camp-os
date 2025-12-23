import { getSession } from "@/lib/auth-helper";
import { redirect } from "next/navigation";
import { getAccountDetailsAction, getAccountActivityAction } from "@/app/actions/account-actions";
import { AccountLayout } from "@/components/admin/accounts/account-layout";
import { ActivityLog } from "@/components/admin/accounts/activity-log";

interface ActivityPageProps {
  params: Promise<{
    accountId: string;
  }>;
  searchParams: Promise<{
    page?: string;
    eventType?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

export default async function ActivityPage({ params, searchParams }: ActivityPageProps) {
  const session = await getSession();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const { accountId } = await params;
  const search = await searchParams;

  // Fetch account details for header
  const accountDetailsResult = await getAccountDetailsAction(accountId);

  if (!accountDetailsResult.success || !accountDetailsResult.data) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Account Not Found</h1>
          <p className="text-muted-foreground mt-2">
            The account you are looking for does not exist.
          </p>
        </div>
      </div>
    );
  }

  const accountDetails = accountDetailsResult.data;

  // Parse filters from search params
  const page = search.page ? parseInt(search.page) : 1;
  const limit = 50;
  const offset = (page - 1) * limit;

  const filters: {
    limit: number;
    offset: number;
    eventType?: string;
    dateFrom?: Date;
    dateTo?: Date;
  } = {
    limit,
    offset,
  };

  if (search.eventType) {
    filters.eventType = search.eventType;
  }

  if (search.dateFrom) {
    filters.dateFrom = new Date(search.dateFrom);
  }

  if (search.dateTo) {
    filters.dateTo = new Date(search.dateTo);
  }

  // Fetch activity log with filters
  const activityResult = await getAccountActivityAction(accountId, filters);

  if (!activityResult.success) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Error Loading Activity</h1>
          <p className="text-muted-foreground mt-2">{activityResult.error}</p>
        </div>
      </div>
    );
  }

  return (
    <AccountLayout
      account={{
        accountNumber: accountDetails.user.accountNumber,
        name: accountDetails.user.name || "Unknown",
        accountStatus: accountDetails.user.accountStatus || "active",
      }}
      accountId={accountId}
    >
      <ActivityLog
        initialEvents={activityResult.data}
        initialTotal={"total" in activityResult && typeof activityResult.total === "number" ? activityResult.total : activityResult.data.length}
        accountId={accountId}
      />
    </AccountLayout>
  );
}
