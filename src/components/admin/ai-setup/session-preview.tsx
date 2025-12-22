"use client";

import { Card } from "@/components/ui/card";
import { Calendar, Users, DollarSign, FileText } from "lucide-react";

interface SessionPlan {
  program?: {
    name: string;
    description?: string;
    isNew: boolean;
    existingId?: string;
  };
  sessions: Array<{
    name?: string;
    startDate: string;
    endDate: string;
    price?: number;
    capacity?: number;
    minAge?: number;
    maxAge?: number;
    minGrade?: number;
    maxGrade?: number;
  }>;
  recommendedForms?: Array<{
    name: string;
    reason: string;
  }>;
}

interface SessionPreviewProps {
  plan: SessionPlan;
}

export function SessionPreview({ plan }: SessionPreviewProps) {
  return (
    <div className="space-y-4 pt-2">
      {/* Program Info (only show if provided) */}
      {plan.program && (
        <div className="border-l-2 border-blue-500 pl-3">
          <p className="font-medium">
            {plan.program.isNew ? "New Program:" : "Program:"} {plan.program.name}
          </p>
          {plan.program.description && (
            <p className="text-sm text-muted-foreground">{plan.program.description}</p>
          )}
        </div>
      )}

      {/* Sessions */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Sessions:</p>
        {plan.sessions.map((session, idx) => (
          <Card key={idx} className="p-3 bg-white">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {new Date(session.startDate).toLocaleDateString()} - {new Date(session.endDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
              {session.price && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />${session.price}
                </span>
              )}
              {session.capacity && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />{session.capacity} spots
                </span>
              )}
              {(session.minAge || session.maxAge) && (
                <span>Ages {session.minAge || "?"}-{session.maxAge || "?"}</span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Recommended Forms */}
      {plan.recommendedForms && plan.recommendedForms.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium flex items-center gap-1">
            <FileText className="h-4 w-4" />
            Recommended Forms:
          </p>
          <ul className="text-sm space-y-1">
            {plan.recommendedForms.map((form, idx) => (
              <li key={idx} className="text-muted-foreground">
                • {form.name} <span className="text-xs">({form.reason})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
