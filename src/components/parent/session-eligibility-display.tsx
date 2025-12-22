"use client";

import { EligibilityBadge } from "./eligibility-badge";
import { Button } from "@/components/ui/button";
import { checkEligibility } from "@/services/eligibility-service";

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  grade?: number | null;
}

interface Session {
  id: string;
  startDate: Date;
  minAge?: number | null;
  maxAge?: number | null;
  minGrade?: number | null;
  maxGrade?: number | null;
}

interface SessionEligibilityDisplayProps {
  session: Session;
  childrenList: Child[];
  onRegister?: (childId: string, sessionId: string) => void;
}

export function SessionEligibilityDisplay({
  session,
  childrenList,
  onRegister
}: SessionEligibilityDisplayProps) {
  if (childrenList.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No children registered. Add children to your profile to register for sessions.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Your children:</p>
      <div className="space-y-2">
        {childrenList.map((child) => {
          const eligibility = checkEligibility(
            { birthDate: new Date(child.dateOfBirth), grade: child.grade ?? undefined },
            {
              startDate: new Date(session.startDate),
              minAge: session.minAge,
              maxAge: session.maxAge,
              minGrade: session.minGrade,
              maxGrade: session.maxGrade,
            }
          );

          const age = calculateAge(new Date(child.dateOfBirth), new Date(session.startDate));

          return (
            <div
              key={child.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-card"
            >
              <div className="flex items-center gap-3">
                <EligibilityBadge
                  eligible={eligibility.eligible}
                  reason={eligibility.reason}
                />
                <div>
                  <p className="font-medium">
                    {child.firstName} {child.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Age {age}{child.grade != null && `, Grade ${child.grade}`}
                  </p>
                </div>
              </div>
              {eligibility.eligible && onRegister && (
                <Button
                  size="sm"
                  onClick={() => onRegister(child.id, session.id)}
                >
                  Register
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function calculateAge(birthDate: Date, asOfDate: Date): number {
  const age = asOfDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = asOfDate.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && asOfDate.getDate() < birthDate.getDate())) {
    return age - 1;
  }
  return age;
}
