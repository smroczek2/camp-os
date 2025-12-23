"use client";

import { useState, useEffect } from "react";
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
  Clock,
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
  showCountdown?: boolean;
}

export function CheckoutForm({ registration, showCountdown = false }: CheckoutFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const router = useRouter();

  // Countdown timer effect
  useEffect(() => {
    if (!showCountdown) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showCountdown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

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

  const handlePayLater = () => {
    router.push("/dashboard/parent/registrations");
  };

  return (
    <div className="space-y-6">
      {/* Countdown Timer (only shown when from=registration) */}
      {showCountdown && (
        <div className="p-4 border rounded-xl bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-semibold text-orange-900 dark:text-orange-100">
                  Complete payment within 15 minutes
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Your spot is reserved. Pay now to confirm your registration.
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-orange-600 tabular-nums">
                {formatTime(timeLeft)}
              </div>
              <p className="text-xs text-orange-600">remaining</p>
            </div>
          </div>
        </div>
      )}

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

          {showCountdown && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  or
                </span>
              </div>
            </div>
          )}

          {showCountdown && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              size="lg"
              onClick={handlePayLater}
              disabled={isProcessing}
            >
              Pay Later
            </Button>
          )}
        </form>

        {showCountdown && (
          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Pay Later:</strong> Your registration will remain pending. Payment deadline is{" "}
              <strong>{formatDate(new Date(registration.session.startDate.getTime() - 7 * 24 * 60 * 60 * 1000))}</strong>{" "}
              (7 days before session start).
            </p>
          </div>
        )}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Your payment is secure. By clicking &quot;Pay Now&quot;, you agree to our terms
        of service.
      </p>
    </div>
  );
}
