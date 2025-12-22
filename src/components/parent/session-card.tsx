"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Users } from "lucide-react";
import { getEligibilitySummary } from "@/services/eligibility-service";
import { SessionEligibilityDisplay } from "./session-eligibility-display";

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  grade?: number | null;
}

interface Session {
  id: string;
  name: string;
  description?: string | null;
  startDate: Date;
  endDate: Date;
  price: string;
  capacity: number;
  status: string;
  minAge?: number | null;
  maxAge?: number | null;
  minGrade?: number | null;
  maxGrade?: number | null;
  registrations?: { status: string }[];
}

interface SessionCardProps {
  session: Session;
  children: Child[];
  onRegister?: (childId: string, sessionId: string) => void;
}

export function SessionCard({ session, children, onRegister }: SessionCardProps) {
  const confirmedCount = session.registrations?.filter(r => r.status === "confirmed").length || 0;
  const spotsLeft = session.capacity - confirmedCount;
  const eligibilitySummary = getEligibilitySummary({
    minAge: session.minAge,
    maxAge: session.maxAge,
    minGrade: session.minGrade,
    maxGrade: session.maxGrade,
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              {session.name}
            </CardTitle>
            {session.description && (
              <CardDescription>
                {session.description}
              </CardDescription>
            )}
          </div>
          <Badge variant={session.status === "open" ? "default" : "secondary"}>
            {session.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {new Date(session.startDate).toLocaleDateString()} - {new Date(session.endDate).toLocaleDateString()}
          </span>
          <span className="flex items-center gap-1.5">
            <DollarSign className="h-4 w-4" />${session.price}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />{spotsLeft} spots left
          </span>
        </div>

        {/* Eligibility Summary */}
        {eligibilitySummary !== "All ages welcome" && (
          <div className="text-sm bg-muted/50 p-2 rounded">
            <span className="font-medium">Eligibility: </span>
            {eligibilitySummary}
          </div>
        )}

        {/* Children Eligibility */}
        {session.status === "open" && (
          <SessionEligibilityDisplay
            session={{
              id: session.id,
              startDate: session.startDate,
              minAge: session.minAge,
              maxAge: session.maxAge,
              minGrade: session.minGrade,
              maxGrade: session.maxGrade,
            }}
            childrenList={children}
            onRegister={onRegister}
          />
        )}
      </CardContent>
    </Card>
  );
}
