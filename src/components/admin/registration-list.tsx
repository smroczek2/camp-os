"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, MoreHorizontal, Mail, CheckCircle2, Clock, Download, Loader2, UserCircle } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { updateRegistrationStatusAction } from "@/app/actions/session-actions";

interface Registration {
  id: string;
  status: string;
  amountPaid: string | null;
  createdAt: Date;
  child: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface RegistrationListProps {
  registrations: Registration[];
  sessionId: string;
  sessionPrice: string;
}

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "Pending", variant: "outline" },
  confirmed: { label: "Confirmed", variant: "default" },
  canceled: { label: "Canceled", variant: "destructive" },
  refunded: { label: "Refunded", variant: "secondary" },
};

export function RegistrationList({
  registrations,
  sessionId,
  sessionPrice,
}: RegistrationListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();

  async function handleStatusChange(
    registrationId: string,
    newStatus: "pending" | "confirmed" | "canceled" | "refunded"
  ) {
    setLoadingId(registrationId);
    try {
      await updateRegistrationStatusAction({
        registrationId,
        status: newStatus,
        amountPaid: newStatus === "confirmed" ? sessionPrice : undefined,
      });
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  async function handleExportCSV() {
    const headers = ["Camper Name", "Date of Birth", "Parent Name", "Parent Email", "Status", "Amount Paid", "Registered At"];
    const rows = registrations.map((r) => [
      r.child.firstName + " " + r.child.lastName,
      formatDate(r.child.dateOfBirth),
      r.user.name,
      r.user.email,
      r.status,
      r.amountPaid || "",
      formatDate(r.createdAt),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => '"' + String(cell).replace(/"/g, '""') + '"').join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "registrations-" + sessionId + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (registrations.length === 0) {
    return (
      <div className="border rounded-xl bg-card shadow-sm">
        <div className="p-6 border-b bg-muted/30 flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Registrations
          </h2>
        </div>
        <div className="text-center p-12">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-2">No registrations yet</p>
          <p className="text-sm text-muted-foreground">
            Share the registration link with parents to start getting sign-ups.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
      <div className="p-6 border-b bg-muted/30 flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Registrations ({registrations.length})
        </h2>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Camper</TableHead>
            <TableHead>Parent</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Registered</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {registrations.map((registration) => {
            const config = statusConfig[registration.status] || statusConfig.pending;
            const isLoading = loadingId === registration.id;

            return (
              <TableRow key={registration.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">
                      {registration.child.firstName} {registration.child.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      DOB: {formatDate(registration.child.dateOfBirth)}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <Link
                      href={`/dashboard/admin/accounts/${registration.user.id}`}
                      className="font-medium hover:text-primary transition-colors flex items-center gap-1 group"
                    >
                      {registration.user.name}
                      <UserCircle className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    <a
                      href={"mailto:" + registration.user.email}
                      className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                    >
                      <Mail className="h-3 w-3" />
                      {registration.user.email}
                    </a>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={config.variant}>
                    {registration.status === "confirmed" && (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    )}
                    {registration.status === "pending" && (
                      <Clock className="h-3 w-3 mr-1" />
                    )}
                    {config.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  {registration.amountPaid ? (
                    <span className="text-green-600 font-medium">
                      ${registration.amountPaid}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(registration.createdAt)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={isLoading}>
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreHorizontal className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {registration.status === "pending" && (
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(registration.id, "confirmed")}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                          Confirm Payment
                        </DropdownMenuItem>
                      )}
                      {registration.status === "confirmed" && (
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(registration.id, "refunded")}
                        >
                          Refund
                        </DropdownMenuItem>
                      )}
                      {registration.status !== "canceled" && (
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(registration.id, "canceled")}
                          className="text-destructive"
                        >
                          Cancel Registration
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/admin/accounts/${registration.user.id}`}>
                          <UserCircle className="h-4 w-4 mr-2" />
                          View Account
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => window.open("mailto:" + registration.user.email)}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Email Parent
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
