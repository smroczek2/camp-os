import { getSession } from "@/lib/auth-helper";
import { redirect } from "next/navigation";
import { getFormAction } from "@/app/actions/form-actions";
import { DynamicForm } from "@/components/forms/form-renderer/dynamic-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { formSubmissions } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { CheckCircle2, Calendar, ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default async function ParentFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ formId: string }>;
  searchParams: Promise<{ childId?: string }>;
}) {
  const { formId } = await params;
  const { childId } = await searchParams;
  const session = await getSession();
  if (!session?.user) redirect("/login");

  let formConfig: Awaited<ReturnType<typeof getFormAction>> | null = null;
  try {
    formConfig = await getFormAction(formId);
  } catch {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Form Not Available</h1>
          <p className="text-muted-foreground">
            This form is not available or you do not have permission to access
            it.
          </p>
        </Card>
      </div>
    );
  }

  if (!formConfig) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Form Not Found</h1>
          <p className="text-muted-foreground">
            This form does not exist or has been removed.
          </p>
        </Card>
      </div>
    );
  }

  // Check if user has already submitted this form
  const existingSubmission = await db.query.formSubmissions.findFirst({
    where: and(
      eq(formSubmissions.formDefinitionId, formId),
      eq(formSubmissions.userId, session.user.id)
    ),
  });

  // Helper to format field values
  const formatFieldValue = (value: unknown): string => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  // If already submitted, show read-only view
  if (existingSubmission) {
    const submissionData = existingSubmission.submissionData as Record<
      string,
      unknown
    >;

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <Link href="/dashboard/parent">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>

          {/* Header with Status */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-3xl font-bold">{formConfig.name}</h1>
              <Badge className="bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            </div>
            {formConfig.description && (
              <p className="text-muted-foreground mb-4">
                {formConfig.description}
              </p>
            )}

            {/* Submission Info */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  Submitted on {formatDate(existingSubmission.createdAt)}
                </span>
              </div>
              <Badge variant="outline">{existingSubmission.status}</Badge>
            </div>
          </div>

          {/* Read-Only Form View */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Your Responses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {formConfig.fields.map((field) => {
                  const value = submissionData[field.fieldKey];

                  return (
                    <div
                      key={field.id}
                      className="pb-6 border-b last:border-b-0 last:pb-0"
                    >
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

                      <div className="mt-2 p-3 bg-muted/30 rounded-md">
                        <p className="text-sm">{formatFieldValue(value)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Info Message */}
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Note:</strong> This form has already been submitted. If
              you need to make changes, please contact the camp administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If not submitted yet, show form for submission
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/dashboard/parent">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-2">{formConfig.name}</h1>
        {formConfig.description && (
          <p className="text-muted-foreground mb-8">
            {formConfig.description}
          </p>
        )}

        <Card className="p-6">
          <DynamicForm formConfig={formConfig} childId={childId} />
        </Card>
      </div>
    </div>
  );
}
