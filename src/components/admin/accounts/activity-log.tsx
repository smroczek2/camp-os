"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface ActivityEvent {
  id: string;
  streamId: string;
  eventType: string;
  eventData: Record<string, unknown>;
  version: number;
  timestamp: Date;
  userId: string | null;
}

interface ActivityLogProps {
  initialEvents: ActivityEvent[];
  initialTotal: number;
  accountId: string;
  onFilterChange?: (filters: {
    eventType?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page: number;
  }) => void;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  ChildCreated: "Child Added",
  ChildUpdated: "Child Updated",
  RegistrationCreated: "Registration Created",
  RegistrationCanceled: "Registration Canceled",
  PaymentRecorded: "Payment Recorded",
  ChargeAdded: "Charge Added",
  RefundIssued: "Refund Issued",
  AccountNoteAdded: "Note Added",
  AccountNoteUpdated: "Note Updated",
  AccountNoteDeleted: "Note Deleted",
};

const EVENT_TYPE_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ChildCreated: "default",
  ChildUpdated: "secondary",
  RegistrationCreated: "default",
  RegistrationCanceled: "destructive",
  PaymentRecorded: "default",
  ChargeAdded: "secondary",
  RefundIssued: "destructive",
  AccountNoteAdded: "secondary",
  AccountNoteUpdated: "secondary",
  AccountNoteDeleted: "destructive",
};

export function ActivityLog({
  initialEvents,
  initialTotal,
  onFilterChange,
}: ActivityLogProps) {
  const [events] = useState(initialEvents);
  const [total] = useState(initialTotal);
  const [currentPage, setCurrentPage] = useState(1);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("");
  const [dateFromFilter, setDateFromFilter] = useState<string>("");
  const [dateToFilter, setDateToFilter] = useState<string>("");

  const itemsPerPage = 50;
  const totalPages = Math.ceil(total / itemsPerPage);

  const handleApplyFilters = () => {
    if (!onFilterChange) return;

    onFilterChange({
      eventType: eventTypeFilter || undefined,
      dateFrom: dateFromFilter ? new Date(dateFromFilter) : undefined,
      dateTo: dateToFilter ? new Date(dateToFilter) : undefined,
      page: 1,
    });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setEventTypeFilter("");
    setDateFromFilter("");
    setDateToFilter("");

    if (onFilterChange) {
      onFilterChange({ page: 1 });
    }
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);

    if (onFilterChange) {
      onFilterChange({
        eventType: eventTypeFilter || undefined,
        dateFrom: dateFromFilter ? new Date(dateFromFilter) : undefined,
        dateTo: dateToFilter ? new Date(dateToFilter) : undefined,
        page,
      });
    }
  };

  const formatEventData = (eventType: string, data: Record<string, unknown>): string => {
    switch (eventType) {
      case "ChildCreated":
      case "ChildUpdated":
        return `${data.firstName} ${data.lastName}`;
      case "RegistrationCreated":
      case "RegistrationCanceled":
        return data.sessionName ? `Session: ${data.sessionName}` : "Session registration";
      case "PaymentRecorded":
        return `$${(Number(data.amount) / 100).toFixed(2)} via ${data.paymentMethod}`;
      case "ChargeAdded":
        return `$${(Number(data.amount) / 100).toFixed(2)} - ${data.description}`;
      case "RefundIssued":
        return `$${(Number(data.amount) / 100).toFixed(2)} - ${data.reason}`;
      case "AccountNoteAdded":
      case "AccountNoteUpdated":
        return data.note ? String(data.note).substring(0, 50) + "..." : "Note";
      default:
        return JSON.stringify(data).substring(0, 100);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="eventType">Event Type</Label>
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger id="eventType">
                  <SelectValue placeholder="All events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All events</SelectItem>
                  {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dateFrom">From Date</Label>
              <div className="relative">
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                />
                <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div>
              <Label htmlFor="dateTo">To Date</Label>
              <div className="relative">
                <Input
                  id="dateTo"
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                />
                <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={handleApplyFilters} className="flex-1">
                Apply
              </Button>
              <Button onClick={handleClearFilters} variant="outline">
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log ({total} events)</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No activity found for this account.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start justify-between border-b pb-4 last:border-0"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={EVENT_TYPE_VARIANTS[event.eventType] || "outline"}>
                        {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(event.timestamp), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                    <p className="text-sm">{formatEventData(event.eventType, event.eventData)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
