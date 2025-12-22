"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckInButton } from "./check-in-button";
import { Search, AlertCircle, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpectedChild {
  childId: string;
  firstName: string;
  lastName: string;
  parentName: string;
  parentEmail: string;
  allergies: string[] | null;
  medicalNotes: string | null;
  attendance: {
    id: string;
    checkedInAt: Date | null;
    checkedOutAt: Date | null;
    checkedInBy: string | null;
    checkedOutBy: string | null;
    notes: string | null;
  } | null;
}

interface CheckInListProps {
  sessionId: string;
  childrenList: ExpectedChild[];
  onRefresh?: () => void;
}

export function CheckInList({ sessionId, childrenList, onRefresh }: CheckInListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter children based on search query
  const filteredChildren = useMemo(() => {
    if (!searchQuery.trim()) return childrenList;

    const query = searchQuery.toLowerCase();
    return childrenList.filter((child) => {
      const fullName = `${child.firstName} ${child.lastName}`.toLowerCase();
      const parentName = child.parentName.toLowerCase();
      return fullName.includes(query) || parentName.includes(query);
    });
  }, [childrenList, searchQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    const present = childrenList.filter(
      (c) => c.attendance?.checkedInAt && !c.attendance?.checkedOutAt
    ).length;
    const checkedOut = childrenList.filter((c) => c.attendance?.checkedOutAt).length;
    const notCheckedIn = childrenList.length - childrenList.filter((c) => c.attendance?.checkedInAt).length;

    return { present, checkedOut, notCheckedIn, total: childrenList.length };
  }, [childrenList]);

  const getStatusInfo = (child: ExpectedChild) => {
    if (!child.attendance || !child.attendance.checkedInAt) {
      return {
        icon: Clock,
        label: "Not Arrived",
        variant: "secondary" as const,
        color: "text-gray-600",
        bgColor: "bg-gray-100",
      };
    }

    if (!child.attendance.checkedOutAt) {
      return {
        icon: CheckCircle2,
        label: "Present",
        variant: "default" as const,
        color: "text-green-600",
        bgColor: "bg-green-100",
      };
    }

    return {
      icon: XCircle,
      label: "Left",
      variant: "secondary" as const,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    };
  };

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg bg-card">
          <p className="text-sm text-muted-foreground">Total Expected</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <p className="text-sm text-muted-foreground">Present</p>
          <p className="text-2xl font-bold text-green-600">{stats.present}</p>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <p className="text-sm text-muted-foreground">Not Arrived</p>
          <p className="text-2xl font-bold text-orange-600">{stats.notCheckedIn}</p>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <p className="text-sm text-muted-foreground">Checked Out</p>
          <p className="text-2xl font-bold text-blue-600">{stats.checkedOut}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by child name or parent name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Children List */}
      <div className="border rounded-xl overflow-hidden">
        {filteredChildren.length === 0 ? (
          <div className="text-center p-12 bg-muted/30">
            <p className="text-muted-foreground">
              {searchQuery ? "No children found matching your search" : "No children expected"}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredChildren.map((child) => {
              const statusInfo = getStatusInfo(child);
              const StatusIcon = statusInfo.icon;
              const hasMedicalInfo = child.allergies && child.allergies.length > 0 || child.medicalNotes;

              return (
                <div
                  key={child.childId}
                  className={cn(
                    "p-4 hover:bg-muted/30 transition-colors",
                    statusInfo.bgColor + "/30"
                  )}
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Child Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {child.firstName} {child.lastName}
                        </h3>
                        <Badge variant={statusInfo.variant} className={cn("flex items-center gap-1", statusInfo.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                        {hasMedicalInfo && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Medical Alert
                          </Badge>
                        )}
                      </div>

                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          Parent: <span className="text-foreground">{child.parentName}</span>
                        </p>

                        {/* Medical Info */}
                        {child.allergies && child.allergies.length > 0 && (
                          <p className="text-red-600 font-medium">
                            Allergies: {child.allergies.join(", ")}
                          </p>
                        )}
                        {child.medicalNotes && (
                          <p className="text-orange-600 font-medium">
                            Medical: {child.medicalNotes}
                          </p>
                        )}

                        {/* Check-in/out times */}
                        {child.attendance?.checkedInAt && (
                          <p>
                            Checked In:{" "}
                            <span className="text-foreground">
                              {new Date(child.attendance.checkedInAt).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </span>
                          </p>
                        )}
                        {child.attendance?.checkedOutAt && (
                          <p>
                            Checked Out:{" "}
                            <span className="text-foreground">
                              {new Date(child.attendance.checkedOutAt).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex-shrink-0">
                      <CheckInButton
                        childId={child.childId}
                        sessionId={sessionId}
                        attendance={child.attendance}
                        onSuccess={onRefresh}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
