"use client";

import Link from "next/link";
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
import { FileText, Eye } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface FormDefinition {
  id: string;
  name: string;
  description: string | null;
  formType: string;
  status: string;
  isPublished: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SessionFormsTableProps {
  forms: FormDefinition[];
  sessionId: string;
}

export function SessionFormsTable({ forms }: SessionFormsTableProps) {
  if (forms.length === 0) {
    return (
      <div className="border rounded-xl bg-card shadow-sm">
        <div className="p-6 border-b bg-muted/30 flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Forms
          </h2>
        </div>
        <div className="text-center p-12">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-2">No forms assigned to this session</p>
          <p className="text-sm text-muted-foreground">
            Create forms in the Form Builder and assign them to this session.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/admin/forms/ai-chat">Create Form</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
      <div className="p-6 border-b bg-muted/30 flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Forms ({forms.length})
        </h2>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/admin/forms">View All Forms</Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Form Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {forms.map((form) => (
            <TableRow key={form.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{form.name}</p>
                  {form.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {form.description}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {form.formType}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={form.isPublished ? "default" : "outline"}>
                  {form.isPublished ? "Published" : "Draft"}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(form.updatedAt)}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/dashboard/admin/forms/${form.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
