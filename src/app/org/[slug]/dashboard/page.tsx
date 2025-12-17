import { db } from "@/lib/db";
import { organizations, organizationUsers, camps, children } from "@/lib/schema";
import { eq, count } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Building2, Users, Tent, Settings, Calendar } from "lucide-react";

interface OrgDashboardProps {
  params: Promise<{ slug: string }>;
}

export default async function OrgDashboard({ params }: OrgDashboardProps) {
  const { slug } = await params;

  // Get organization
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
  });

  if (!org) {
    notFound();
  }

  // Get stats
  const [userCountResult] = await db
    .select({ count: count() })
    .from(organizationUsers)
    .where(eq(organizationUsers.organizationId, org.id));

  const [campCountResult] = await db
    .select({ count: count() })
    .from(camps)
    .where(eq(camps.organizationId, org.id));

  const [childrenCountResult] = await db
    .select({ count: count() })
    .from(children)
    .where(eq(children.organizationId, org.id));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{org.name}</h1>
          <p className="text-muted-foreground">Organization Dashboard</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/org/${slug}/settings`}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCountResult.count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Camps</CardTitle>
            <Tent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campCountResult.count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{childrenCountResult.count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{org.status}</div>
            <p className="text-xs text-muted-foreground">
              {org.subscriptionTier} tier
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild variant="outline" className="h-auto py-4">
              <Link href={`/org/${slug}/settings`} className="flex flex-col items-center gap-2">
                <Settings className="h-6 w-6" />
                <span>Organization Settings</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4">
              <Link href={`/org/${slug}/camps`} className="flex flex-col items-center gap-2">
                <Tent className="h-6 w-6" />
                <span>Manage Camps</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4">
              <Link href={`/org/${slug}/sessions`} className="flex flex-col items-center gap-2">
                <Calendar className="h-6 w-6" />
                <span>Sessions</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Organization Info */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Contact Email</dt>
              <dd className="font-medium">{org.contactEmail}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Contact Phone</dt>
              <dd className="font-medium">{org.contactPhone || "Not set"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Timezone</dt>
              <dd className="font-medium">{org.timezone}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Limits</dt>
              <dd className="font-medium">
                {org.maxCampers} campers / {org.maxStaff} staff
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
