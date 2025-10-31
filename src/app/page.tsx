"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SetupChecklist } from "@/components/setup-checklist";
import { useDiagnostics } from "@/hooks/use-diagnostics";
import { StarterPromptModal } from "@/components/starter-prompt-modal";
import { Shield, Database, Palette, Bot } from "lucide-react";

export default function Home() {
  const { isAuthReady, isAiReady, loading } = useDiagnostics();
  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/5 border border-primary/10 shadow-sm">
                <Bot className="h-9 w-9 text-primary" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Agentic Coding
              <span className="block mt-2 bg-gradient-to-r from-foreground via-foreground/80 to-foreground/60 bg-clip-text text-transparent">
                Starter Kit
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              A complete foundation for AI applications with authentication, database,
              AI integration, and modern tooling
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group p-8 border rounded-xl bg-card shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/20">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/5 mb-4 group-hover:bg-primary/10 transition-colors">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-3">
                Authentication
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Better Auth with Google OAuth integration
              </p>
            </div>
            <div className="group p-8 border rounded-xl bg-card shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/20">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/5 mb-4 group-hover:bg-primary/10 transition-colors">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-3">
                Database
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Drizzle ORM with PostgreSQL setup
              </p>
            </div>
            <div className="group p-8 border rounded-xl bg-card shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/20">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/5 mb-4 group-hover:bg-primary/10 transition-colors">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-3">
                AI Ready
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Vercel AI SDK with OpenAI integration
              </p>
            </div>
            <div className="group p-8 border rounded-xl bg-card shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/20">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/5 mb-4 group-hover:bg-primary/10 transition-colors">
                <Palette className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-3">
                UI Components
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                shadcn/ui with Tailwind CSS
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Setup & Next Steps */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto space-y-12">
          <SetupChecklist />

          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Next Steps</h2>
              <p className="text-muted-foreground text-lg">Get started with your application</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-8 border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                    1
                  </div>
                  <h3 className="font-semibold text-xl">Set up environment variables</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Rename <code className="px-2 py-0.5 bg-muted rounded text-xs">.env.example</code> to <code className="px-2 py-0.5 bg-muted rounded text-xs">.env</code>
                </p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>POSTGRES_URL (PostgreSQL connection string)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>GOOGLE_CLIENT_ID (OAuth credentials)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>GOOGLE_CLIENT_SECRET (OAuth credentials)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>OPENAI_API_KEY (for AI functionality)</span>
                  </li>
                </ul>
              </div>

              <div className="p-8 border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                    2
                  </div>
                  <h3 className="font-semibold text-xl">Set up your database</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Run database migrations:
                </p>
                <div className="space-y-3">
                  <code className="text-sm bg-muted px-4 py-3 rounded-lg block font-mono">
                    npm run db:generate
                  </code>
                  <code className="text-sm bg-muted px-4 py-3 rounded-lg block font-mono">
                    npm run db:migrate
                  </code>
                </div>
              </div>

              <div className="p-8 border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                    3
                  </div>
                  <h3 className="font-semibold text-xl">Try the features</h3>
                </div>
                <div className="space-y-3">
                  {loading || !isAuthReady ? (
                    <Button size="lg" className="w-full" disabled={true}>
                      View Dashboard
                    </Button>
                  ) : (
                    <Button asChild size="lg" className="w-full">
                      <Link href="/dashboard">View Dashboard</Link>
                    </Button>
                  )}
                  {loading || !isAiReady ? (
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full"
                      disabled={true}
                    >
                      Try AI Chat
                    </Button>
                  ) : (
                    <Button
                      asChild
                      variant="outline"
                      size="lg"
                      className="w-full"
                    >
                      <Link href="/chat">Try AI Chat</Link>
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-8 border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                    4
                  </div>
                  <h3 className="font-semibold text-xl">Start building</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  Customize the components, add your own pages, and build your
                  application on top of this solid foundation.
                </p>
                <StarterPromptModal />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
