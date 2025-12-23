import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helper";
import { getAccountDetailsAction } from "@/app/actions/account-actions";
import { AccountHeaderWithActions } from "@/components/admin/accounts/account-header-with-actions";
import { AccountTabsNav } from "@/components/admin/accounts/account-tabs-nav";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type Params = {
  accountId: string;
};

export default async function AccountDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<Params>;
}) {
  const session = await getSession();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/login");
  }

  const { accountId } = await params;

  // Load account data once
  const result = await getAccountDetailsAction(accountId);

  if (!result.success || !result.data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center p-12 border rounded-xl bg-muted/30">
          <p className="text-muted-foreground">
            {result.error || "Account not found"}
          </p>
          <Link href="/dashboard/admin/accounts" className="mt-4 inline-block">
            <Button variant="outline">Back to Accounts</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { user: account } = result.data;

  // Use account data with accountNumber and accountStatus
  const accountWithStatus = {
    accountNumber: account.accountNumber,
    name: account.name,
    accountStatus: account.accountStatus,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Link
          href="/dashboard/admin/accounts"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Accounts
        </Link>
      </div>

      {/* Account Header with Actions */}
      <AccountHeaderWithActions account={accountWithStatus} accountId={accountId} />

      {/* Tab Navigation */}
      <div className="mb-6">
        <AccountTabsNav accountId={accountId} />
      </div>

      {/* Tab Content */}
      {children}
    </div>
  );
}
