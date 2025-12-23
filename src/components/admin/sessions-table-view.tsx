"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Copy, Mail, Trash } from "lucide-react";
import { updateSessionAction } from "@/app/actions/session-actions";
import { formatDate } from "@/lib/utils";

interface SessionData {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: string;
  capacity: number;
  price: string;
  confirmedCount: number;
  revenue: number;
}

interface SessionsTableViewProps {
  sessions: SessionData[];
}

export function SessionsTableView({ sessions }: SessionsTableViewProps) {
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);
  const router = useRouter();

  const toggleSession = (sessionId: string) => {
    setSelectedSessions((prev) =>
      prev.includes(sessionId)
        ? prev.filter((id) => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const toggleAll = () => {
    if (selectedSessions.length === sessions.length) {
      setSelectedSessions([]);
    } else {
      setSelectedSessions(sessions.map((s) => s.id));
    }
  };

  const handleStatusChange = async (sessionId: string, newStatus: string) => {
    setLoadingSessionId(sessionId);
    try {
      await updateSessionAction({ sessionId, status: newStatus as "draft" | "open" | "closed" | "completed" });
      router.refresh();
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update session status. Please try again.");
    } finally {
      setLoadingSessionId(null);
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedSessions.length === 0) return;

    try {
      await Promise.all(
        selectedSessions.map((sessionId) =>
          updateSessionAction({ sessionId, status: newStatus as "draft" | "open" | "closed" | "completed" })
        )
      );
      setSelectedSessions([]);
      router.refresh();
    } catch (error) {
      console.error("Failed to bulk update status:", error);
      alert("Failed to update session statuses. Please try again.");
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedSessions.length === sessions.length && sessions.length > 0}
                onCheckedChange={toggleAll}
              />
            </TableHead>
            <TableHead>Session Name</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Revenue</TableHead>
            <TableHead className="w-[50px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => {
            const capacityPercent = (session.confirmedCount / session.capacity) * 100;
            const isNearlyFull = capacityPercent >= 90;
            const potentialRevenue = session.capacity * parseFloat(session.price);

            return (
              <TableRow
                key={session.id}
                className={isNearlyFull ? "bg-orange-50 dark:bg-orange-950/20" : ""}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedSessions.includes(session.id)}
                    onCheckedChange={() => toggleSession(session.id)}
                  />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/dashboard/admin/programs/${session.id}`}
                    className="hover:underline font-medium"
                  >
                    {session.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>
                      {formatDate(session.startDate)} - {formatDate(session.endDate)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    value={session.status}
                    onValueChange={(val) => handleStatusChange(session.id, val)}
                    disabled={loadingSessionId === session.id}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {session.confirmedCount}/{session.capacity}
                      </span>
                      {isNearlyFull && (
                        <Badge variant="destructive" className="text-xs">
                          90% Full
                        </Badge>
                      )}
                    </div>
                    <Progress value={capacityPercent} className="h-1" />
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <span className="font-semibold">${session.revenue.toFixed(0)}</span>
                    <span className="text-muted-foreground text-xs block">
                      / ${potentialRevenue.toFixed(0)} potential
                    </span>
                  </div>
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
                        <Link href={`/dashboard/admin/programs/${session.id}`}>
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="h-4 w-4 mr-2" />
                        Clone Session
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Mail className="h-4 w-4 mr-2" />
                        Email Registrants
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
            );
          })}
        </TableBody>
      </Table>

      {/* Bulk actions toolbar */}
      {selectedSessions.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-6 py-3 rounded-lg shadow-lg flex items-center gap-4 z-50">
          <span className="font-medium">{selectedSessions.length} selected</span>
          <Select onValueChange={handleBulkStatusChange}>
            <SelectTrigger className="w-40 bg-background text-foreground">
              <SelectValue placeholder="Change status..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open All</SelectItem>
              <SelectItem value="closed">Close All</SelectItem>
              <SelectItem value="draft">Draft All</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setSelectedSessions([])}
          >
            Clear Selection
          </Button>
        </div>
      )}
    </>
  );
}
