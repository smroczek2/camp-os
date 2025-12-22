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
import { Plus, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { createSessionSchema, type CreateSessionInput } from "@/lib/validations/session";
import { createEnhancedSessionAction } from "@/app/actions/session-actions";
import { DatesPricingSection } from "./session-form/dates-pricing-section";
import { EligibilitySection } from "./session-form/eligibility-section";
import { FormsSection } from "./session-form/forms-section";
import { AdditionalDetailsSection } from "./session-form/additional-details-section";

export function CreateSessionDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [eligibilityOpen, setEligibilityOpen] = useState(false);
  const [formsOpen, setFormsOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const router = useRouter();

  // Calculate default dates
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const weekEnd = new Date(nextWeek);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const form = useForm<CreateSessionInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createSessionSchema) as any,
    defaultValues: {
      name: "",
      status: "draft" as const,
      startDate: nextWeek,
      endDate: weekEnd,
      price: 0,
      capacity: 20,
    },
  });

  async function onSubmit(data: CreateSessionInput) {
    setLoading(true);
    try {
      const result = await createEnhancedSessionAction(data);
      if (result.success) {
        setOpen(false);
        form.reset();
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
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Session
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Session</DialogTitle>
          <DialogDescription>
            Create a new session for your organization
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Always visible: Dates & Pricing */}
            <div className="space-y-4">
              <h3 className="font-medium">Dates & Pricing</h3>
              <DatesPricingSection control={form.control} />
            </div>

            {/* Status selector */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="open">Open for Registration</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
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
                <EligibilitySection control={form.control} />
              </CollapsibleContent>
            </Collapsible>

            {/* Collapsible: Forms */}
            <Collapsible open={formsOpen} onOpenChange={setFormsOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 font-medium hover:text-primary">
                {formsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                Required Forms (optional)
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <FormsSection control={form.control} setValue={form.setValue} />
              </CollapsibleContent>
            </Collapsible>

            {/* Collapsible: Additional Details */}
            <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 font-medium hover:text-primary">
                {detailsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                Additional Details (optional)
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <AdditionalDetailsSection control={form.control} />
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
                    Creating...
                  </>
                ) : (
                  "Create Session"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
