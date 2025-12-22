"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { processPaymentAction } from "@/app/actions/checkout-actions";
import {
  Loader2,
  CreditCard,
  Calendar,
  User,
  DollarSign,
  Shield,
  AlertCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

type Registration = {
  id: string;
  userId: string;
  status: string;
  session: {
    id: string;
    name: string;
    description: string | null;
    startDate: Date;
    endDate: Date;
    price: string;
  };
  child: {
    id: string;
    firstName: string;
    lastName: string;
  };
};

interface CheckoutFormProps {
  registration: Registration;
}

export function CheckoutForm({ registration }: CheckoutFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    try {
      // Simulate a brief payment processing delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const result = await processPaymentAction({
        registrationId: registration.id,
        amount: registration.session.price,
      });

      if (!result.success) {
        setError(result.error || "Payment failed. Please try again.");
        return;
      }

      // Redirect to confirmation page
      router.push(`/checkout/${registration.id}/confirmation`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <div className="p-6 border rounded-xl bg-card shadow-sm">
        <h2 className="font-semibold text-lg mb-4">Order Summary</h2>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-medium">{registration.session.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(registration.session.startDate)} -{" "}
                {formatDate(registration.session.endDate)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {registration.child.firstName} {registration.child.lastName}
              </p>
              <p className="text-sm text-muted-foreground">Camper</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <span className="font-medium">Total</span>
            <span className="text-2xl font-bold">
              ${registration.session.price}
            </span>
          </div>
        </div>
      </div>

      {/* Mock Payment Form */}
      <div className="p-6 border rounded-xl bg-card shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5" />
          <h2 className="font-semibold text-lg">Payment Details</h2>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
          <p className="text-sm text-amber-800 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>
              <strong>Demo Mode:</strong> No real payment will be processed.
              Click &quot;Pay Now&quot; to simulate a successful payment.
            </span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              placeholder="4242 4242 4242 4242"
              defaultValue="4242 4242 4242 4242"
              disabled
              className="bg-muted"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="expiry">Expiry</Label>
              <Input
                id="expiry"
                placeholder="MM/YY"
                defaultValue="12/25"
                disabled
                className="bg-muted"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cvc">CVC</Label>
              <Input
                id="cvc"
                placeholder="123"
                defaultValue="123"
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name">Cardholder Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              defaultValue="Demo User"
              disabled
              className="bg-muted"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <DollarSign className="h-4 w-4 mr-2" />
                Pay ${registration.session.price}
              </>
            )}
          </Button>
        </form>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Your payment is secure. By clicking &quot;Pay Now&quot;, you agree to our terms
        of service.
      </p>
    </div>
  );
}
