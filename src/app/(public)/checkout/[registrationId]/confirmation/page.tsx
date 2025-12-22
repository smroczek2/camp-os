import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { registrations } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Calendar, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface ConfirmationPageProps {
  params: Promise<{ registrationId: string }>;
}

export default async function ConfirmationPage({ params }: ConfirmationPageProps) {
  const { registrationId } = await params;
  const session = await getSession();

  if (!session?.user) {
    redirect(`/login?redirect=/checkout/${registrationId}/confirmation`);
  }

  // Get the registration with session and child details
  const registration = await db.query.registrations.findFirst({
    where: eq(registrations.id, registrationId),
    with: {
      session: true,
      child: true,
    },
  });

  if (!registration) {
    notFound();
  }

  // Verify this registration belongs to the current user
  if (registration.userId !== session.user.id) {
    redirect("/dashboard/parent");
  }

  // If not paid, redirect back to checkout
  if (registration.status !== "confirmed") {
    redirect(`/checkout/${registrationId}`);
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto mb-4">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Payment Confirmed!</h1>
        <p className="text-muted-foreground">
          Your registration has been successfully completed.
        </p>
      </div>

      <div className="p-6 border rounded-xl bg-card shadow-sm mb-8">
        <h2 className="font-semibold text-lg mb-4">Registration Details</h2>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{registration.session.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(registration.session.startDate)} - {formatDate(registration.session.endDate)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {registration.child.firstName} {registration.child.lastName}
              </p>
              <p className="text-sm text-muted-foreground">Registered Camper</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <span className="text-muted-foreground">Amount Paid</span>
            <span className="text-2xl font-bold text-green-600">
              ${registration.amountPaid}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <h3 className="font-medium text-blue-900 mb-2">What&apos;s Next?</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>Check your email for a confirmation receipt</li>
          <li>Complete any required forms in your dashboard</li>
          <li>Review the camp schedule and what to bring</li>
        </ul>
      </div>

      <div className="flex justify-center gap-4">
        <Link href="/dashboard/parent">
          <Button>
            Go to Dashboard
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
