import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccountOverviewCardProps {
  balance: number;
  childrenCount: number;
  activeReservationsCount: number;
}

export function AccountOverviewCard({
  balance,
  childrenCount,
  activeReservationsCount,
}: AccountOverviewCardProps) {
  const isCredit = balance > 0;
  const isOwed = balance < 0;
  const balanceFormatted = Math.abs(balance).toFixed(2);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Account Balance Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Account Balance</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "text-2xl font-bold",
              isCredit && "text-green-600",
              isOwed && "text-red-600"
            )}
          >
            {isCredit && "+"}${balanceFormatted}
          </div>
          <p className="text-xs text-muted-foreground">
            {isCredit && "Credit on account"}
            {isOwed && "Amount owed"}
            {balance === 0 && "No balance"}
          </p>
        </CardContent>
      </Card>

      {/* Children Count Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Children</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{childrenCount}</div>
          <p className="text-xs text-muted-foreground">
            {childrenCount === 1 ? "child" : "children"} registered
          </p>
        </CardContent>
      </Card>

      {/* Active Reservations Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Active Reservations
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeReservationsCount}</div>
          <p className="text-xs text-muted-foreground">
            {activeReservationsCount === 1
              ? "reservation"
              : "reservations"}{" "}
            active
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
