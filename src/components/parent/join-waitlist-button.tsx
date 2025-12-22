"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { joinWaitlistAction } from "@/app/actions/waitlist-actions";
import { Loader2, ListChecks, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { children } from "@/lib/schema";

type Child = typeof children.$inferSelect;
type SessionForWaitlist = {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  price: string;
  status: string;
};

interface JoinWaitlistButtonProps {
  session: SessionForWaitlist;
  childrenList: Child[];
  disabled?: boolean;
}

export function JoinWaitlistButton({
  session,
  childrenList,
  disabled = false,
}: JoinWaitlistButtonProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ position: number } | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedChildId) {
      setError("Please select a child");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await joinWaitlistAction({
        childId: selectedChildId,
        sessionId: session.id,
      });

      if (result.success && result.position) {
        setSuccess({ position: result.position });
        setTimeout(() => {
          setOpen(false);
          router.refresh();
        }, 2000);
      } else {
        setError(result.error || "Failed to join waitlist");
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to join waitlist"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (childrenList.length === 0) {
    return (
      <Button disabled variant="outline" className="w-full">
        <ListChecks className="h-4 w-4 mr-2" />
        Add a child first
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled} variant="outline" className="w-full">
          <ListChecks className="h-4 w-4 mr-2" />
          Join Waitlist
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Join Waitlist for {session.name}</DialogTitle>
            <DialogDescription>
              This session is currently full. Join the waitlist and we&apos;ll
              notify you if a spot opens up.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {!success && (
              <>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Select Child *</label>
                  <Select
                    value={selectedChildId}
                    onValueChange={setSelectedChildId}
                    required
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a child..." />
                    </SelectTrigger>
                    <SelectContent>
                      {childrenList.map((child) => (
                        <SelectItem key={child.id} value={child.id}>
                          {child.firstName} {child.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="rounded-lg bg-muted/30 p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dates:</span>
                    <span className="font-medium">
                      {formatDate(session.startDate)} -{" "}
                      {formatDate(session.endDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price:</span>
                    <span className="font-bold">${session.price}</span>
                  </div>
                </div>
              </>
            )}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex flex-col items-center justify-center gap-3 p-6">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10">
                  <ListChecks className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-lg mb-1">
                    Successfully Joined Waitlist!
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Your position: #{success.position}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    We&apos;ll notify you if a spot becomes available.
                  </p>
                </div>
              </div>
            )}
          </div>
          {!success && (
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !selectedChildId}>
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Join Waitlist
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
