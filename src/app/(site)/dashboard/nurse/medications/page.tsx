import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { medications } from "@/lib/schema";
import { desc } from "drizzle-orm";
import { Pill } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/dashboard/breadcrumb";
import { formatDate } from "@/lib/utils";

export default async function NurseMedicationsPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "nurse") {
    redirect("/dashboard");
  }

  const allMedications = await db.query.medications.findMany({
    with: {
      child: true,
    },
    orderBy: [desc(medications.startDate)],
  });

  const now = new Date();

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard/nurse" },
          { label: "Medications" },
        ]}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Medications</h1>
        <p className="text-muted-foreground">
          Track active medications and administration history.
        </p>
      </div>

      {allMedications.length === 0 ? (
        <div className="text-center p-12 border rounded-xl bg-muted/30">
          <Pill className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No medications on file</p>
        </div>
      ) : (
        <div className="space-y-4">
          {allMedications.map((medication) => {
            const isActive = !medication.endDate || medication.endDate > now;

            return (
              <Link
                key={medication.id}
                href={`/dashboard/nurse/medications/${medication.id}`}
                className="block"
              >
                <div className="p-6 border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{medication.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {medication.child.firstName} {medication.child.lastName}
                      </p>
                    </div>
                    <Badge variant={isActive ? "default" : "outline"}>
                      {isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium text-foreground">Dosage:</span>{" "}
                      {medication.dosage}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Frequency:</span>{" "}
                      {medication.frequency}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Start:</span>{" "}
                      {formatDate(medication.startDate)}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
