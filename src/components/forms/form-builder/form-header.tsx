import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
} from "@/components/ui/card";
import { Archive, CheckCircle2, ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

type FormHeaderProps = {
  formId: string;
  formName: string;
  formDescription?: string | null;
  status: string;
  isPublished: boolean;
  aiGenerated: boolean;
  submissionCount?: number;
  view: "details" | "preview";
  isEditing: boolean;
  saving: boolean;
  onViewChange: (view: "details" | "preview") => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onPublish: () => void;
  onArchive: () => void;
};

export function FormHeader({
  formId,
  formName,
  formDescription,
  status,
  isPublished,
  aiGenerated,
  submissionCount = 0,
  view,
  isEditing,
  saving,
  onViewChange,
  onEdit,
  onSave,
  onCancel,
  onPublish,
  onArchive,
}: FormHeaderProps) {
  return (
    <>
      <Link href="/dashboard/admin/forms">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Forms
        </Button>
      </Link>

      <Card className="mb-6">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold leading-tight truncate">
                {formName}
              </h1>
              {formDescription && (
                <p className="text-muted-foreground mt-1 line-clamp-2">
                  {formDescription}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Badge variant={isPublished ? "default" : "outline"}>
                {status}
              </Badge>
              {aiGenerated && (
                <Badge variant="secondary" className="text-xs">
                  AI Generated
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={view === "details" ? "default" : "outline"}
                size="sm"
                onClick={() => onViewChange("details")}
              >
                Details
              </Button>
              <Button
                type="button"
                variant={view === "preview" ? "default" : "outline"}
                size="sm"
                onClick={() => onViewChange("preview")}
              >
                Parent preview
              </Button>
              <Link href={`/dashboard/admin/forms/${formId}/submissions`}>
                <Button type="button" variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Submissions ({submissionCount})
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap gap-2">
              {!isEditing && view === "details" && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  Edit
                </Button>
              )}
              {isEditing && view === "details" && (
                <>
                  <Button onClick={onSave} size="sm" disabled={saving}>
                    {saving ? "Saving..." : "Save changes"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onCancel}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </>
              )}
              {!isPublished && status === "draft" && view === "details" && (
                <Button onClick={onPublish} size="sm">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Publish
                </Button>
              )}
              {status !== "archived" && view === "details" && (
                <Button variant="destructive" size="sm" onClick={onArchive}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>
    </>
  );
}
