import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth-helper";
import {
  Tent,
  Users,
  Calendar,
  Shield,
  Heart,
  Activity,
  ArrowRight,
} from "lucide-react";

export default async function Home() {
  const session = await getSession();

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/10 to-green-500/10 border border-blue-500/20 shadow-lg">
                <Tent className="h-11 w-11 text-blue-600" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Camp OS
              <span className="block mt-2 bg-gradient-to-r from-blue-600 via-green-600 to-blue-600 bg-clip-text text-transparent">
                Camp Management Platform
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Complete camp management solution for parents, staff, and
              administrators
            </p>
          </div>

          {session?.user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="text-lg px-8">
                <Link href="/dashboard">
                  Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="text-lg px-8">
                <Link href="/dev-login">
                  Dev Login
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Three Integrated Surfaces
            </h2>
            <p className="text-muted-foreground text-lg">
              Designed for every role at your camp
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Parent Portal */}
            <div className="group p-8 border rounded-xl bg-card shadow-sm hover:shadow-xl transition-all duration-300 hover:border-blue-500/50 hover:-translate-y-1">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10 mb-4 group-hover:bg-blue-500/20 transition-colors">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-xl mb-3">Parent Portal</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Register children for camp sessions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Real-time check-in/out notifications</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>View daily activity updates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Incident notifications</span>
                </li>
              </ul>
            </div>

            {/* Staff Mobile App */}
            <div className="group p-8 border rounded-xl bg-card shadow-sm hover:shadow-xl transition-all duration-300 hover:border-green-500/50 hover:-translate-y-1">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/10 mb-4 group-hover:bg-green-500/20 transition-colors">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-xl mb-3">Staff Mobile App</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <span>Quick check-in/check-out</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <span>Incident reporting with photos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <span>View assigned rosters</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <span>Medical information access</span>
                </li>
              </ul>
            </div>

            {/* Admin Console */}
            <div className="group p-8 border rounded-xl bg-card shadow-sm hover:shadow-xl transition-all duration-300 hover:border-purple-500/50 hover:-translate-y-1">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-500/10 mb-4 group-hover:bg-purple-500/20 transition-colors">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-xl mb-3">Admin Console</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                  <span>Create and manage sessions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                  <span>Live attendance dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                  <span>Staff assignments</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                  <span>Registration management</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Built for Safety & Transparency
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-500/10">
                  <Heart className="h-5 w-5 text-red-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Medical Safety</h3>
                <p className="text-sm text-muted-foreground">
                  Allergy tracking, medication logs, and instant parent
                  notifications for any incidents
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Complete Audit Trail</h3>
                <p className="text-sm text-muted-foreground">
                  Event sourcing ensures every action is logged with full
                  traceability
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/10">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Real-Time Updates</h3>
                <p className="text-sm text-muted-foreground">
                  Parents receive instant notifications when children are
                  checked in, checked out, or involved in incidents
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500/10">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  Role-Based Security
                </h3>
                <p className="text-sm text-muted-foreground">
                  Granular permissions ensure staff only see their assigned
                  groups and parents only see their children
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!session?.user && (
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center p-12 border rounded-2xl bg-gradient-to-br from-blue-500/5 to-green-500/5 border-blue-500/20 shadow-lg">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Sign in to access your dashboard
            </p>
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/dev-login">
                Dev Login
              </Link>
            </Button>
          </div>
        </section>
      )}
    </main>
  );
}
