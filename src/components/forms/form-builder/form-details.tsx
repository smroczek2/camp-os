"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  publishFormAction,
  archiveFormAction,
} from "@/app/actions/form-actions";
import { useRouter } from "next/navigation";
import { Eye, Archive, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export function FormDetailsView({ form }: { form: any }) {
  const router = useRouter();

  const handlePublish = async () => {
    try {
      await publishFormAction(form.id);
      router.refresh();
    } catch (error) {
      alert(
        `Error: ${error instanceof Error ? error.message : "Failed to publish"}`
      );
    }
  };

  const handleArchive = async () => {
    if (
      confirm("Archive this form? It will no longer be available to users.")
    ) {
      try {
        await archiveFormAction(form.id);
        router.push("/dashboard/admin/forms");
      } catch (error) {
        alert(
          `Error: ${error instanceof Error ? error.message : "Failed to archive"}`
        );
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link href="/dashboard/admin/forms">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Forms
          </Button>
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{form.name}</h1>
            <p className="text-muted-foreground">{form.description}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant={form.isPublished ? "default" : "outline"}>
              {form.status}
            </Badge>
            {form.aiActionId && (
              <Badge variant="secondary" className="text-xs">
                AI Generated
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mb-6">
          {!form.isPublished && form.status === "draft" && (
            <Button onClick={handlePublish}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Publish Form
            </Button>
          )}
          {form.status !== "archived" && (
            <Button variant="destructive" onClick={handleArchive}>
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
          )}
        </div>

        {/* Form Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {form.fields?.length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Fields</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {form.submissions?.length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Submissions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium">
                {form.session
                  ? `Session: ${new Date(form.session.startDate).toLocaleDateString()}`
                  : `Camp: ${form.camp?.name}`}
              </div>
              <p className="text-sm text-muted-foreground">Scope</p>
            </CardContent>
          </Card>
        </div>

        {/* Fields List */}
        <Card>
          <CardHeader>
            <CardTitle>Form Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {form.fields && form.fields.length > 0 ? (
                form.fields.map((field: any, idx: number) => (
                  <div
                    key={field.id}
                    className="p-4 border rounded-lg bg-muted/30"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-mono text-muted-foreground">
                            {idx + 1}.
                          </span>
                          <p className="font-medium">{field.label}</p>
                        </div>
                        {field.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {field.description}
                          </p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {field.fieldType}
                          </Badge>
                          {field.validationRules?.required && (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          )}
                          {field.conditionalLogic?.showIf && (
                            <Badge variant="secondary" className="text-xs">
                              Conditional
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Options if present */}
                    {field.options && field.options.length > 0 && (
                      <div className="mt-3 pl-6 border-l-2">
                        <p className="text-xs text-muted-foreground mb-2">
                          Options:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {field.options.map((opt: any) => (
                            <Badge
                              key={opt.value}
                              variant="outline"
                              className="text-xs"
                            >
                              {opt.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No fields configured
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
