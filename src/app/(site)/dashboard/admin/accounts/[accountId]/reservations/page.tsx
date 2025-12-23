import { getAccountReservationsAction } from "@/app/actions/account-actions";
import { ReservationsList } from "@/components/admin/accounts/reservations-list";
import { getSession } from "@/lib/auth-helper";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ accountId: string }>;
}

export default async function AccountReservationsPage({ params }: PageProps) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/dev-login");
  }

  const resolvedParams = await params;
  const { accountId } = resolvedParams;

  // Fetch reservations
  const reservationsResult = await getAccountReservationsAction(accountId);

  if (!reservationsResult.success) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            {reservationsResult.error || "Failed to load reservations"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reservations</h2>
        <p className="text-muted-foreground">
          View all session registrations for this account
        </p>
      </div>

      <ReservationsList reservations={reservationsResult.data} />
    </div>
  );
}
