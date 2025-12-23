import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { children, registrations } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AddChildDialog } from "@/components/parent/add-child-dialog";
import { EditChildDialog } from "@/components/parent/edit-child-dialog";
import { Users } from "lucide-react";
import { MedicationForm } from "@/components/parent/medication-form";
import { MedicalSummaryCard } from "@/components/parent/medical-summary-card";
import { formatDate } from "@/lib/utils";
import { Breadcrumb } from "@/components/dashboard/breadcrumb";

export default async function MyChildrenPage() {
    const session = await getSession();

    if (!session?.user) {
        redirect("/login");
    }

    // Get parent's children with medications
    const myChildren = await db.query.children.findMany({
        where: eq(children.userId, session.user.id),
        with: {
            medications: {
                orderBy: (meds, { desc }) => [desc(meds.startDate)],
            },
        },
    });

    // Get all registrations to show counts
    const myRegistrations = await db.query.registrations.findMany({
        where: eq(registrations.userId, session.user.id),
    });

    // Pre-compute registration counts per child using a Map for O(1) lookup
    const registrationCountByChild = new Map<string, number>();
    for (const r of myRegistrations) {
        registrationCountByChild.set(
            r.childId,
            (registrationCountByChild.get(r.childId) ?? 0) + 1
        );
    }

    return (
        <div>
            <Breadcrumb
                items={[
                    { label: "Dashboard", href: "/dashboard/parent" },
                    { label: "Children" },
                ]}
            />

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">My Children</h1>
                    <p className="text-muted-foreground">Manage your family profiles and medical information.</p>
                </div>
                <AddChildDialog />
            </div>

            {myChildren.length === 0 ? (
                <div className="text-center p-12 border rounded-xl bg-muted/30">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No children added yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {myChildren.map((child) => {
                        // Use O(1) Map lookup instead of O(n) filter
                        const registrationCount = registrationCountByChild.get(child.id) ?? 0;

                        return (
                            <div
                                key={child.id}
                                className="p-6 border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="font-semibold text-lg">
                                            {child.firstName} {child.lastName}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Born {formatDate(child.dateOfBirth)}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/10">
                                        <Users className="h-5 w-5 text-blue-600" />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <p className="text-sm text-muted-foreground">
                                        {registrationCount} registration
                                        {registrationCount !== 1 ? "s" : ""}
                                    </p>
                                </div>

                                {/* Medical Summary Card with Expandable Details */}
                                <MedicalSummaryCard
                                    childName={`${child.firstName} ${child.lastName}`}
                                    allergies={child.allergies || []}
                                    medications={child.medications || []}
                                    medicalNotes={child.medicalNotes}
                                />

                                <div className="pt-4 border-t mt-4 space-y-2">
                                    <EditChildDialog child={child} />
                                    <MedicationForm
                                        childId={child.id}
                                        childName={`${child.firstName} ${child.lastName}`}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
