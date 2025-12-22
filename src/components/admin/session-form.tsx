"use client";

import { useState } from "react";
import { Control, UseFormSetValue } from "react-hook-form";
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
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { DatesPricingSection } from "./session-form/dates-pricing-section";
import { EligibilitySection } from "./session-form/eligibility-section";
import { FormsSection } from "./session-form/forms-section";
import { AdditionalDetailsSection } from "./session-form/additional-details-section";

/**
 * Shared session form component for create and edit dialogs
 *
 * This component extracts the common form structure used by both
 * create-session-dialog.tsx and edit-session-dialog.tsx to reduce
 * code duplication and ensure consistency.
 *
 * Usage:
 * - For create mode: Pass control from CreateSessionInput form
 * - For edit mode: Pass control from EditSessionInput form (with sessionId)
 *
 * Features:
 * - Dates & Pricing (always visible)
 * - Status selector
 * - Collapsible Eligibility section
 * - Collapsible Forms section (optional, only for create mode)
 * - Collapsible Additional Details section
 */

interface SessionFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue?: UseFormSetValue<any>;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
  errorMessage?: string;
  submitLabel?: string;
  showFormsSection?: boolean;
  defaultEligibilityOpen?: boolean;
  defaultFormsOpen?: boolean;
  defaultDetailsOpen?: boolean;
}

export function SessionForm({
  control,
  setValue,
  onSubmit,
  onCancel,
  loading,
  errorMessage,
  submitLabel = "Save",
  showFormsSection = false,
  defaultEligibilityOpen = false,
  defaultFormsOpen = false,
  defaultDetailsOpen = false,
}: SessionFormProps) {
  const [eligibilityOpen, setEligibilityOpen] = useState(defaultEligibilityOpen);
  const [formsOpen, setFormsOpen] = useState(defaultFormsOpen);
  const [detailsOpen, setDetailsOpen] = useState(defaultDetailsOpen);

  return (
    <div className="space-y-6">
      {/* Always visible: Dates & Pricing */}
      <div className="space-y-4">
        <h3 className="font-medium">Dates & Pricing</h3>
        <DatesPricingSection control={control} />
      </div>

      {/* Status selector */}
      <FormField
        control={control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Status</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              defaultValue={field.value}
            >
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
          <EligibilitySection control={control} />
        </CollapsibleContent>
      </Collapsible>

      {/* Collapsible: Forms (only shown in create mode) */}
      {showFormsSection && setValue && (
        <Collapsible open={formsOpen} onOpenChange={setFormsOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 font-medium hover:text-primary">
            {formsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Required Forms (optional)
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <FormsSection control={control} setValue={setValue} />
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Collapsible: Additional Details */}
      <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 font-medium hover:text-primary">
          {detailsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          Additional Details (optional)
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <AdditionalDetailsSection control={control} />
        </CollapsibleContent>
      </Collapsible>

      {/* Error display */}
      {errorMessage && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
          {errorMessage}
        </div>
      )}

      {/* Submit buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="button" onClick={onSubmit} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </div>
  );
}
