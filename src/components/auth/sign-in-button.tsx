"use client";

import { signIn, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function SignInButton() {
  const { data: session, isPending } = useSession();
  const [isSigningIn, setIsSigningIn] = useState(false);

  if (isPending) {
    return <Button disabled>Loading...</Button>;
  }

  if (session) {
    return null;
  }

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signIn.social({
        provider: "google",
        callbackURL:
          typeof window !== "undefined"
            ? `${window.location.origin}/dashboard`
            : "/dashboard",
      });
    } catch (error) {
      console.error("Sign in error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to sign in. Please check your authentication configuration.";
      alert(message);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <Button onClick={handleSignIn} disabled={isSigningIn}>
      {isSigningIn ? "Signing in..." : "Sign in"}
    </Button>
  );
}
