import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import Link from "next/link";

export const metadata = {
  title: "Sign Up - Camp OS",
  description: "Create your camp organization account",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-5xl font-bold mb-4 text-gray-900 dark:text-white">
          Start Your Camp Journey
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          Create your organization account and start managing your camp in
          minutes. No credit card required.
        </p>
      </div>

      {/* Onboarding Form */}
      <OnboardingForm />

      {/* Login Link */}
      <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
        <p>
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
}
