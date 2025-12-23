"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  ResponsiveTable,
  MobileCardField,
} from "@/components/admin/responsive-table";
import { Calendar, User, Eye, X } from "lucide-react";
import Link from "next/link";

type SubmissionUser = {
  id: string;
  name: string | null;
  email: string;
} | null;

type SubmissionChild = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
} | null;

type SubmissionSession = {
  id: string;
  name: string;
  startDate: Date;
} | null;

export type SubmissionListItem = {
  id: string;
  formDefinitionId: string;
  userId: string | null;
  childId: string | null;
  registrationId: string | null;
  sessionId: string | null;
  submissionData: Record<string, unknown>;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  user: SubmissionUser;
  child: SubmissionChild;
  session: SubmissionSession;
};

export function SubmissionsListClient({
  submissions,
  formId,
}: {
  submissions: SubmissionListItem[];
  formId: string;
}) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      // Status filter
      if (statusFilter !== "all" && submission.status !== statusFilter) {
        return false;
      }

      // Date range filter
      if (fromDate) {
        const submissionDate = new Date(submission.createdAt);
        const fromDateTime = new Date(fromDate);
        if (submissionDate < fromDateTime) {
          return false;
        }
      }

      if (toDate) {
        const submissionDate = new Date(submission.createdAt);
        const toDateTime = new Date(toDate);
        // Set to end of day
        toDateTime.setHours(23, 59, 59, 999);
        if (submissionDate > toDateTime) {
          return false;
        }
      }

      return true;
    });
  }, [submissions, statusFilter, fromDate, toDate]);

  const clearFilters = () => {
    setStatusFilter("all");
    setFromDate("");
    setToDate("");
  };

  const hasActiveFilters =
    statusFilter !== "all" || fromDate !== "" || toDate !== "";

  return (
    <div>
      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="needs_revision">Needs Revision</SelectItem>
                </SelectContent>
              </Select>

              {/* From Date */}
              <div className="flex-1">
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  placeholder="From date"
                />
              </div>

              {/* To Date */}
              <div className="flex-1">
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  placeholder="To date"
                />
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="whitespace-nowrap"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Results count */}
            <div className="text-sm text-muted-foreground">
              Showing {filteredSubmissions.length} of {submissions.length}{" "}
              submissions
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table - Responsive */}
      {filteredSubmissions.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground mb-4">
            {hasActiveFilters
              ? "No submissions match your filters"
              : "No submissions yet"}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <ResponsiveTable
          data={filteredSubmissions}
          columns={[
            {
              header: "Parent",
              cell: (row) => {
                const submission = row as SubmissionListItem;
                return (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {submission.user?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {submission.user?.email || ""}
                      </p>
                    </div>
                  </div>
                );
              },
            },
            {
              header: "Child",
              cell: (row) => {
                const submission = row as SubmissionListItem;
                return submission.child ? (
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
                );
              },
            },
            {
              header: "Submitted",
              cell: (row) => {
                const submission = row as SubmissionListItem;
                return (
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
                );
              },
            },
            {
              header: "Status",
              cell: (row) => {
                const submission = row as SubmissionListItem;
                return (
                  <Badge
                    variant={
                      submission.status === "submitted"
                        ? "default"
                        : submission.status === "reviewed"
                          ? "outline"
                          : submission.status === "approved"
                            ? "default"
                            : "secondary"
                    }
                  >
                    {submission.status}
                  </Badge>
                );
              },
            },
            {
              header: "Session",
              cell: (row) => {
                const submission = row as SubmissionListItem;
                return submission.session ? (
                  <div>
                    <p className="text-sm">{submission.session.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(
                        submission.session.startDate
                      ).toLocaleDateString()}
                    </p>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">
                    No session
                  </span>
                );
              },
            },
            {
              header: "Actions",
              className: "text-right",
              cell: (row) => {
                const submission = row as SubmissionListItem;
                return (
                  <Link
                    href={`/dashboard/admin/forms/${formId}/submissions/${submission.id}`}
                  >
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </Link>
                );
              },
            },
          ]}
          mobileCardRenderer={(submission) => (
            <>
              <CardHeader>
                <CardTitle className="text-base flex items-start justify-between">
                  <div>
                    <p className="font-medium">
                      {submission.user?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground font-normal">
                      {submission.user?.email || ""}
                    </p>
                  </div>
                  <Badge
                    variant={
                      submission.status === "submitted"
                        ? "default"
                        : submission.status === "reviewed"
                          ? "outline"
                          : submission.status === "approved"
                            ? "default"
                            : "secondary"
                    }
                  >
                    {submission.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <MobileCardField label="Child">
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
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </MobileCardField>

                <MobileCardField label="Submitted">
                  <div>
                    <p className="text-sm">
                      {new Date(submission.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(submission.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </MobileCardField>

                {submission.session && (
                  <MobileCardField label="Session">
                    <div>
                      <p className="text-sm">{submission.session.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(
                          submission.session.startDate
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </MobileCardField>
                )}

                <div className="pt-2">
                  <Link
                    href={`/dashboard/admin/forms/${formId}/submissions/${submission.id}`}
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="h-4 w-4 mr-1" />
                      View Submission
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </>
          )}
          emptyMessage="No submissions found"
        />
      )}
    </div>
  );
}
