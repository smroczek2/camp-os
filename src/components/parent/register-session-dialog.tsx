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
import { registerForSessionAction } from "@/app/actions/parent-actions";
import { Loader2, Calendar, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { children } from "@/lib/schema";

type Child = typeof children.$inferSelect;
type SessionWithCamp = {
  id: string;
  startDate: Date;
  endDate: Date;
  price: string;
  status: string;
  camp: {
    name: string;
  };
};

interface RegisterSessionDialogProps {
  session: SessionWithCamp;
  children: Child[];
  disabled?: boolean;
}

export function RegisterSessionDialog({
  session,
  children,
  disabled = false,
}: RegisterSessionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedChildId) {
      setError("Please select a child");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await registerForSessionAction({
        childId: selectedChildId,
        sessionId: session.id,
      });

      setOpen(false);
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to register"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (children.length === 0) {
    return (
      <Button disabled variant="outline" className="w-full">
        <Calendar className="h-4 w-4 mr-2" />
        Add a child first
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled} className="w-full">
          <Calendar className="h-4 w-4 mr-2" />
          Register
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Register for {session.camp.name}</DialogTitle>
            <DialogDescription>
              Select which child you'd like to register for this session.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
                  {children.map((child) => (
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
                  {formatDate(session.startDate)} - {formatDate(session.endDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price:</span>
                <span className="font-bold">${session.price}</span>
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
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedChildId}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Register
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

