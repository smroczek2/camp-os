import { getSession } from "@/lib/auth-helper";
import { redirect } from "next/navigation";
import { getFormSubmissionsAction, getFormAction } from "@/app/actions/form-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import Link from "next/link";
import { SubmissionsListClient } from "@/components/admin/submissions-list-client";

export default async function FormSubmissionsPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  const session = await getSession();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  // Fetch form details and submissions
  let formConfig: Awaited<ReturnType<typeof getFormAction>> | null = null;
  let submissions: Awaited<ReturnType<typeof getFormSubmissionsAction>> = [];

  try {
    [formConfig, submissions] = await Promise.all([
      getFormAction(formId),
      getFormSubmissionsAction(formId),
    ]);
  } catch (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Error Loading Submissions</h1>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : "Could not load form submissions"}
          </p>
          <Link href="/dashboard/admin/forms">
            <Button className="mt-4">Back to Forms</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Should not happen since we catch errors above, but TypeScript needs this
  if (!formConfig) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Form Not Found</h1>
          <p className="text-muted-foreground">Could not load form details</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/dashboard/admin/forms"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Forms
            </Link>
            <span className="text-muted-foreground">/</span>
            <Link
              href={`/dashboard/admin/forms/${formId}`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {formConfig.name}
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm">Submissions</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">Form Submissions</h1>
          <p className="text-muted-foreground">
            View and manage submissions for {formConfig.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/admin/forms/${formId}/submissions/export?format=csv`}>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </Link>
          <Link href={`/dashboard/admin/forms/${formId}/submissions/export?format=json`}>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{submissions.length}</div>
            <p className="text-sm text-muted-foreground">Total Submissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {submissions.filter((s) => s.status === "submitted").length}
            </div>
            <p className="text-sm text-muted-foreground">Submitted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {submissions.filter((s) => s.status === "reviewed").length}
            </div>
            <p className="text-sm text-muted-foreground">Reviewed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{formConfig.fields.length}</div>
            <p className="text-sm text-muted-foreground">Form Fields</p>
          </CardContent>
        </Card>
      </div>

      {/* Submissions List with Filters */}
      {submissions.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-2">No submissions yet</p>
          <p className="text-sm text-muted-foreground">
            Submissions will appear here once parents complete this form
          </p>
        </div>
      ) : (
        <SubmissionsListClient submissions={submissions} formId={formId} />
      )}
    </div>
  );
}
