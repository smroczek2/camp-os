"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MoreHorizontal,
  Eye,
  Settings,
  AlertTriangle,
  CheckCircle,
  Search,
} from "lucide-react";
import { OrganizationStats } from "@/app/actions/super-admin-actions";
import {
  suspendOrganizationAction,
  activateOrganizationAction,
  startPreviewModeAction,
} from "@/app/actions/super-admin-actions";
import { useRouter } from "next/navigation";

interface OrganizationsTableProps {
  organizations: OrganizationStats[];
}

export function OrganizationsTable({
  organizations,
}: OrganizationsTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredOrgs = organizations.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.contactEmail.toLowerCase().includes(search.toLowerCase()) ||
      org.slug.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || org.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleSuspend = async (orgId: string) => {
    const reason = prompt("Enter suspension reason:");
    if (reason) {
      await suspendOrganizationAction(orgId, reason);
    }
  };

  const handleActivate = async (orgId: string) => {
    await activateOrganizationAction(orgId);
  };

  const handlePreview = async (orgId: string, orgName: string, orgSlug: string) => {
    await startPreviewModeAction(orgId, orgName);
    router.push(`/org/${orgSlug}/dashboard?preview_org=${orgId}&preview_org_name=${encodeURIComponent(orgName)}`);
  };

  const statusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      trial: "secondary",
      suspended: "destructive",
      inactive: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const tierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      free: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      pro: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      enterprise: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[tier] || colors.free}`}>
        {tier}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead className="text-center">Users</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrgs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-muted-foreground">No organizations found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredOrgs.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <div>
                      <Link
                        href={`/super-admin/organizations/${org.id}`}
                        className="font-medium hover:underline"
                      >
                        {org.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {org.contactEmail}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{statusBadge(org.status)}</TableCell>
                  <TableCell>{tierBadge(org.subscriptionTier)}</TableCell>
                  <TableCell className="text-center">{org.userCount}</TableCell>
                  <TableCell>{formatDate(org.createdAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/super-admin/organizations/${org.id}`}>
                            <Settings className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handlePreview(org.id, org.name, org.slug)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Preview (Read-Only)
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {org.status === "suspended" ? (
                          <DropdownMenuItem
                            onClick={() => handleActivate(org.id)}
                            className="text-green-600"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Activate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleSuspend(org.id)}
                            className="text-red-600"
                          >
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Suspend
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {filteredOrgs.length} of {organizations.length} organizations
      </p>
    </div>
  );
}
