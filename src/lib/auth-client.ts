import { createAuthClient } from "better-auth/react"

function getAuthBaseURL() {
  // Always use window.location.origin on client to match actual request origin
  // This prevents "invalid origin" errors when accessing from different ports
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  // Server-side fallback
  return process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";
}

export const authClient = createAuthClient({
  baseURL: getAuthBaseURL(),
})

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
} = authClient
