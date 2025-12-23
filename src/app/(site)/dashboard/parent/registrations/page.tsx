import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { registrations, waitlist } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Calendar, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Breadcrumb } from "@/components/dashboard/breadcrumb";

export default async function RegistrationsPage() {
    const session = await getSession();

    if (!session?.user) {
        redirect("/login");
    }

    // Get all registrations for this parent
    const myRegistrations = await db.query.registrations.findMany({
        where: eq(registrations.userId, session.user.id),
        with: {
            child: true,
            session: true,
        },
        orderBy: (regs, { desc }) => [desc(regs.createdAt)],
    });

    // Get user's waitlist entries
    const myWaitlistEntries = await db.query.waitlist.findMany({
        where: eq(waitlist.userId, session.user.id),
        with: {
            child: true,
            session: true,
        },
        orderBy: (wl, { desc }) => [desc(wl.createdAt)],
    });

    // Get total waitlist counts per session for context
    const waitlistCounts = new Map<string, number>();
    for (const entry of myWaitlistEntries) {
        if (!waitlistCounts.has(entry.sessionId)) {
            const total = await db.query.waitlist.findMany({
                where: eq(waitlist.sessionId, entry.sessionId),
                columns: { id: true },
            });
            waitlistCounts.set(entry.sessionId, total.length);
        }
    }

    return (
        <div>
            <Breadcrumb
                items={[
                    { label: "Dashboard", href: "/dashboard/parent" },
                    { label: "Registrations" },
                ]}
            />

            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Registrations</h1>
                <p className="text-muted-foreground">View your current and past camp enrollments.</p>
            </div>

            {myRegistrations.length === 0 && myWaitlistEntries.length === 0 ? (
                <div className="text-center p-12 border rounded-xl bg-muted/30">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">
                        No camp registrations found
                    </p>
                    <Link href="/dashboard/parent/sessions">
                        <Button>
                            Browse Available Sessions
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-10">
                    {myRegistrations.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold">Enrolled Sessions</h2>
                            <div className="grid grid-cols-1 gap-4">
                                {myRegistrations.map((registration) => (
                                    <div
                                        key={registration.id}
                                        className="p-6 border rounded-xl bg-card shadow-sm"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-semibold text-lg">
                                                        {registration.session.name}
                                                    </h3>
                                                    {registration.status === "confirmed" ? (
                                                        <Badge className="bg-green-500">
                                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                                            Confirmed
                                                        </Badge>
                                                    ) : registration.status === "pending" ? (
                                                        <Badge variant="outline" className="text-orange-600">
                                                            <AlertCircle className="h-3 w-3 mr-1" />
                                                            Pending Payment
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline">{registration.status}</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-1">
                                                    Child: <span className="font-medium text-foreground">{registration.child.firstName} {registration.child.lastName}</span>
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {formatDate(registration.session.startDate)} -{" "}
                                                    {formatDate(registration.session.endDate)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-bold">${registration.session.price}</p>
                                                {registration.amountPaid ? (
                                                    <p className="text-sm text-green-600">Paid</p>
                                                ) : registration.status === "pending" ? (
                                                    <Link href={`/checkout/${registration.id}`}>
                                                        <Button size="sm" className="mt-2">
                                                            Pay Now
                                                            <ArrowRight className="h-4 w-4 ml-1" />
                                                        </Button>
                                                    </Link>
                                                ) : null}
                                            </div>
                                        </div>

                                        {registration.session.description && (
                                            <p className="text-sm text-muted-foreground">
                                                {registration.session.description}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {myWaitlistEntries.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold">Waitlist</h2>
                            <div className="grid grid-cols-1 gap-4">
                                {myWaitlistEntries.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="p-6 border rounded-xl bg-card shadow-sm"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-semibold text-lg">
                                                        {entry.session.name}
                                                    </h3>
                                                    {entry.status === "waiting" ? (
                                                        <Badge variant="outline" className="text-blue-600">
                                                            Position #{entry.position} of {waitlistCounts.get(entry.sessionId) || entry.position}
                                                        </Badge>
                                                    ) : entry.status === "offered" ? (
                                                        <Badge className="bg-green-500">
                                                            Spot Available!
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline">{entry.status}</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-1">
                                                    Child: <span className="font-medium text-foreground">{entry.child.firstName} {entry.child.lastName}</span>
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {formatDate(entry.session.startDate)} -{" "}
                                                    {formatDate(entry.session.endDate)}
                                                </p>
                                                {entry.status === "offered" && entry.expiresAt && (
                                                    <p className="text-sm text-orange-600 mt-2">
                                                        Expires: {formatDate(entry.expiresAt)}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-bold">${entry.session.price}</p>
                                                {entry.status === "offered" && (
                                                    <Link href="/dashboard/parent/sessions">
                                                        {/* Redirect to sessions until a dedicated acceptance flow is added */}
                                                        <Button size="sm" className="mt-2">
                                                            Register Now
                                                            <ArrowRight className="h-4 w-4 ml-1" />
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
