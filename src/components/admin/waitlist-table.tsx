"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ListOrdered, UserCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface WaitlistEntry {
  id: string;
  position: number;
  status: string;
  offeredAt: Date | null;
  expiresAt: Date | null;
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

interface WaitlistTableProps {
  waitlist: WaitlistEntry[];
}

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  waiting: { label: "Waiting", variant: "outline" },
  offered: { label: "Offered", variant: "default" },
  expired: { label: "Expired", variant: "secondary" },
  converted: { label: "Converted", variant: "default" },
};

export function WaitlistTable({ waitlist }: WaitlistTableProps) {
  if (waitlist.length === 0) {
    return (
      <div className="border rounded-xl bg-card shadow-sm">
        <div className="p-6 border-b bg-muted/30 flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ListOrdered className="h-5 w-5" />
            Waitlist
          </h2>
        </div>
        <div className="text-center p-12">
          <ListOrdered className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-2">No one on the waitlist</p>
          <p className="text-sm text-muted-foreground">
            The waitlist will automatically populate when the session reaches capacity.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
      <div className="p-6 border-b bg-muted/30 flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <ListOrdered className="h-5 w-5" />
          Waitlist ({waitlist.length})
        </h2>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]">Position</TableHead>
            <TableHead>Camper</TableHead>
            <TableHead>Parent</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Added</TableHead>
            <TableHead>Offer Expires</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {waitlist.map((entry) => {
            const config = statusConfig[entry.status] || statusConfig.waiting;

            return (
              <TableRow key={entry.id}>
                <TableCell className="text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold">
                    {entry.position}
                  </span>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">
                      {entry.child.firstName} {entry.child.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      DOB: {formatDate(entry.child.dateOfBirth)}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <Link
                      href={`/dashboard/admin/accounts/${entry.user.id}`}
                      className="font-medium hover:text-primary transition-colors flex items-center gap-1 group"
                    >
                      {entry.user.name}
                      <UserCircle className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    <p className="text-sm text-muted-foreground">{entry.user.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={config.variant}>{config.label}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(entry.createdAt)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {entry.expiresAt ? formatDate(entry.expiresAt) : "-"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
