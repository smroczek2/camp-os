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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { logMedicationAdminAction } from "@/app/actions/medication-actions";
import { Pill, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MedicationLogFormProps {
  medication: {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    instructions: string | null;
    childId: string;
  };
  child: {
    id: string;
    firstName: string;
    lastName: string;
  };
  recentLogs?: Array<{
    administeredAt: Date;
    dosage: string;
    administrator: { name: string } | null;
  }>;
  trigger?: React.ReactNode;
}

export function MedicationLogForm({
  medication,
  child,
  recentLogs,
  trigger,
}: MedicationLogFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardianNotified, setGuardianNotified] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const administeredAtStr = formData.get("administeredAt") as string;

      await logMedicationAdminAction({
        medicationId: medication.id,
        childId: child.id,
        administeredAt: new Date(administeredAtStr),
        dosage: formData.get("dosage") as string,
        photoVerificationUrl: (formData.get("photoVerificationUrl") as string) || undefined,
        guardianNotified,
      });

      setOpen(false);
      setGuardianNotified(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to log medication administration"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Check if medication was recently administered (within last 4 hours)
  const lastLog = recentLogs?.[0];
  const isRecentlyAdministered =
    lastLog &&
    new Date().getTime() - new Date(lastLog.administeredAt).getTime() <
      4 * 60 * 60 * 1000;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline">
            <CheckCircle className="h-4 w-4 mr-2" />
            Log Administration
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Log Medication Administration</DialogTitle>
            <DialogDescription>
              Record that medication was given to{" "}
              <strong>
                {child.firstName} {child.lastName}
              </strong>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Medication Info */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">{medication.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Standard Dosage: {medication.dosage}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Frequency: {medication.frequency}
                  </p>
                </div>
                <Badge variant="outline">
                  <Pill className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
              {medication.instructions && (
                <div className="pt-2 border-t mt-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Special Instructions:
                  </p>
                  <p className="text-sm">{medication.instructions}</p>
                </div>
              )}
            </div>

            {/* Recent Administration Warning */}
            {isRecentlyAdministered && lastLog && (
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-900 dark:text-amber-100">
                    Recently Administered
                  </p>
                  <p className="text-amber-700 dark:text-amber-200">
                    Last given {new Date(lastLog.administeredAt).toLocaleString()}{" "}
                    by {lastLog.administrator?.name || "Unknown"}
                  </p>
                </div>
              </div>
            )}

            {/* Recent Administration History */}
            {recentLogs && recentLogs.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Recent Administration History
                </Label>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {recentLogs.slice(0, 3).map((log, idx) => (
                    <div
                      key={idx}
                      className="text-xs p-2 bg-muted/30 rounded flex items-center justify-between"
                    >
                      <span>
                        {new Date(log.administeredAt).toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">
                        {log.dosage} by {log.administrator?.name || "Unknown"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="grid gap-2">
              <Label htmlFor="administeredAt">Administration Time *</Label>
              <Input
                id="administeredAt"
                name="administeredAt"
                type="datetime-local"
                defaultValue={new Date().toISOString().slice(0, 16)}
                required
                max={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dosage">Dosage Given *</Label>
              <Input
                id="dosage"
                name="dosage"
                placeholder="e.g., 200mg, 2 puffs"
                defaultValue={medication.dosage}
                required
              />
              <p className="text-xs text-muted-foreground">
                Confirm the actual dosage administered
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="photoVerificationUrl">
                Photo Verification URL (Optional)
              </Label>
              <Input
                id="photoVerificationUrl"
                name="photoVerificationUrl"
                type="url"
                placeholder="https://..."
              />
              <p className="text-xs text-muted-foreground">
                Optional: Link to photo of medication bottle or administration
              </p>
            </div>

            <div className="flex items-center space-x-2 p-3 border rounded-md">
              <Checkbox
                id="guardianNotified"
                checked={guardianNotified}
                onCheckedChange={(checked) =>
                  setGuardianNotified(checked as boolean)
                }
              />
              <label
                htmlFor="guardianNotified"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Guardian has been notified of medication administration
              </label>
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Log Administration
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
