"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Building2,
  Users,
  Mail,
  Phone,
  Globe,
  Calendar,
  Eye,
  AlertTriangle,
  CheckCircle,
  Save,
} from "lucide-react";
import {
  suspendOrganizationAction,
  activateOrganizationAction,
  startPreviewModeAction,
  updateOrganizationAction,
} from "@/app/actions/super-admin-actions";

interface OrganizationDetailsProps {
  data: {
    organization: {
      id: string;
      name: string;
      slug: string;
      status: string;
      subscriptionTier: string;
      maxCampers: number | null;
      maxStaff: number | null;
      contactEmail: string;
      contactPhone: string | null;
      timezone: string | null;
      createdAt: Date;
      updatedAt: Date;
    };
    users: Array<{
      id: string;
      role: string;
      status: string;
      joinedAt: Date | null;
      user: {
        id: string;
        name: string;
        email: string;
        role: string;
      };
    }>;
  };
}

export function OrganizationDetails({ data }: OrganizationDetailsProps) {
  const router = useRouter();
  const { organization, users } = data;

  const [maxCampers, setMaxCampers] = useState(organization.maxCampers || 100);
  const [maxStaff, setMaxStaff] = useState(organization.maxStaff || 20);
  const [tier, setTier] = useState(organization.subscriptionTier);
  const [isSaving, setIsSaving] = useState(false);

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleSuspend = async () => {
    const reason = prompt("Enter suspension reason:");
    if (reason) {
      await suspendOrganizationAction(organization.id, reason);
    }
  };

  const handleActivate = async () => {
    await activateOrganizationAction(organization.id);
  };

  const handlePreview = async () => {
    await startPreviewModeAction(organization.id, organization.name);
    router.push(
      `/org/${organization.slug}/dashboard?preview_org=${organization.id}&preview_org_name=${encodeURIComponent(organization.name)}`
    );
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await updateOrganizationAction(organization.id, {
        maxCampers,
        maxStaff,
        subscriptionTier: tier,
      });
    } finally {
      setIsSaving(false);
    }
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

  const roleBadge = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      owner: "default",
      admin: "secondary",
      member: "outline",
    };
    return <Badge variant={variants[role] || "outline"}>{role}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/super-admin/organizations">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {organization.name}
              </h1>
              {statusBadge(organization.status)}
            </div>
            <p className="text-muted-foreground">/{organization.slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="mr-2 h-4 w-4" />
            Preview (Read-Only)
          </Button>
          {organization.status === "suspended" ? (
            <Button variant="default" onClick={handleActivate}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Activate
            </Button>
          ) : (
            <Button variant="destructive" onClick={handleSuspend}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              Suspend
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Organization Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organization Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contact Email
                </dt>
                <dd className="mt-1">{organization.contactEmail}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contact Phone
                </dt>
                <dd className="mt-1">{organization.contactPhone || "Not provided"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Timezone
                </dt>
                <dd className="mt-1">{organization.timezone || "America/New_York"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Created
                </dt>
                <dd className="mt-1">{formatDate(organization.createdAt)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tier">Subscription Tier</Label>
              <Select value={tier} onValueChange={setTier}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxCampers">Max Campers</Label>
              <Input
                id="maxCampers"
                type="number"
                value={maxCampers}
                onChange={(e) => setMaxCampers(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxStaff">Max Staff</Label>
              <Input
                id="maxStaff"
                type="number"
                value={maxStaff}
                onChange={(e) => setMaxStaff(Number(e.target.value))}
              />
            </div>

            <Button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="w-full"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Organization Members ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Org Role</TableHead>
                <TableHead>App Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">No members found</p>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((membership) => (
                  <TableRow key={membership.id}>
                    <TableCell className="font-medium">
                      {membership.user.name}
                    </TableCell>
                    <TableCell>{membership.user.email}</TableCell>
                    <TableCell>{roleBadge(membership.role)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{membership.user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          membership.status === "active"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {membership.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(membership.joinedAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
