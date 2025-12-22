import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { registrations } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { CheckoutForm } from "@/components/checkout/checkout-form";

interface CheckoutPageProps {
  params: Promise<{ registrationId: string }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { registrationId } = await params;
  const session = await getSession();

  if (!session?.user) {
    redirect(`/login?redirect=/checkout/${registrationId}`);
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

  // If already paid, redirect to confirmation
  if (registration.status === "confirmed") {
    redirect(`/checkout/${registrationId}/confirmation`);
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-3xl font-bold mb-2">Checkout</h1>
      <p className="text-muted-foreground mb-8">
        Complete your registration payment
      </p>

      <CheckoutForm registration={registration} />
    </div>
  );
}
