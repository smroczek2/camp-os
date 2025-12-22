"use client";

import { useEffect, useState } from "react";
import { CheckInList } from "./check-in-list";
import { getExpectedChildrenAction } from "@/app/actions/attendance-actions";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExpectedChild {
  childId: string;
  firstName: string;
  lastName: string;
  parentName: string;
  parentEmail: string;
  allergies: string[] | null;
  medicalNotes: string | null;
  attendance: {
    id: string;
    checkedInAt: Date | null;
    checkedOutAt: Date | null;
    checkedInBy: string | null;
    checkedOutBy: string | null;
    notes: string | null;
  } | null;
}

interface CheckInListWrapperProps {
  sessionId: string;
}

export function CheckInListWrapper({ sessionId }: CheckInListWrapperProps) {
  const [children, setChildren] = useState<ExpectedChild[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchChildren = async () => {
    try {
      const result = await getExpectedChildrenAction({ sessionId });

      if (result.success) {
        setChildren(result.children as ExpectedChild[]);
      } else {
        console.error("Failed to load children:", result.error);
      }
    } catch (error) {
      console.error("Error fetching children:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChildren();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchChildren();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          size="sm"
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
      <CheckInList sessionId={sessionId} childrenList={children} onRefresh={fetchChildren} />
    </div>
  );
}
