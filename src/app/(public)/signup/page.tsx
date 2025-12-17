import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Sign Up - Camp OS",
  description: "Create your camp organization account",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            Camp OS
          </Link>
          <Link href="/dev-login">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-5xl font-bold mb-4">
          Start Your Camp Journey
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Create your organization account and start managing your camp in
          minutes. No credit card required.
        </p>
      </div>

      {/* Onboarding Form */}
      <OnboardingForm />

      {/* Footer */}
      <footer className="mt-12 py-8 border-t bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Already have an account?{" "}
            <Link href="/dev-login" className="text-blue-600 hover:underline">
              Log in here
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
