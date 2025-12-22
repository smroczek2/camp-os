"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signUp } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

export function EmailSignInForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === "signup") {
        // Sign up new user
        const result = await signUp.email({
          email,
          password,
          name: name || email.split("@")[0], // Use email prefix as name if not provided
          callbackURL: "/dashboard",
        });

        if (result.error) {
          setError(result.error.message || "Failed to create account");
          setIsLoading(false);
          return;
        }
      } else {
        // Sign in existing user
        const result = await signIn.email({
          email,
          password,
          callbackURL: "/dashboard",
        });

        if (result.error) {
          setError(result.error.message || "Invalid email or password");
          setIsLoading(false);
          return;
        }
      }

      // Redirect on success
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === "signup" && (
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          disabled={isLoading}
        />
        {mode === "signup" && (
          <p className="text-xs text-muted-foreground">
            Must be at least 8 characters
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {mode === "signin" ? "Sign In" : "Create Account"}
      </Button>

      <div className="text-center text-sm">
        {mode === "signin" ? (
          <p className="text-muted-foreground">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
              className="text-blue-600 hover:underline font-medium"
            >
              Sign up
            </button>
          </p>
        ) : (
          <p className="text-muted-foreground">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError(null);
              }}
              className="text-blue-600 hover:underline font-medium"
            >
              Sign in
            </button>
          </p>
        )}
      </div>
    </form>
  );
}
