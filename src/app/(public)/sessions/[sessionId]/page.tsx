import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { sessions, user } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Users,
  DollarSign,
  Clock,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getSession } from "@/lib/auth-helper";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ sessionId: string }>;
}

export default async function PublicSessionPage({ params }: Props) {
  const { sessionId } = await params;

  // Check if user is logged in
  const authSession = await getSession();
  let userRole: string | null = null;

  if (authSession?.user) {
    const userRecord = await db.query.user.findFirst({
      where: eq(user.id, authSession.user.id),
    });
    userRole = userRecord?.role || null;

    // If parent is logged in, redirect them directly to parent dashboard with register param
    if (userRole === "parent") {
      redirect(`/dashboard/parent?register=${sessionId}`);
    }
  }

  const campSession = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    with: {
      registrations: true,
    },
  });

  if (!campSession) {
    notFound();
  }

  const confirmedRegistrations = campSession.registrations.filter(
    (r) => r.status === "confirmed"
  ).length;

  const spotsLeft = campSession.capacity - confirmedRegistrations;
  const isOpen = campSession.status === "open";
  const isFull = spotsLeft <= 0;

  // Format eligibility display
  const eligibilityParts: string[] = [];
  if (campSession.minAge || campSession.maxAge) {
    if (campSession.minAge && campSession.maxAge) {
      eligibilityParts.push(`Ages ${campSession.minAge}-${campSession.maxAge}`);
    } else if (campSession.minAge) {
      eligibilityParts.push(`Ages ${campSession.minAge}+`);
    } else if (campSession.maxAge) {
      eligibilityParts.push(`Ages up to ${campSession.maxAge}`);
    }
  }
  if (campSession.minGrade !== null || campSession.maxGrade !== null) {
    const formatGrade = (g: number) => (g === -1 ? "PreK" : g === 0 ? "K" : `${g}`);
    if (campSession.minGrade !== null && campSession.maxGrade !== null) {
      eligibilityParts.push(
        `Grades ${formatGrade(campSession.minGrade)}-${formatGrade(campSession.maxGrade)}`
      );
    } else if (campSession.minGrade !== null) {
      eligibilityParts.push(`Grade ${formatGrade(campSession.minGrade)}+`);
    } else if (campSession.maxGrade !== null) {
      eligibilityParts.push(`Up to Grade ${formatGrade(campSession.maxGrade)}`);
    }
  }

  // Check if registration is open based on window dates
  const now = new Date();
  const registrationWindowOpen =
    !campSession.registrationOpenDate || new Date(campSession.registrationOpenDate) <= now;
  const registrationWindowClosed =
    campSession.registrationCloseDate && new Date(campSession.registrationCloseDate) < now;

  const canRegister = isOpen && !isFull && registrationWindowOpen && !registrationWindowClosed;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            {/* Status Badge */}
            <div className="mb-4">
              {canRegister ? (
                <Badge className="bg-green-500 text-white px-4 py-1">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Registration Open
                </Badge>
              ) : isFull ? (
                <Badge variant="destructive" className="px-4 py-1">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Session Full
                </Badge>
              ) : registrationWindowClosed ? (
                <Badge variant="outline" className="px-4 py-1">
                  <Clock className="h-4 w-4 mr-2" />
                  Registration Closed
                </Badge>
              ) : !registrationWindowOpen ? (
                <Badge variant="outline" className="px-4 py-1">
                  <Clock className="h-4 w-4 mr-2" />
                  Coming Soon
                </Badge>
              ) : (
                <Badge variant="outline" className="px-4 py-1 capitalize">
                  {campSession.status}
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{campSession.name}</h1>

            {campSession.description && (
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {campSession.description}
              </p>
            )}
          </div>

          {/* Key Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 border rounded-xl bg-card shadow-sm text-center">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <p className="text-sm text-muted-foreground">Dates</p>
              <p className="font-medium text-sm">
                {formatDate(campSession.startDate)}
              </p>
              <p className="font-medium text-sm">
                - {formatDate(campSession.endDate)}
              </p>
            </div>

            <div className="p-4 border rounded-xl bg-card shadow-sm text-center">
              <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <p className="text-sm text-muted-foreground">Price</p>
              <p className="font-bold text-2xl">${campSession.price}</p>
            </div>

            <div className="p-4 border rounded-xl bg-card shadow-sm text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <p className="text-sm text-muted-foreground">Spots Left</p>
              <p className={`font-bold text-2xl ${spotsLeft < 5 ? "text-orange-600" : "text-green-600"}`}>
                {spotsLeft > 0 ? spotsLeft : "None"}
              </p>
            </div>

            <div className="p-4 border rounded-xl bg-card shadow-sm text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-indigo-600" />
              <p className="text-sm text-muted-foreground">Capacity</p>
              <p className="font-bold text-2xl">{campSession.capacity}</p>
            </div>
          </div>

          {/* Eligibility */}
          {eligibilityParts.length > 0 && (
            <div className="mb-8 p-6 border rounded-xl bg-card shadow-sm">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Eligibility Requirements
              </h2>
              <div className="flex flex-wrap gap-2">
                {eligibilityParts.map((part, idx) => (
                  <Badge key={idx} variant="outline" className="px-3 py-1">
                    {part}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Registration Window */}
          {(campSession.registrationOpenDate || campSession.registrationCloseDate) && (
            <div className="mb-8 p-6 border rounded-xl bg-card shadow-sm">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Registration Window
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {campSession.registrationOpenDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Opens</p>
                    <p className="font-medium">{formatDate(campSession.registrationOpenDate)}</p>
                  </div>
                )}
                {campSession.registrationCloseDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Closes</p>
                    <p className="font-medium">{formatDate(campSession.registrationCloseDate)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Details */}
          {(campSession.specialInstructions || campSession.whatToBring) && (
            <div className="mb-8 p-6 border rounded-xl bg-card shadow-sm">
              {campSession.specialInstructions && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Special Instructions</h3>
                  <p className="text-muted-foreground">{campSession.specialInstructions}</p>
                </div>
              )}
              {campSession.whatToBring && (
                <div>
                  <h3 className="font-semibold mb-2">What to Bring</h3>
                  <p className="text-muted-foreground">{campSession.whatToBring}</p>
                </div>
              )}
            </div>
          )}

          {/* CTA */}
          <div className="text-center">
            {userRole === "admin" ? (
              <div className="space-y-4">
                <Link href={`/dashboard/admin/programs/${sessionId}`}>
                  <Button size="lg" className="text-lg px-8 py-6">
                    View Admin Details
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
                <p className="text-sm text-muted-foreground">
                  You&apos;re viewing this page as an admin. This is the public link parents will see.
                </p>
              </div>
            ) : canRegister ? (
              <Link href={`/login?redirect=/dashboard/parent?register=${sessionId}`}>
                <Button size="lg" className="text-lg px-8 py-6">
                  Register Now
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            ) : (
              <div className="space-y-4">
                <Button size="lg" disabled className="text-lg px-8 py-6">
                  {isFull
                    ? "Session Full"
                    : registrationWindowClosed
                      ? "Registration Closed"
                      : !registrationWindowOpen
                        ? "Registration Not Yet Open"
                        : "Registration Unavailable"}
                </Button>
                {!registrationWindowOpen && campSession.registrationOpenDate && (
                  <p className="text-muted-foreground">
                    Registration opens {formatDate(campSession.registrationOpenDate)}
                  </p>
                )}
              </div>
            )}

            {!userRole && (
              <p className="mt-4 text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
