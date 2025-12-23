"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileEdit, Trash2, Eye, EyeOff, Search, X, Grid3x3, List, MoreVertical, Copy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  bulkPublishFormsAction,
  bulkUnpublishFormsAction,
  bulkDeleteFormsAction,
  publishFormAction,
  unpublishFormAction,
} from "@/app/actions/form-actions";
import { toast } from "sonner";
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
import { formatDistanceToNow } from "date-fns";

export type FormListItem = {
  id: string;
  sessionId: string | null;
  createdBy: string | null;
  name: string;
  description: string | null;
  formType: string;
  status: string;
  isPublished: boolean;
  publishedAt: Date | null;
  version: number;
  aiActionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  sessionName: string | null;
  sessionStartDate: Date | null;
  fieldCount: number;
  submissionCount: number;
};

export function FormsListClient({ forms }: { forms: FormListItem[] }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [sessionFilter, setSessionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [loadingFormId, setLoadingFormId] = useState<string | null>(null);

  // Get unique sessions for filter dropdown
  const sessions = useMemo(() => {
    const uniqueSessions = new Map<
      string,
      { id: string; name: string; startDate: Date }
    >();
    forms.forEach((form) => {
      if (form.sessionId && form.sessionName && form.sessionStartDate) {
        uniqueSessions.set(form.sessionId, {
          id: form.sessionId,
          name: form.sessionName,
          startDate: form.sessionStartDate,
        });
      }
    });
    return Array.from(uniqueSessions.values());
  }, [forms]);

  // Filter forms
  const filteredForms = useMemo(() => {
    return forms.filter((form) => {
      // Search filter
      if (
        searchQuery &&
        !form.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !form.description?.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Session filter
      if (sessionFilter !== "all") {
        if (sessionFilter === "camp-wide" && form.sessionId !== null) {
          return false;
        }
        if (
          sessionFilter !== "camp-wide" &&
          form.sessionId !== sessionFilter
        ) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "published" && !form.isPublished) {
          return false;
        }
        if (statusFilter === "draft" && form.isPublished) {
          return false;
        }
      }

      return true;
    });
  }, [forms, searchQuery, sessionFilter, statusFilter]);

  // Select/deselect all
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredForms.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredForms.map((f) => f.id)));
    }
  };

  // Toggle individual form
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Bulk actions
  const handleBulkPublish = async () => {
    if (selectedIds.size === 0) return;

    setIsLoading(true);
    try {
      const result = await bulkPublishFormsAction(Array.from(selectedIds));
      toast.success(
        `Published ${result.successCount} of ${result.total} forms${result.failCount > 0 ? `, ${result.failCount} failed` : ""}`
      );
      setSelectedIds(new Set());
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to publish forms"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkUnpublish = async () => {
    if (selectedIds.size === 0) return;

    setIsLoading(true);
    try {
      const result = await bulkUnpublishFormsAction(Array.from(selectedIds));
      toast.success(
        `Unpublished ${result.successCount} of ${result.total} forms${result.failCount > 0 ? `, ${result.failCount} failed` : ""}`
      );
      setSelectedIds(new Set());
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to unpublish forms"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    if (
      !confirm(
        `Are you sure you want to delete ${selectedIds.size} form(s)? This action cannot be undone.`
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await bulkDeleteFormsAction(Array.from(selectedIds));
      toast.success(
        `Deleted ${result.successCount} of ${result.total} forms${result.failCount > 0 ? `, ${result.failCount} failed` : ""}`
      );
      setSelectedIds(new Set());
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete forms"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSessionFilter("all");
    setStatusFilter("all");
  };

  const hasActiveFilters =
    searchQuery || sessionFilter !== "all" || statusFilter !== "all";

  const handlePublishToggle = async (formId: string, currentlyPublished: boolean) => {
    setLoadingFormId(formId);
    try {
      if (currentlyPublished) {
        await unpublishFormAction(formId);
        toast.success("Form unpublished successfully");
      } else {
        await publishFormAction(formId);
        toast.success("Form published successfully");
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update form status");
    } finally {
      setLoadingFormId(null);
    }
  };

  return (
    <div>
      {/* Search & Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search forms by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* View Toggle */}
              <div className="flex gap-1 border rounded-md p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Session Filter */}
              <Select value={sessionFilter} onValueChange={setSessionFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Sessions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sessions</SelectItem>
                  <SelectItem value="camp-wide">Camp-wide</SelectItem>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="whitespace-nowrap"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            {/* Results count */}
            <div className="text-sm text-muted-foreground">
              Showing {filteredForms.length} of {forms.length} forms
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <Card className="mb-6 border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={selectedIds.size === filteredForms.length}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm font-medium">
                  {selectedIds.size} selected
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkPublish}
                  disabled={isLoading}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Publish All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkUnpublish}
                  disabled={isLoading}
                >
                  <EyeOff className="h-4 w-4 mr-1" />
                  Unpublish All
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Forms List */}
      {filteredForms.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {hasActiveFilters
              ? "No forms match your filters"
              : "No forms created yet"}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      ) : viewMode === "table" ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.size === filteredForms.length}
                    onCheckedChange={toggleSelectAll}
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
              {filteredForms.map((form) => (
                <TableRow key={form.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(form.id)}
                      onCheckedChange={() => toggleSelect(form.id)}
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
                      <Switch
                        checked={form.isPublished}
                        disabled={loadingFormId === form.id}
                        onCheckedChange={() =>
                          handlePublishToggle(form.id, form.isPublished)
                        }
                      />
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
                            <FileEdit className="h-4 w-4 mr-2" />
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
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredForms.map((form) => (
            <Card
              key={form.id}
              className={`hover:shadow-lg transition-shadow ${selectedIds.has(form.id) ? "ring-2 ring-primary" : ""}`}
            >
              <CardHeader>
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedIds.has(form.id)}
                    onCheckedChange={() => toggleSelect(form.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg mb-2">
                        {form.name}
                      </CardTitle>
                      <Badge variant={form.isPublished ? "default" : "outline"}>
                        {form.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {form.description || "No description"}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    {form.fieldCount || 0} fields •{" "}
                    {form.sessionName ?? "Camp-wide"}
                  </p>
                  {form.submissionCount > 0 && (
                    <p className="text-muted-foreground">
                      {form.submissionCount} submissions
                    </p>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Link
                      href={`/dashboard/admin/forms/${form.id}`}
                      className="flex-1"
                    >
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
      )}
    </div>
  );
}
