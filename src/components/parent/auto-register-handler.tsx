"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { registerForSessionAction } from "@/app/actions/parent-actions";
import { Loader2, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { children } from "@/lib/schema";

type Child = typeof children.$inferSelect;

interface SessionForRegistration {
  id: string;
  name: string | null;
  startDate: Date;
  endDate: Date;
  price: string;
  status: string;
  capacity: number;
  registrations: { status: string }[];
}

interface AutoRegisterHandlerProps {
  sessions: SessionForRegistration[];
  childrenList: Child[];
}

export function AutoRegisterHandler({ sessions, childrenList }: AutoRegisterHandlerProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionForRegistration | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const registerSessionId = searchParams.get("register");
    if (registerSessionId) {
      const session = sessions.find((s) => s.id === registerSessionId);
      if (session) {
        setSelectedSession(session);
        setOpen(true);
      }
      // Clear the query param from URL
      const url = new URL(window.location.href);
      url.searchParams.delete("register");
      window.history.replaceState({}, "", url.pathname);
    }
  }, [searchParams, sessions]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedChildId || !selectedSession) {
      setError("Please select a child");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await registerForSessionAction({
        childId: selectedChildId,
        sessionId: selectedSession.id,
      });

      setOpen(false);
      setSelectedSession(null);
      setSelectedChildId("");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to register");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen);
    if (!newOpen) {
      setSelectedSession(null);
      setSelectedChildId("");
      setError(null);
    }
  }

  if (!selectedSession) return null;

  const spotsLeft =
    selectedSession.capacity -
    selectedSession.registrations.filter((r) => r.status === "confirmed").length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Register for {selectedSession.name}</DialogTitle>
            <DialogDescription>
              Select which child you&apos;d like to register for this session.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {childrenList.length === 0 ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                <p className="font-medium text-yellow-800">No children added yet</p>
                <p className="text-yellow-700 mt-1">
                  Please add a child to your account before registering for a session.
                </p>
              </div>
            ) : (
              <div className="grid gap-2">
                <label className="text-sm font-medium">Select Child *</label>
                <Select
                  value={selectedChildId}
                  onValueChange={setSelectedChildId}
                  required
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
            )}
            <div className="rounded-lg bg-muted/30 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dates:</span>
                <span className="font-medium">
                  {formatDate(selectedSession.startDate)} - {formatDate(selectedSession.endDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price:</span>
                <span className="font-bold">${selectedSession.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Spots Left:</span>
                <span className={`font-medium ${spotsLeft < 5 ? "text-orange-600" : "text-green-600"}`}>
                  {spotsLeft}
                </span>
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedChildId || childrenList.length === 0}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Register
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
