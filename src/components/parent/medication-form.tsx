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
import { Textarea } from "@/components/ui/textarea";
import {
  addMedicationAction,
  updateMedicationAction,
  deleteMedicationAction,
} from "@/app/actions/medication-actions";
import { Pill, Loader2, AlertCircle, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MedicationFormProps {
  childId: string;
  childName: string;
  medication?: {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    instructions: string | null;
    startDate: Date;
    endDate: Date | null;
  };
  trigger?: React.ReactNode;
}

export function MedicationForm({
  childId,
  childName,
  medication,
  trigger,
}: MedicationFormProps) {
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const isEditing = !!medication;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const startDateStr = formData.get("startDate") as string;
      const endDateStr = formData.get("endDate") as string;

      const data = {
        childId,
        name: formData.get("name") as string,
        dosage: formData.get("dosage") as string,
        frequency: formData.get("frequency") as string,
        instructions: (formData.get("instructions") as string) || undefined,
        startDate: new Date(startDateStr),
        endDate: endDateStr ? new Date(endDateStr) : undefined,
      };

      if (isEditing) {
        await updateMedicationAction({
          medicationId: medication.id,
          ...data,
        });
      } else {
        await addMedicationAction(data);
      }

      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save medication"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!medication) return;

    setIsDeleting(true);
    try {
      await deleteMedicationAction({ medicationId: medication.id });
      setDeleteOpen(false);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete medication"
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button size="sm">
              <Pill className="h-4 w-4 mr-2" />
              Add Medication
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Edit Medication" : "Add Medication"}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? `Update medication information for ${childName}`
                  : `Add a new medication for ${childName}`}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Medication Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Ibuprofen, Albuterol"
                  defaultValue={medication?.name}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dosage">Dosage *</Label>
                  <Input
                    id="dosage"
                    name="dosage"
                    placeholder="e.g., 200mg, 2 puffs"
                    defaultValue={medication?.dosage}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="frequency">Frequency *</Label>
                  <Input
                    id="frequency"
                    name="frequency"
                    placeholder="e.g., Twice daily, As needed"
                    defaultValue={medication?.frequency}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    defaultValue={
                      medication?.startDate
                        ? new Date(medication.startDate)
                            .toISOString()
                            .split("T")[0]
                        : new Date().toISOString().split("T")[0]
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    defaultValue={
                      medication?.endDate
                        ? new Date(medication.endDate)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave blank if ongoing
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="instructions">Special Instructions</Label>
                <Textarea
                  id="instructions"
                  name="instructions"
                  placeholder="Any special instructions for administering this medication..."
                  rows={3}
                  defaultValue={medication?.instructions || ""}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
            </div>
            <DialogFooter className="flex items-center justify-between">
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteOpen(true)}
                  disabled={isSubmitting}
                  className="mr-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
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
                  {isEditing ? "Update" : "Add"} Medication
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Medication?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {medication?.name}? This will also
              delete all administration logs for this medication. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
