import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Users, AlertCircle, Pill } from "lucide-react";
import { MedicationForm } from "@/components/parent/medication-form";
import { formatDate } from "@/lib/utils";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  instructions: string | null;
  startDate: Date;
  endDate: Date | null;
}

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  allergies: string[] | null;
  medications?: Medication[];
}

interface MyChildrenSectionProps {
  childrenList: Child[];
  registrationCounts: Map<string, number>;
}

export function MyChildrenSection({
  childrenList,
  registrationCounts,
}: MyChildrenSectionProps) {
  if (childrenList.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No children added yet"
      />
    );
  }

  const now = new Date();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {childrenList.map((child) => {
        const registrationCount = registrationCounts.get(child.id) ?? 0;
        const activeMedications =
          child.medications?.filter(
            (med) => !med.endDate || new Date(med.endDate) > now
          ) ?? [];

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

            {child.allergies && child.allergies.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  Allergies
                </p>
                <div className="flex flex-wrap gap-2">
                  {child.allergies.map((allergy, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {allergy}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {activeMedications.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Pill className="h-4 w-4 text-blue-600" />
                  Medications
                </p>
                <div className="space-y-2">
                  {activeMedications.slice(0, 2).map((med) => (
                    <div
                      key={med.id}
                      className="text-xs p-2 bg-blue-50 dark:bg-blue-950/20 rounded"
                    >
                      <p className="font-medium">{med.name}</p>
                      <p className="text-muted-foreground">
                        {med.dosage} - {med.frequency}
                      </p>
                    </div>
                  ))}
                  {activeMedications.length > 2 && (
                    <p className="text-xs text-muted-foreground">
                      +{activeMedications.length - 2} more
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="pt-4 border-t space-y-3">
              <p className="text-sm text-muted-foreground">
                {registrationCount} registration
                {registrationCount !== 1 ? "s" : ""}
              </p>
              <MedicationForm
                childId={child.id}
                childName={`${child.firstName} ${child.lastName}`}
                trigger={
                  <Button variant="outline" size="sm" className="w-full">
                    <Pill className="h-4 w-4 mr-2" />
                    Manage Medications
                  </Button>
                }
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
