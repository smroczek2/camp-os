"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Edit, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { z } from "zod";
import { updateSessionAction } from "@/app/actions/session-actions";
import { DatesPricingSection } from "./session-form/dates-pricing-section";
import { EligibilitySection } from "./session-form/eligibility-section";
import { AdditionalDetailsSection } from "./session-form/additional-details-section";

// Reuse the create schema but with sessionId added
const editSessionSchema = z.object({
  sessionId: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  price: z.coerce.number().min(0, "Price must be positive"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  status: z.enum(["draft", "open", "closed", "completed"]).default("draft"),
  description: z.string().optional().nullable(),
  minAge: z.coerce.number().int().min(0).max(100).optional().nullable(),
  maxAge: z.coerce.number().int().min(0).max(100).optional().nullable(),
  minGrade: z.coerce.number().int().min(-1).max(12).optional().nullable(),
  maxGrade: z.coerce.number().int().min(-1).max(12).optional().nullable(),
  registrationOpenDate: z.coerce.date().optional().nullable(),
  registrationCloseDate: z.coerce.date().optional().nullable(),
  specialInstructions: z.string().optional().nullable(),
  whatToBring: z.string().optional().nullable(),
});

type EditSessionInput = z.infer<typeof editSessionSchema>;

interface SessionData {
  id: string;
  name: string | null;
  description: string | null;
  startDate: Date;
  endDate: Date;
  price: string;
  capacity: number;
  status: string;
  minAge: number | null;
  maxAge: number | null;
  minGrade: number | null;
  maxGrade: number | null;
  registrationOpenDate: Date | null;
  registrationCloseDate: Date | null;
  specialInstructions: string | null;
  whatToBring: string | null;
}

interface EditSessionDialogProps {
  session: SessionData;
}

export function EditSessionDialog({ session }: EditSessionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [eligibilityOpen, setEligibilityOpen] = useState(
    !!(session.minAge || session.maxAge || session.minGrade !== null || session.maxGrade !== null)
  );
  const [detailsOpen, setDetailsOpen] = useState(
    !!(session.specialInstructions || session.whatToBring)
  );
  const router = useRouter();

  const form = useForm<EditSessionInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(editSessionSchema) as any,
    defaultValues: {
      sessionId: session.id,
      name: session.name || "",
      description: session.description || "",
      startDate: new Date(session.startDate),
      endDate: new Date(session.endDate),
      price: parseFloat(session.price),
      capacity: session.capacity,
      status: session.status as "draft" | "open" | "closed" | "completed",
      minAge: session.minAge,
      maxAge: session.maxAge,
      minGrade: session.minGrade,
      maxGrade: session.maxGrade,
      registrationOpenDate: session.registrationOpenDate
        ? new Date(session.registrationOpenDate)
        : null,
      registrationCloseDate: session.registrationCloseDate
        ? new Date(session.registrationCloseDate)
        : null,
      specialInstructions: session.specialInstructions,
      whatToBring: session.whatToBring,
    },
  });

  async function onSubmit(data: EditSessionInput) {
    setLoading(true);
    try {
      const result = await updateSessionAction(data);
      if (result.success) {
        setOpen(false);
        router.refresh();
      } else {
        form.setError("root", { message: result.error });
      }
    } catch {
      form.setError("root", { message: "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Edit className="h-4 w-4 mr-2" />
          Edit Session
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Session</DialogTitle>
          <DialogDescription>
            Update session details
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Always visible: Dates & Pricing */}
            <div className="space-y-4">
              <h3 className="font-medium">Dates & Pricing</h3>
              {/* Need to cast control because the DatesPricingSection expects CreateSessionInput */}
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <DatesPricingSection control={form.control as any} />
            </div>

            {/* Status selector */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="open">Open for Registration</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Only &quot;Open&quot; sessions accept registrations
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Collapsible: Eligibility */}
            <Collapsible open={eligibilityOpen} onOpenChange={setEligibilityOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 font-medium hover:text-primary">
                {eligibilityOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                Eligibility (optional)
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <EligibilitySection control={form.control as any} />
              </CollapsibleContent>
            </Collapsible>

            {/* Collapsible: Additional Details */}
            <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 font-medium hover:text-primary">
                {detailsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                Additional Details (optional)
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <AdditionalDetailsSection control={form.control as any} />
              </CollapsibleContent>
            </Collapsible>

            {/* Error display */}
            {form.formState.errors.root && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                {form.formState.errors.root.message}
              </div>
            )}

            {/* Submit buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
