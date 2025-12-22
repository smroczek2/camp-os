"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  User,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  onboardingSchema,
  type OnboardingInput,
  type OnboardingResult,
  type OnboardingError,
} from "@/types/onboarding";

export function OnboardingForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: OnboardingInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = (await response.json()) as OnboardingResult | OnboardingError;

      if (!response.ok || !result.success) {
        const errorResult = result as OnboardingError;
        throw new Error(errorResult.error || "Failed to create account");
      }

      // Success! Redirect to dashboard
      const successResult = result as OnboardingResult;
      router.push(successResult.redirectUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-md mx-auto py-12 px-4">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Create Admin Account
            </CardTitle>
            <CardDescription>
              Set up your administrator account to get started
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  placeholder="Sarah"
                  {...register("firstName")}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  placeholder="Johnson"
                  {...register("lastName")}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="sarah@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
              <p className="text-sm text-muted-foreground">
                This will be your login email
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Minimum 8 characters with uppercase, lowercase, and number
              </p>
            </div>

            {error && (
              <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900 dark:text-red-100">
                      Error Creating Account
                    </h4>
                    <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Create Account
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
