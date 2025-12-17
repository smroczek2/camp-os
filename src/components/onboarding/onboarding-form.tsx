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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  User,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  onboardingSchema,
  generateSlug,
  type OnboardingInput,
  type OnboardingResult,
  type OnboardingError,
} from "@/types/onboarding";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
];

export function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    mode: "onChange",
    defaultValues: {
      timezone: "America/New_York",
      teamMembers: [],
    },
  });

  const organizationName = watch("organizationName");
  const organizationSlug = watch("organizationSlug");

  // Auto-generate slug from organization name
  const handleOrganizationNameChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const name = e.target.value;
    setValue("organizationName", name);

    // Auto-generate slug if user hasn't manually edited it
    if (!organizationSlug || organizationSlug === generateSlug(organizationName || "")) {
      setValue("organizationSlug", generateSlug(name));
    }
  };

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
        throw new Error(errorResult.error || "Failed to create organization");
      }

      // Success! Redirect to new organization dashboard
      const successResult = result as OnboardingResult;
      router.push(successResult.redirectUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 3));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 1 ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {step > 1 ? <CheckCircle className="h-5 w-5" /> : "1"}
            </div>
            <span className={step >= 1 ? "font-medium" : "text-muted-foreground"}>
              Organization
            </span>
          </div>

          <div className="flex-1 h-0.5 bg-muted mx-4" />

          <div className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 2 ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {step > 2 ? <CheckCircle className="h-5 w-5" /> : "2"}
            </div>
            <span className={step >= 2 ? "font-medium" : "text-muted-foreground"}>
              Admin Account
            </span>
          </div>

          <div className="flex-1 h-0.5 bg-muted mx-4" />

          <div className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 3 ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              3
            </div>
            <span className={step >= 3 ? "font-medium" : "text-muted-foreground"}>
              Review
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {step === 1 && (
                <>
                  <Building2 className="h-5 w-5" />
                  Organization Details
                </>
              )}
              {step === 2 && (
                <>
                  <User className="h-5 w-5" />
                  Admin Account
                </>
              )}
              {step === 3 && (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Review & Confirm
                </>
              )}
            </CardTitle>
            <CardDescription>
              {step === 1 &&
                "Tell us about your camp organization"}
              {step === 2 && "Create your administrator account"}
              {step === 3 &&
                "Review your information before creating your organization"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Step 1: Organization Details */}
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="organizationName">
                    Organization Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="organizationName"
                    placeholder="Pine Ridge Summer Camp"
                    {...register("organizationName")}
                    onChange={handleOrganizationNameChange}
                  />
                  {errors.organizationName && (
                    <p className="text-sm text-red-500">
                      {errors.organizationName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizationSlug">
                    Organization URL <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      /org/
                    </span>
                    <Input
                      id="organizationSlug"
                      placeholder="pine-ridge-camp"
                      {...register("organizationSlug")}
                    />
                    <span className="text-sm text-muted-foreground">
                      /dashboard
                    </span>
                  </div>
                  {errors.organizationSlug && (
                    <p className="text-sm text-red-500">
                      {errors.organizationSlug.message}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    This will be your organization&apos;s unique URL
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">
                    Contact Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="admin@pineridge.camp"
                    {...register("contactEmail")}
                  />
                  {errors.contactEmail && (
                    <p className="text-sm text-red-500">
                      {errors.contactEmail.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone (Optional)</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    {...register("contactPhone")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">
                    Timezone <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    defaultValue="America/New_York"
                    onValueChange={(value) => setValue("timezone", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Step 2: Admin Account */}
            {step === 2 && (
              <>
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

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="sarah@pineridge.camp"
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
              </>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Organization
                    </h3>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Name</dt>
                        <dd className="font-medium">{watch("organizationName")}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">URL</dt>
                        <dd className="font-medium font-mono text-blue-600">
                          /org/{watch("organizationSlug")}/dashboard
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Contact Email</dt>
                        <dd className="font-medium">{watch("contactEmail")}</dd>
                      </div>
                      {watch("contactPhone") && (
                        <div>
                          <dt className="text-muted-foreground">Phone</dt>
                          <dd className="font-medium">{watch("contactPhone")}</dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-muted-foreground">Timezone</dt>
                        <dd className="font-medium">
                          {watch("timezone")?.replace(/_/g, " ")}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="p-4 border rounded-lg bg-muted/30">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Administrator
                    </h3>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Name</dt>
                        <dd className="font-medium">
                          {watch("firstName")} {watch("lastName")}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Email</dt>
                        <dd className="font-medium">{watch("email")}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                    <h3 className="font-semibold mb-2 flex items-center gap-2 text-blue-900 dark:text-blue-100">
                      <CheckCircle className="h-4 w-4" />
                      Free Tier Included
                    </h3>
                    <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                      <li>• Up to 100 campers</li>
                      <li>• Up to 20 staff members</li>
                      <li>• Unlimited camps and sessions</li>
                      <li>• AI-powered form builder</li>
                      <li>• Medical records management</li>
                    </ul>
                  </div>
                </div>

                {error && (
                  <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/20">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-red-900 dark:text-red-100">
                          Error Creating Organization
                        </h4>
                        <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                          {error}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6">
              <div>
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={isSubmitting}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {step < 3 ? (
                  <Button type="button" onClick={nextStep}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Create Organization
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
