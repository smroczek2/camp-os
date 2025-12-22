"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { checkInChildAction, checkOutChildAction } from "@/app/actions/attendance-actions";

interface CheckInButtonProps {
  childId: string;
  sessionId: string;
  attendance: {
    id: string;
    checkedInAt: Date | null;
    checkedOutAt: Date | null;
  } | null;
  onSuccess?: () => void;
}

export function CheckInButton({
  childId,
  sessionId,
  attendance,
  onSuccess,
}: CheckInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckIn = async () => {
    setIsLoading(true);
    try {
      const result = await checkInChildAction({
        childId,
        sessionId,
      });

      if (result.success) {
        onSuccess?.();
      } else {
        console.error("Check-in failed:", result.error);
        alert(result.error || "Failed to check in");
      }
    } catch (error) {
      console.error("Check-in error:", error);
      alert("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!attendance?.id) return;

    setIsLoading(true);
    try {
      const result = await checkOutChildAction({
        attendanceId: attendance.id,
      });

      if (result.success) {
        onSuccess?.();
      } else {
        console.error("Check-out failed:", result.error);
        alert(result.error || "Failed to check out");
      }
    } catch (error) {
      console.error("Check-out error:", error);
      alert("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Not checked in yet
  if (!attendance || !attendance.checkedInAt) {
    return (
      <Button
        onClick={handleCheckIn}
        disabled={isLoading}
        size="sm"
        className="bg-green-600 hover:bg-green-700"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Checking in...
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Check In
          </>
        )}
      </Button>
    );
  }

  // Checked in but not checked out
  if (!attendance.checkedOutAt) {
    return (
      <Button
        onClick={handleCheckOut}
        disabled={isLoading}
        size="sm"
        variant="outline"
        className="border-blue-600 text-blue-600 hover:bg-blue-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Checking out...
          </>
        ) : (
          <>
            <XCircle className="h-4 w-4 mr-2" />
            Check Out
          </>
        )}
      </Button>
    );
  }

  // Already checked out
  return (
    <Button size="sm" variant="secondary" disabled>
      Checked Out
    </Button>
  );
}
