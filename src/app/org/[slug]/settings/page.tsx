import { db } from "@/lib/db";
import { organizations } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Mail, Phone, Globe, Users, Tent } from "lucide-react";

interface OrgSettingsProps {
  params: Promise<{ slug: string }>;
}

export default async function OrgSettings({ params }: OrgSettingsProps) {
  const { slug } = await params;

  // Get organization
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
  });

  if (!org) {
    notFound();
  }

  const tierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      free: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      pro: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      enterprise: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[tier] || colors.free}`}>
        {tier}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization settings
        </p>
      </div>

      {/* Organization Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Information
          </CardTitle>
          <CardDescription>
            Basic information about your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Organization Name
              </label>
              <p className="text-lg font-medium mt-1">{org.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                URL Slug
              </label>
              <p className="text-lg font-medium mt-1 font-mono">/{org.slug}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Status
              </label>
              <div className="mt-1">
                <Badge variant={org.status === "active" ? "default" : "secondary"}>
                  {org.status}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Subscription Tier
              </label>
              <div className="mt-1">{tierBadge(org.subscriptionTier)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Contact Email
                </label>
                <p className="font-medium">{org.contactEmail}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Contact Phone
                </label>
                <p className="font-medium">{org.contactPhone || "Not set"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Timezone
                </label>
                <p className="font-medium">{org.timezone}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Plan Limits
          </CardTitle>
          <CardDescription>
            Current limits based on your subscription tier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{org.maxCampers}</p>
                <p className="text-sm text-muted-foreground">Max Campers</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Tent className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{org.maxStaff}</p>
                <p className="text-sm text-muted-foreground">Max Staff</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
