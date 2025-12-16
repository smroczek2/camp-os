import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { user } from "@/lib/schema";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/dev-login");
  }

  // Get user role
  const userRecord = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });

  if (!userRecord) {
    redirect("/dev-login");
  }

  // Route to role-specific dashboard
  switch (userRecord.role) {
    case "parent":
      redirect("/dashboard/parent");
    case "staff":
      redirect("/dashboard/staff");
    case "admin":
      redirect("/dashboard/admin");
    case "nurse":
      redirect("/dashboard/nurse");
    default:
      redirect("/dashboard/parent");
  }
}
