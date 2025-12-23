import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helper";
import { getAccountDetailsAction, getAccountContactsAction } from "@/app/actions/account-actions";
import { AccountOverviewCard } from "@/components/admin/accounts/account-overview-card";
import { ChildrenSummaryList } from "@/components/admin/accounts/children-summary-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Phone, Mail, Star } from "lucide-react";

type Params = {
  accountId: string;
};

export default async function AccountOverviewPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const session = await getSession();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/login");
  }

  const { accountId } = await params;

  // Load account data
  const result = await getAccountDetailsAction(accountId);

  if (!result.success || !result.data) {
    return (
      <div className="text-center p-12 border rounded-xl bg-muted/30">
        <p className="text-muted-foreground">
          {result.error || "Failed to load account details"}
        </p>
      </div>
    );
  }

  const { children, balance, recentActivity } = result.data;

  // Calculate stats for overview cards
  // Count active reservations (confirmed or pending for future sessions)
  const activeRegistrations = result.data.user
    ? await getActiveRegistrationsCount(accountId)
    : 0;

  // Load contacts to show primary contact
  const contactsResult = await getAccountContactsAction(accountId);
  const primaryContact = contactsResult.success
    ? contactsResult.data.find((c) => c.isPrimary)
    : null;

  // Load account notes (Phase 3 - Notes implementation)
  // const notesResult = await getAccountNotesAction(accountId);
  // const notes = notesResult.success ? notesResult.data : [];
  const notes: Array<{ id: string; note: string; createdAt: Date }> = [];

  return (
    <div className="space-y-6">
      {/* Overview Stats Cards */}
      <AccountOverviewCard
        balance={balance.balance}
        childrenCount={children.length}
        activeReservationsCount={activeRegistrations}
      />

      {/* Primary Contact Card */}
      {primaryContact && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Primary Contact</CardTitle>
              <Badge variant="default" className="gap-1">
                <Star className="h-3 w-3" />
                Primary
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-lg">
                  {primaryContact.firstName} {primaryContact.lastName}
                </p>
                <p className="text-sm text-muted-foreground capitalize">
                  {primaryContact.relationship}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`tel:${primaryContact.phone}`}
                    className="hover:underline"
                  >
                    {primaryContact.phone}
                  </a>
                </div>
                {primaryContact.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${primaryContact.email}`}
                      className="hover:underline"
                    >
                      {primaryContact.email}
                    </a>
                  </div>
                )}
              </div>
              {primaryContact.notes && (
                <p className="text-sm text-muted-foreground border-t pt-3">
                  {primaryContact.notes}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Children Summary */}
      <ChildrenSummaryList childrenList={children} />

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {event.eventType}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getEventDescription(event)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Notes</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No notes yet. Use the More menu (top right) to add notes.
            </p>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="border-b pb-3 last:border-0">
                  <p className="text-sm">{note.note}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(note.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to get active registrations count
async function getActiveRegistrationsCount(accountId: string): Promise<number> {
  const { db } = await import("@/lib/db");
  const { registrations, sessions } = await import("@/lib/schema");
  const { eq, and, gte } = await import("drizzle-orm");

  const now = new Date();

  const activeRegs = await db
    .select()
    .from(registrations)
    .innerJoin(sessions, eq(registrations.sessionId, sessions.id))
    .where(
      and(
        eq(registrations.userId, accountId),
        eq(registrations.status, "confirmed"),
        gte(sessions.endDate, now)
      )
    );

  return activeRegs.length;
}

// Helper function to format event descriptions
function getEventDescription(event: {
  eventType: string;
  eventData: unknown;
}): string {
  switch (event.eventType) {
    case "RegistrationCreated":
      return "New registration created";
    case "RegistrationConfirmed":
      return "Registration confirmed";
    case "RegistrationCanceled":
      return "Registration canceled";
    case "ChildCreated":
      return "Child profile created";
    case "ChildUpdated":
      return "Child profile updated";
    default:
      return event.eventType;
  }
}
