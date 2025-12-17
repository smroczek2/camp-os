import { getSession } from "@/lib/auth-helper";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formDefinitions, camps, sessions, formFields, formSubmissions } from "@/lib/schema";
import { eq, sql, desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sparkles, FileEdit } from "lucide-react";
import Link from "next/link";

export default async function FormsPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }

  // Check admin role
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (session.user as any).role;
  if (userRole !== "admin") {
    redirect("/dashboard");
  }

  // Fetch all forms with aggregated counts (optimized query)
  const forms = await db
    .select({
      id: formDefinitions.id,
      campId: formDefinitions.campId,
      sessionId: formDefinitions.sessionId,
      createdBy: formDefinitions.createdBy,
      name: formDefinitions.name,
      description: formDefinitions.description,
      formType: formDefinitions.formType,
      status: formDefinitions.status,
      isPublished: formDefinitions.isPublished,
      publishedAt: formDefinitions.publishedAt,
      version: formDefinitions.version,
      aiActionId: formDefinitions.aiActionId,
      createdAt: formDefinitions.createdAt,
      updatedAt: formDefinitions.updatedAt,
      campName: camps.name,
      sessionStartDate: sessions.startDate,
      fieldCount: sql<number>`COUNT(DISTINCT ${formFields.id})`.as("field_count"),
      submissionCount: sql<number>`COUNT(DISTINCT ${formSubmissions.id})`.as("submission_count"),
    })
    .from(formDefinitions)
    .leftJoin(camps, eq(formDefinitions.campId, camps.id))
    .leftJoin(sessions, eq(formDefinitions.sessionId, sessions.id))
    .leftJoin(formFields, eq(formFields.formDefinitionId, formDefinitions.id))
    .leftJoin(formSubmissions, eq(formSubmissions.formDefinitionId, formDefinitions.id))
    .groupBy(
      formDefinitions.id,
      camps.name,
      sessions.id,
      sessions.startDate
    )
    .orderBy(desc(formDefinitions.createdAt));

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Form Builder</h1>
          <p className="text-muted-foreground">
            Create custom forms for camp registration and data collection
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/admin/forms/ai-chat">
            <Button>
              <Sparkles className="h-4 w-4 mr-2" />
              Create with AI
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{forms.length}</div>
            <p className="text-sm text-muted-foreground">Total Forms</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {forms.filter((f) => f.isPublished).length}
            </div>
            <p className="text-sm text-muted-foreground">Published</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {forms.filter((f) => f.status === "draft").length}
            </div>
            <p className="text-sm text-muted-foreground">Drafts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {forms.filter((f) => f.aiActionId).length}
            </div>
            <p className="text-sm text-muted-foreground">AI Generated</p>
          </CardContent>
        </Card>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forms.map((form) => (
          <Card key={form.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{form.name}</CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {form.description || "No description"}
                  </p>
                </div>
                <Badge variant={form.isPublished ? "default" : "outline"}>
                  {form.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  {form.fieldCount || 0} fields •{" "}
                  {form.campName ?? "Unknown"}
                </p>
                {form.submissionCount > 0 && (
                  <p className="text-muted-foreground">
                    {form.submissionCount} submissions
                  </p>
                )}
                <div className="flex gap-2 mt-4">
                  <Link href={`/dashboard/admin/forms/${form.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      <FileEdit className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {forms.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No forms created yet. Get started with AI!
          </p>
          <Link href="/dashboard/admin/forms/ai-chat">
            <Button>
              <Sparkles className="h-4 w-4 mr-2" />
              Create Your First Form
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
