import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tent } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { EmailSignInForm } from "@/components/auth/email-sign-in-form";
import { getSession } from "@/lib/auth-helper";

export const metadata = {
  title: "Sign In - Camp OS",
  description: "Sign in to your Camp OS account",
};

export default async function LoginPage() {
  // Redirect if already signed in
  const session = await getSession();

  if (session?.user) {
    // Super admins go to admin portal, others go to dashboard
    if (session.user.role === "super_admin") {
      redirect("/super-admin");
    }
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-green-500/10 border border-blue-500/20">
              <Tent className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to your Camp OS account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <EmailSignInForm />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <GoogleSignInButton />

          <div className="text-center text-sm pt-2">
            <p className="text-muted-foreground">
              Camp administrator?{" "}
              <Link href="/signup" className="text-blue-600 hover:underline font-medium">
                Set up your camp here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
