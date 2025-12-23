import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { user, children, registrations } from "@/lib/schema";
import { sql, ilike, or, eq, desc } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search } from "lucide-react";
import Link from "next/link";
import { Breadcrumb } from "@/components/dashboard/breadcrumb";

type SearchParams = {
  search?: string;
};

export default async function AccountsListPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/login");
  }

  const params = await searchParams;
  const searchQuery = params.search || "";

  // Get all parent accounts with child count and balance
  // For now, we'll just get basic info until we implement payments/charges tables
  const accounts = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      accountNumber: user.accountNumber,
      createdAt: user.createdAt,
      childCount: sql<number>`COUNT(DISTINCT ${children.id})`.mapWith(Number),
      registrationCount: sql<number>`COUNT(DISTINCT ${registrations.id})`.mapWith(
        Number
      ),
    })
    .from(user)
    .leftJoin(children, eq(user.id, children.userId))
    .leftJoin(registrations, eq(user.id, registrations.userId))
    .where(
      searchQuery
        ? or(
            ilike(user.name, `%${searchQuery}%`),
            ilike(user.email, `%${searchQuery}%`),
            ilike(user.accountNumber, `%${searchQuery}%`)
          )
        : undefined
    )
    .groupBy(user.id, user.name, user.email, user.role, user.accountNumber, user.createdAt)
    .orderBy(desc(user.createdAt));

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard/admin" },
          { label: "Accounts" },
        ]}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Accounts</h1>
            <p className="text-muted-foreground text-lg">
              Manage family accounts and registrations
            </p>
          </div>
        </div>

        {/* Search */}
        <form method="GET" className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              name="search"
              placeholder="Search by name, email, or account number..."
              defaultValue={searchQuery}
              className="pl-10"
            />
          </div>
        </form>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{accounts.length}</p>
              <p className="text-sm text-muted-foreground">Total Accounts</p>
            </div>
          </div>
        </div>

        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/10">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {accounts.reduce((sum, acc) => sum + acc.childCount, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Children</p>
            </div>
          </div>
        </div>

        <div className="p-6 border rounded-xl bg-card shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-500/10">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {accounts.reduce((sum, acc) => sum + acc.registrationCount, 0)}
              </p>
              <p className="text-sm text-muted-foreground">
                Total Registrations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Accounts Table */}
      {accounts.length === 0 ? (
        <div className="text-center p-12 border rounded-xl bg-muted/30">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            {searchQuery
              ? "No accounts found matching your search"
              : "No accounts yet"}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="text-left p-4 font-semibold">Name</th>
                  <th className="text-left p-4 font-semibold">Email</th>
                  <th className="text-left p-4 font-semibold">Account #</th>
                  <th className="text-left p-4 font-semibold">Role</th>
                  <th className="text-left p-4 font-semibold">Children</th>
                  <th className="text-left p-4 font-semibold">Registrations</th>
                  <th className="text-left p-4 font-semibold">Joined</th>
                  <th className="text-right p-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr
                    key={account.id}
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-4">
                      <Link
                        href={`/dashboard/admin/accounts/${account.id}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {account.name}
                      </Link>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-muted-foreground">
                        {account.email}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-mono text-muted-foreground">
                        {account.accountNumber || "-"}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="capitalize">
                        {account.role}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">{account.childCount}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">{account.registrationCount}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-muted-foreground">
                        {new Date(account.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/dashboard/admin/accounts/${account.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
