import { Suspense } from "react";
import { db } from "@/lib/db";
import { user, organizationUsers } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users } from "lucide-react";
import { getSession } from "@/lib/auth-helper";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Users - Camp OS Admin",
  description: "Manage all Camp OS users across organizations",
};

async function UsersList() {
  const session = await getSession();
  if (!session?.user || session.user.role !== "super_admin") {
    redirect("/unauthorized");
  }

  // Get all users with their organization memberships
  const users = await db.query.user.findMany({
    orderBy: [desc(user.createdAt)],
  });

  // Get organization memberships for each user
  const usersWithOrgs = await Promise.all(
    users.map(async (u) => {
      const memberships = await db.query.organizationUsers.findMany({
        where: eq(organizationUsers.userId, u.id),
        with: {
          organization: true,
        },
      });

      return {
        ...u,
        organizations: memberships.map((m) => ({
          id: m.organization.id,
          name: m.organization.name,
          role: m.role,
        })),
      };
    })
  );

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const roleBadge = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      super_admin: "destructive",
      admin: "default",
      staff: "secondary",
      nurse: "secondary",
      parent: "outline",
    };
    return <Badge variant={variants[role] || "outline"}>{role}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          All Users ({usersWithOrgs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Organizations</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersWithOrgs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <p className="text-muted-foreground">No users found</p>
                </TableCell>
              </TableRow>
            ) : (
              usersWithOrgs.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{roleBadge(u.role)}</TableCell>
                  <TableCell>
                    {u.organizations.length === 0 ? (
                      <span className="text-muted-foreground text-sm">None</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {u.organizations.map((org) => (
                          <Badge key={org.id} variant="outline" className="text-xs">
                            {org.name} ({org.role})
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(u.createdAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">
          View and manage users across all organizations
        </p>
      </div>

      <Suspense fallback={<div>Loading users...</div>}>
        <UsersList />
      </Suspense>
    </div>
  );
}
