import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";

type Registration = {
  id: string;
  status: string;
  amountPaid: string | null;
  createdAt: Date;
  child: {
    id: string;
    firstName: string;
    lastName: string;
  };
  session: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    price: string;
  };
};

interface ReservationsListProps {
  reservations: Registration[];
}

export function ReservationsList({ reservations }: ReservationsListProps) {
  // Group reservations by status
  const now = new Date();

  const grouped = {
    active: reservations.filter((r) => {
      const isConfirmed = r.status === "confirmed";
      const isOngoing = r.session.startDate <= now && r.session.endDate >= now;
      return isConfirmed && isOngoing;
    }),
    upcoming: reservations.filter((r) => {
      const isConfirmed = r.status === "confirmed";
      const isFuture = r.session.startDate > now;
      return isConfirmed && isFuture;
    }),
    past: reservations.filter((r) => {
      const isConfirmed = r.status === "confirmed";
      const isPast = r.session.endDate < now;
      return isConfirmed && isPast;
    }),
    canceled: reservations.filter((r) => r.status === "canceled" || r.status === "refunded"),
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      confirmed: "default",
      pending: "secondary",
      canceled: "destructive",
      refunded: "outline",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const ReservationCard = ({ registration }: { registration: Registration }) => {
    const price = parseFloat(registration.session.price);
    const paid = parseFloat(registration.amountPaid || "0");
    const balance = price - paid;

    return (
      <Link
        href={`/dashboard/admin/registrations/${registration.id}`}
        className="block hover:bg-muted/50 transition-colors rounded-lg border p-4"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">{registration.session.name}</h4>
              {getStatusBadge(registration.status)}
            </div>
            <p className="text-sm text-muted-foreground">
              {format(registration.session.startDate, "MMM d, yyyy")} -{" "}
              {format(registration.session.endDate, "MMM d, yyyy")}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-medium">{registration.child.firstName} {registration.child.lastName}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="font-medium">${price.toFixed(2)}</p>
            {balance > 0 && (
              <p className="text-sm text-muted-foreground">
                ${paid.toFixed(2)} paid
              </p>
            )}
            {balance > 0 && (
              <p className="text-sm text-destructive font-medium">
                ${balance.toFixed(2)} owed
              </p>
            )}
            {balance === 0 && (
              <p className="text-sm text-green-600">Paid in full</p>
            )}
          </div>
        </div>
      </Link>
    );
  };

  if (reservations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No reservations found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {grouped.active.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Active
              <Badge variant="default">{grouped.active.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {grouped.active.map((registration) => (
              <ReservationCard key={registration.id} registration={registration} />
            ))}
          </CardContent>
        </Card>
      )}

      {grouped.upcoming.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Upcoming
              <Badge variant="secondary">{grouped.upcoming.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {grouped.upcoming.map((registration) => (
              <ReservationCard key={registration.id} registration={registration} />
            ))}
          </CardContent>
        </Card>
      )}

      {grouped.past.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Past
              <Badge variant="outline">{grouped.past.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {grouped.past.map((registration) => (
              <ReservationCard key={registration.id} registration={registration} />
            ))}
          </CardContent>
        </Card>
      )}

      {grouped.canceled.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Canceled
              <Badge variant="destructive">{grouped.canceled.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {grouped.canceled.map((registration) => (
              <ReservationCard key={registration.id} registration={registration} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
