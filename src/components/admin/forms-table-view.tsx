"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Copy, Eye, Trash, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { publishFormAction, unpublishFormAction } from "@/app/actions/form-actions";

interface Form {
  id: string;
  name: string;
  description: string | null;
  formType: string;
  status: string;
  isPublished: boolean;
  sessionName: string | null;
  fieldCount: number;
  submissionCount: number;
  updatedAt: Date;
}

interface FormsTableViewProps {
  forms: Form[];
}

export function FormsTableView({ forms }: FormsTableViewProps) {
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [loadingFormId, setLoadingFormId] = useState<string | null>(null);
  const router = useRouter();

  const toggleForm = (formId: string) => {
    setSelectedForms((prev) =>
      prev.includes(formId)
        ? prev.filter((id) => id !== formId)
        : [...prev, formId]
    );
  };

  const toggleAll = () => {
    if (selectedForms.length === forms.length) {
      setSelectedForms([]);
    } else {
      setSelectedForms(forms.map((f) => f.id));
    }
  };

  const handlePublishToggle = async (formId: string, currentlyPublished: boolean) => {
    setLoadingFormId(formId);
    try {
      if (currentlyPublished) {
        await unpublishFormAction(formId);
      } else {
        await publishFormAction(formId);
      }
      router.refresh();
    } catch (error) {
      console.error("Failed to toggle publish status:", error);
      alert("Failed to update form status. Please try again.");
    } finally {
      setLoadingFormId(null);
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedForms.length === forms.length && forms.length > 0}
                onCheckedChange={toggleAll}
              />
            </TableHead>
            <TableHead>Form Name</TableHead>
            <TableHead>Session</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Published</TableHead>
            <TableHead>Fields</TableHead>
            <TableHead>Submissions</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="w-[50px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {forms.map((form) => (
            <TableRow key={form.id}>
              <TableCell>
                <Checkbox
                  checked={selectedForms.includes(form.id)}
                  onCheckedChange={() => toggleForm(form.id)}
                />
              </TableCell>
              <TableCell>
                <Link
                  href={`/dashboard/admin/forms/${form.id}`}
                  className="hover:underline font-medium"
                >
                  {form.name}
                </Link>
                {form.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                    {form.description}
                  </p>
                )}
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {form.sessionName || "Camp-wide"}
                </span>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {form.formType}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {loadingFormId === form.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Switch
                      checked={form.isPublished}
                      onCheckedChange={() =>
                        handlePublishToggle(form.id, form.isPublished)
                      }
                    />
                  )}
                  <span className="text-sm">
                    {form.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {form.fieldCount || 0}
                </span>
              </TableCell>
              <TableCell>
                {form.submissionCount > 0 ? (
                  <Link
                    href={`/dashboard/admin/forms/${form.id}/submissions`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {form.submissionCount}
                  </Link>
                ) : (
                  <span className="text-sm text-muted-foreground">0</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(form.updatedAt), { addSuffix: true })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/admin/forms/${form.id}`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Bulk actions toolbar */}
      {selectedForms.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-6 py-3 rounded-lg shadow-lg flex items-center gap-4 z-50">
          <span className="font-medium">{selectedForms.length} selected</span>
          <Button variant="secondary" size="sm">
            Publish All
          </Button>
          <Button variant="secondary" size="sm">
            Unpublish All
          </Button>
          <Button variant="destructive" size="sm">
            Delete All
          </Button>
        </div>
      )}
    </>
  );
}
