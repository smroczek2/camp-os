import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { sessions } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import {
  Users,
  DollarSign,
  GraduationCap,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { SessionStatusBadge } from "@/components/admin/session-status-badge";
import { CopyLinkButton } from "@/components/admin/copy-link-button";
import { EditSessionDialog } from "@/components/admin/edit-session-dialog";
import { RegistrationList } from "@/components/admin/registration-list";
import { SessionActionsDropdown } from "@/components/admin/session-actions-dropdown";
import { WaitlistTable } from "@/components/admin/waitlist-table";
import { SessionFormsTable } from "@/components/admin/session-forms-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumb } from "@/components/dashboard/breadcrumb";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ sessionId: string }>;
}

function formatGradeDisplay(grade: number): string {
  if (grade === -1) return "PreK";
  if (grade === 0) return "K";
  return String(grade);
}

export default async function SessionDetailPage({ params }: Props) {
  const { sessionId } = await params;
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const campSession = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    with: {
      registrations: {
        with: {
          child: true,
          user: true,
        },
      },
      waitlist: {
        with: {
          child: true,
          user: true,
        },
      },
      formDefinitions: true,
    },
  });

  if (!campSession) {
    notFound();
  }

  const confirmedCount = campSession.registrations.filter(
    (r) => r.status === "confirmed"
  ).length;
  const pendingCount = campSession.registrations.filter(
    (r) => r.status === "pending"
  ).length;
  const waitlistCount = campSession.waitlist?.length || 0;
  const revenue = campSession.registrations
    .filter((r) => r.status === "confirmed")
    .reduce((sum, r) => sum + (parseFloat(r.amountPaid || "0") || parseFloat(campSession.price)), 0);

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
    if (campSession.minGrade !== null && campSession.maxGrade !== null) {
      eligibilityParts.push(
        `Grades ${formatGradeDisplay(campSession.minGrade)}-${formatGradeDisplay(campSession.maxGrade)}`
      );
    } else if (campSession.minGrade !== null) {
      eligibilityParts.push(`Grade ${formatGradeDisplay(campSession.minGrade)}+`);
    } else if (campSession.maxGrade !== null) {
      eligibilityParts.push(`Up to Grade ${formatGradeDisplay(campSession.maxGrade)}`);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard/admin" },
          { label: "Sessions", href: "/dashboard/admin/programs" },
          { label: campSession.name },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{campSession.name}</h1>
            <SessionStatusBadge
              sessionId={campSession.id}
              status={campSession.status}
            />
          </div>
          <p className="text-muted-foreground">
            {formatDate(campSession.startDate)} - {formatDate(campSession.endDate)}
          </p>
          {campSession.description && (
            <p className="mt-2 text-muted-foreground">{campSession.description}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CopyLinkButton sessionId={campSession.id} />
          <Link
            href={`/sessions/${campSession.id}`}
            target="_blank"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Public Page
          </Link>
          <EditSessionDialog session={campSession} />
          <SessionActionsDropdown
            sessionId={campSession.id}
            sessionName={campSession.name}
            hasRegistrations={campSession.registrations.length > 0}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 border rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{confirmedCount}</p>
              <p className="text-xs text-muted-foreground">Confirmed</p>
            </div>
          </div>
        </div>

        <div className="p-4 border rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-500/10">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending Payment</p>
            </div>
          </div>
        </div>

        <div className="p-4 border rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500/10">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{waitlistCount}</p>
              <p className="text-xs text-muted-foreground">Waitlist</p>
            </div>
          </div>
        </div>

        <div className="p-4 border rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/10">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">${revenue.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Revenue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="registrations" className="mb-8">
        <TabsList className="mb-6">
          <TabsTrigger value="registrations">
            Registrations ({campSession.registrations.length})
          </TabsTrigger>
          <TabsTrigger value="waitlist">
            Waitlist ({waitlistCount})
          </TabsTrigger>
          <TabsTrigger value="forms">
            Forms ({campSession.formDefinitions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="details">
            Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registrations">
          <RegistrationList
            registrations={campSession.registrations}
            sessionId={campSession.id}
            sessionPrice={campSession.price}
          />
        </TabsContent>

        <TabsContent value="waitlist">
          <WaitlistTable waitlist={campSession.waitlist || []} />
        </TabsContent>

        <TabsContent value="forms">
          <SessionFormsTable
            forms={campSession.formDefinitions || []}
            sessionId={campSession.id}
          />
        </TabsContent>

        <TabsContent value="details">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Pricing */}
            <div className="p-4 border rounded-xl bg-card shadow-sm">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Pricing
              </h3>
              <p className="text-2xl font-bold">${campSession.price}</p>
              <p className="text-sm text-muted-foreground">per registration</p>
            </div>

            {/* Eligibility */}
            {eligibilityParts.length > 0 && (
              <div className="p-4 border rounded-xl bg-card shadow-sm">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Eligibility
                </h3>
                <div className="flex flex-wrap gap-2">
                  {eligibilityParts.map((part, idx) => (
                    <Badge key={idx} variant="outline">
                      {part}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Registration Window */}
            {(campSession.registrationOpenDate || campSession.registrationCloseDate) && (
              <div className="p-4 border rounded-xl bg-card shadow-sm">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Registration Window
                </h3>
                <div className="space-y-2 text-sm">
                  {campSession.registrationOpenDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Opens</span>
                      <span>{formatDate(campSession.registrationOpenDate)}</span>
                    </div>
                  )}
                  {campSession.registrationCloseDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Closes</span>
                      <span>{formatDate(campSession.registrationCloseDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Details */}
            {(campSession.specialInstructions || campSession.whatToBring) && (
              <div className="p-4 border rounded-xl bg-card shadow-sm md:col-span-2 lg:col-span-3">
                <h3 className="font-semibold mb-3">Additional Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {campSession.specialInstructions && (
                    <div>
                      <p className="text-sm font-medium mb-1">Special Instructions</p>
                      <p className="text-sm text-muted-foreground">
                        {campSession.specialInstructions}
                      </p>
                    </div>
                  )}
                  {campSession.whatToBring && (
                    <div>
                      <p className="text-sm font-medium mb-1">What to Bring</p>
                      <p className="text-sm text-muted-foreground">
                        {campSession.whatToBring}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
