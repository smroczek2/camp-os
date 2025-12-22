"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Edit, Loader2 } from "lucide-react";

interface SessionPlan {
  program?: {
    name: string;
    description?: string;
    isNew: boolean;
  };
  sessions: Array<{
    startDate: string;
    endDate: string;
    price?: number;
    capacity?: number;
  }>;
  recommendedForms?: Array<{
    name: string;
    reason: string;
  }>;
}

interface ConfirmationPanelProps {
  plan: SessionPlan;
  onConfirm: () => void;
  onEdit: () => void;
  isConfirming: boolean;
}

export function ConfirmationPanel({ plan, onConfirm, onEdit, isConfirming }: ConfirmationPanelProps) {
  return (
    <Card className="p-4 border-blue-200 bg-blue-50">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-blue-900">Ready to Create?</h3>
          <p className="text-sm text-blue-700 mt-1">
            This will create {plan.program?.isNew ? "a new program and " : ""}
            {plan.sessions.length} session{plan.sessions.length > 1 ? "s" : ""}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEdit} disabled={isConfirming}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Looks Good, Create!
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
