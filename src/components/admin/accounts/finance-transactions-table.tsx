"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Transaction = {
  id: string;
  type: "payment" | "charge";
  date: Date;
  amount: number;
  description: string;
  paymentMethod?: string;
  referenceNumber?: string | null;
  status?: string;
  refundedAmount?: number | null;
  refundReason?: string | null;
  chargeType?: string;
  registrationId?: string | null;
};

interface FinanceTransactionsTableProps {
  transactions: Transaction[];
}

export function FinanceTransactionsTable({
  transactions,
}: FinanceTransactionsTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No transactions found
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => {
            const amountDollars = transaction.amount / 100;
            const isPayment = transaction.type === "payment";
            const isRefunded = transaction.status === "refunded";
            const hasPartialRefund =
              transaction.refundedAmount && transaction.refundedAmount > 0;

            return (
              <TableRow key={transaction.id}>
                <TableCell>
                  {new Date(transaction.date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge variant={isPayment ? "default" : "secondary"}>
                    {isPayment ? "Payment" : "Charge"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    {isPayment && transaction.paymentMethod && (
                      <p className="text-sm text-muted-foreground">
                        {transaction.paymentMethod.toUpperCase()}
                        {transaction.referenceNumber &&
                          ` - ${transaction.referenceNumber}`}
                      </p>
                    )}
                    {!isPayment && transaction.chargeType && (
                      <p className="text-sm text-muted-foreground">
                        {transaction.chargeType
                          .split("_")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(" ")}
                      </p>
                    )}
                    {hasPartialRefund && !isRefunded && (
                      <p className="text-sm text-orange-600">
                        Partial refund: $
                        {((transaction.refundedAmount || 0) / 100).toFixed(2)}
                      </p>
                    )}
                    {isRefunded && transaction.refundReason && (
                      <p className="text-sm text-red-600">
                        Refunded: {transaction.refundReason}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-medium",
                    isPayment ? "text-green-600" : "text-red-600"
                  )}
                >
                  {isPayment ? "-" : "+"}${amountDollars.toFixed(2)}
                </TableCell>
                <TableCell>
                  {isPayment && (
                    <Badge
                      variant={
                        isRefunded
                          ? "destructive"
                          : hasPartialRefund
                            ? "secondary"
                            : "default"
                      }
                    >
                      {isRefunded
                        ? "Refunded"
                        : hasPartialRefund
                          ? "Partial Refund"
                          : transaction.status || "Completed"}
                    </Badge>
                  )}
                  {!isPayment && <Badge variant="outline">Posted</Badge>}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
