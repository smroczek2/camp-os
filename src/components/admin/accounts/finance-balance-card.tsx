import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FinanceBalanceCardProps {
  totalCharges: number;
  totalPayments: number;
  balance: number;
}

export function FinanceBalanceCard({
  totalCharges,
  totalPayments,
  balance,
}: FinanceBalanceCardProps) {
  // Convert cents to dollars
  const chargesDollars = totalCharges / 100;
  const paymentsDollars = totalPayments / 100;
  const balanceDollars = balance / 100;

  const isCredit = balanceDollars < 0;
  const isZero = balanceDollars === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Charges</p>
            <p className="text-2xl font-bold">
              ${chargesDollars.toFixed(2)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Payments</p>
            <p className="text-2xl font-bold">
              ${paymentsDollars.toFixed(2)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Balance</p>
            <p
              className={cn(
                "text-2xl font-bold",
                isCredit && "text-green-600",
                !isCredit && !isZero && "text-red-600",
                isZero && "text-muted-foreground"
              )}
            >
              {isCredit ? "-" : ""}${Math.abs(balanceDollars).toFixed(2)}
            </p>
            {isCredit && (
              <p className="text-xs text-green-600">Credit on account</p>
            )}
            {!isCredit && !isZero && (
              <p className="text-xs text-red-600">Amount due</p>
            )}
            {isZero && (
              <p className="text-xs text-muted-foreground">Paid in full</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
