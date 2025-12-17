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
import { addChildAction } from "@/app/actions/parent-actions";
import { Plus, Loader2, AlertCircle } from "lucide-react";

export function AddChildDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const allergiesString = formData.get("allergies") as string;
    const allergies = allergiesString
      ? allergiesString.split(",").map((a) => a.trim()).filter(Boolean)
      : [];

    try {
      setError(null);
      await addChildAction({
        firstName: formData.get("firstName") as string,
        lastName: formData.get("lastName") as string,
        dateOfBirth: formData.get("dateOfBirth") as string,
        allergies,
        medicalNotes: formData.get("medicalNotes") as string | undefined,
      });

      setOpen(false);
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to add child"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Child
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add a Child</DialogTitle>
            <DialogDescription>
              Add a new child to your account. You can register them for camp
              sessions after adding them.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="John"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                required
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="allergies">
                Allergies (comma-separated)
              </Label>
              <Input
                id="allergies"
                name="allergies"
                placeholder="Peanuts, Dairy, etc."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="medicalNotes">Medical Notes</Label>
              <Textarea
                id="medicalNotes"
                name="medicalNotes"
                placeholder="Any additional medical information..."
                rows={3}
              />
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
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Child
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

