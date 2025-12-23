"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SessionStatusBadge } from "@/components/admin/session-status-badge";
import { SessionsTableView } from "@/components/admin/sessions-table-view";
import { Calendar, Users, DollarSign, ChevronRight, Grid3x3, List } from "lucide-react";

interface Session {
  id: string;
  name: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  price: string;
  capacity: number;
  status: string;
  registrations: Array<{
    id: string;
    status: string;
    amountPaid: string | null;
  }>;
}

interface SessionsListClientProps {
  sessions: Session[];
}

export function SessionsListClient({ sessions }: SessionsListClientProps) {
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Transform sessions for table view
  const sessionsForTable = sessions.map((session) => {
    const confirmedCount = session.registrations.filter((r) => r.status === "confirmed").length;
    const revenue = session.registrations
      .filter((r) => r.status === "confirmed")
      .reduce((sum, r) => sum + (parseFloat(r.amountPaid || "0") || parseFloat(session.price)), 0);

    return {
      id: session.id,
      name: session.name,
      startDate: session.startDate,
      endDate: session.endDate,
      status: session.status,
      capacity: session.capacity,
      price: session.price,
      confirmedCount,
      revenue,
    };
  });

  return (
    <>
      {/* View Toggle */}
      <div className="flex justify-end mb-4">
        <div className="flex gap-1 border rounded-md p-1">
          <Button
            variant={viewMode === "cards" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("cards")}
          >
            <Grid3x3 className="h-4 w-4 mr-2" />
            Cards
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
          >
            <List className="h-4 w-4 mr-2" />
            Table
          </Button>
        </div>
      </div>

      {/* Content */}
      {viewMode === "table" ? (
        <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
          <SessionsTableView sessions={sessionsForTable} />
        </div>
      ) : (
        <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
          <div className="p-6 border-b bg-muted/30">
            <h2 className="text-xl font-semibold">All Sessions</h2>
          </div>
          <div className="divide-y">
            {sessions.map((campSession) => {
              const confirmedCount = campSession.registrations.filter(
                (r) => r.status === "confirmed"
              ).length;
              const fillRate = (confirmedCount / campSession.capacity) * 100;
              const isNearlyFull = fillRate >= 90;

              return (
                <Link
                  key={campSession.id}
                  href={`/dashboard/admin/programs/${campSession.id}`}
                  className={`block p-4 hover:bg-muted/30 transition-colors cursor-pointer ${
                    isNearlyFull ? "bg-orange-50 dark:bg-orange-950/20" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-lg">
                          {campSession.name}
                        </span>
                        <SessionStatusBadge
                          sessionId={campSession.id}
                          status={campSession.status}
                        />
                        {isNearlyFull && (
                          <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800">
                            90% Full
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(campSession.startDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          -{" "}
                          {new Date(campSession.endDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />${campSession.price}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {confirmedCount} / {campSession.capacity}
                        </span>
                        <span className={isNearlyFull ? "font-medium text-orange-600 dark:text-orange-400" : ""}>
                          {fillRate.toFixed(0)}% full
                        </span>
                      </div>
                      {campSession.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                          {campSession.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 ml-4">
                      <div className="w-32">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              fillRate >= 90
                                ? "bg-orange-500"
                                : fillRate >= 70
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            }`}
                            style={{ width: `${Math.min(fillRate, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-center mt-1 text-muted-foreground">
                          {fillRate.toFixed(0)}%
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
