import { getSession } from "@/lib/auth-helper";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formSubmissions } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Calendar, FileText, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Breadcrumb } from "@/components/dashboard/breadcrumb";

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ formId: string; submissionId: string }>;
}) {
  const { formId, submissionId } = await params;
  const session = await getSession();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  // Fetch submission
  const submission = await db.query.formSubmissions.findFirst({
    where: and(
      eq(formSubmissions.id, submissionId),
      eq(formSubmissions.formDefinitionId, formId)
    ),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
      child: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
        },
      },
      session: {
        columns: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
        },
      },
      formDefinition: {
        with: {
          fields: {
            with: {
              options: true,
            },
            orderBy: (fields, { asc }) => [asc(fields.displayOrder)],
          },
        },
      },
    },
  });

  if (!submission) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Submission Not Found</h1>
          <p className="text-muted-foreground">
            This submission does not exist or has been removed.
          </p>
          <Link href={`/dashboard/admin/forms/${formId}/submissions`}>
            <Button className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Submissions
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const submissionData = submission.submissionData as Record<string, unknown>;

  // Helper to format field values
  const formatFieldValue = (value: unknown): string => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard/admin" },
          { label: "Forms", href: "/dashboard/admin/forms" },
          { label: submission.formDefinition.name, href: `/dashboard/admin/forms/${formId}` },
          { label: "Submissions", href: `/dashboard/admin/forms/${formId}/submissions` },
          { label: "Submission" },
        ]}
      />

      {/* Back Button */}
      <div className="mb-6">
        <Link href={`/dashboard/admin/forms/${formId}/submissions`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Submissions
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Submission Details</h1>
            <p className="text-muted-foreground">
              {submission.formDefinition.name}
            </p>
          </div>
          <Badge
            variant={
              submission.status === "submitted"
                ? "default"
                : submission.status === "reviewed"
                  ? "outline"
                  : "secondary"
            }
            className="text-sm"
          >
            {submission.status}
          </Badge>
        </div>
      </div>

      {/* Submission Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Submitted By
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{submission.user?.name || "Unknown"}</p>
            <p className="text-sm text-muted-foreground">
              {submission.user?.email || ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Submission Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">
              {new Date(submission.createdAt).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="text-sm text-muted-foreground">
              {new Date(submission.createdAt).toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>

        {submission.child && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                Child Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                {submission.child.firstName} {submission.child.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                DOB: {new Date(submission.child.dateOfBirth).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        )}

        {submission.session && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Session
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{submission.session.name}</p>
              <p className="text-sm text-muted-foreground">
                Starts: {new Date(submission.session.startDate).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Form Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Form Responses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {submission.formDefinition.fields.map((field) => {
              const value = submissionData[field.fieldKey];

              return (
                <div
                  key={field.id}
                  className="pb-6 border-b last:border-b-0 last:pb-0"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <label className="font-medium text-sm block mb-1">
                        {field.label}
                        {field.validationRules &&
                          (field.validationRules as { required?: boolean })
                            .required && (
                            <span className="text-red-600 ml-1">*</span>
                          )}
                      </label>
                      {field.description && (
                        <p className="text-xs text-muted-foreground mb-2">
                          {field.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {field.fieldType}
                    </Badge>
                  </div>

                  <div className="mt-2 p-3 bg-muted/30 rounded-md">
                    <p className="text-sm">
                      {formatFieldValue(value)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="mt-8 flex gap-4">
        {submission.status === "submitted" && (
          <Button>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Mark as Reviewed
          </Button>
        )}
        <Link href={`/dashboard/admin/forms/${formId}/submissions`}>
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to All Submissions
          </Button>
        </Link>
      </div>
    </div>
  );
}
