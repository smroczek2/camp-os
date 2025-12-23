import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  allergies?: string[] | null;
  medicalNotes?: string | null;
}

interface ChildrenSummaryListProps {
  childrenList: Child[];
}

function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

function hasMedicalAlerts(child: Child): boolean {
  return Boolean(
    (child.allergies && child.allergies.length > 0) ||
    (child.medicalNotes && child.medicalNotes.trim().length > 0)
  );
}

export function ChildrenSummaryList({
  childrenList,
}: ChildrenSummaryListProps) {
  if (childrenList.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Children</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No children registered for this account.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Children</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {childrenList.map((child) => {
            const age = calculateAge(child.dateOfBirth);
            const hasAlerts = hasMedicalAlerts(child);

            return (
              <div
                key={child.id}
                className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">
                      {child.firstName} {child.lastName}
                    </h4>
                    {hasAlerts && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Medical Alert
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">Age: {age}</p>

                  {/* Display Medical Information */}
                  {hasAlerts && (
                    <div className="mt-2 space-y-1">
                      {child.allergies && child.allergies.length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium text-destructive">
                            Allergies:{" "}
                          </span>
                          <span className="text-muted-foreground">
                            {child.allergies.join(", ")}
                          </span>
                        </div>
                      )}
                      {child.medicalNotes && child.medicalNotes.trim() && (
                        <div className="text-sm">
                          <span className="font-medium text-destructive">
                            Medical Notes:{" "}
                          </span>
                          <span className="text-muted-foreground">
                            {child.medicalNotes}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
