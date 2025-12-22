import { getSession } from "@/lib/auth-helper";
import { redirect } from "next/navigation";
import { getFormSubmissionsAction, getFormAction } from "@/app/actions/form-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Download, Eye, Calendar, User } from "lucide-react";
import Link from "next/link";

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

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">No submissions yet</p>
              <p className="text-sm text-muted-foreground">
                Submissions will appear here once parents complete this form
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parent</TableHead>
                    <TableHead>Child</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{submission.user?.name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">
                              {submission.user?.email || ""}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {submission.child ? (
                          <div>
                            <p className="font-medium">
                              {submission.child.firstName} {submission.child.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Age{" "}
                              {Math.floor(
                                (Date.now() -
                                  new Date(submission.child.dateOfBirth).getTime()) /
                                  31557600000
                              )}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm">
                              {new Date(submission.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(submission.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            submission.status === "submitted"
                              ? "default"
                              : submission.status === "reviewed"
                                ? "outline"
                                : "secondary"
                          }
                        >
                          {submission.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {submission.session ? (
                          <div>
                            <p className="text-sm">{submission.session.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(submission.session.startDate).toLocaleDateString()}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">No session</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/dashboard/admin/forms/${formId}/submissions/${submission.id}`}
                        >
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
