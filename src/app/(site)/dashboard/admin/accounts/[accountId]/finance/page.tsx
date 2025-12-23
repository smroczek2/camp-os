import { getSession } from "@/lib/auth-helper";
import { redirect } from "next/navigation";
import { getAccountFinanceAction } from "@/app/actions/account-actions";
import { FinanceBalanceCard } from "@/components/admin/accounts/finance-balance-card";
import { FinanceTransactionsTable } from "@/components/admin/accounts/finance-transactions-table";

interface FinancePageProps {
  params: Promise<{
    accountId: string;
  }>;
}

export default async function FinancePage({ params }: FinancePageProps) {
  const session = await getSession();
  const { accountId } = await params;

  if (!session?.user || !["admin", "staff"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  // Fetch finance data
  const financeResult = await getAccountFinanceAction(accountId, {
    limit: 50, // Show last 50 transactions
  });

  if (!financeResult.success) {
    return (
      <div className="text-center py-8 text-destructive">
        {financeResult.error || "Failed to load financial data"}
      </div>
    );
  }

  const { transactions, summary } = financeResult;

  return (
    <div className="space-y-6">
        {summary && (
          <FinanceBalanceCard
            totalCharges={summary.totalCharges}
            totalPayments={summary.totalPayments}
            balance={summary.balance}
          />
        )}

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Transactions</h2>
            <p className="text-muted-foreground">
              View all payments and charges for this account
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Use the More menu (top right) to record payments or add charges
          </p>
        </div>

        <FinanceTransactionsTable transactions={transactions} />

        {transactions.length === 50 && (
          <p className="text-sm text-muted-foreground text-center">
            Showing last 50 transactions. Contact support for full history.
          </p>
        )}
    </div>
  );
}
