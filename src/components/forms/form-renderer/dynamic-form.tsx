"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { buildSubmissionSchema, type FieldType } from "@/lib/form-validation";
import { submitFormAction } from "@/app/actions/form-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { isReservedFieldKey } from "@/lib/form-ui";

type ValidationRules = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
};

type ConditionalLogic = {
  showIf?: Array<{
    fieldKey: string;
    operator: "equals" | "notEquals" | "contains" | "isEmpty" | "isNotEmpty";
    value: string | number | boolean | string[];
  }>;
};

type FormConfig = {
  id: string;
  name: string;
  fields: Array<{
    id: string;
    fieldKey: string;
    label: string;
    description?: string | null;
    fieldType: string;
    validationRules?: ValidationRules | null;
    conditionalLogic?: ConditionalLogic | null;
    displayOrder: number;
    options?: Array<{
      label: string;
      value: string;
    }> | null;
  }>;
};

export function DynamicForm({
  formConfig,
  childId,
  mode = "submit",
}: {
  formConfig: FormConfig;
  childId?: string;
  mode?: "submit" | "preview";
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [previewNotice, setPreviewNotice] = useState<string | null>(null);

  // Build Zod schema dynamically from form definition
  const visibleFields = formConfig.fields.filter(
    (field) => !isReservedFieldKey(field.fieldKey)
  );

  const schema = buildSubmissionSchema(
    visibleFields.map((f) => ({
      fieldKey: f.fieldKey,
      fieldType: f.fieldType as FieldType,
      validationRules: f.validationRules ?? undefined,
    }))
  );

  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
  });

  // Watch all fields for conditional logic
  const formValues = useWatch({ control: form.control });

  // Save draft to localStorage (submit mode only)
  useEffect(() => {
    if (mode !== "submit") return;
    const subscription = form.watch((value) => {
      localStorage.setItem(
        `form-draft-${formConfig.id}`,
        JSON.stringify(value)
      );
    });
    return () => subscription.unsubscribe();
  }, [form, formConfig.id, mode]);

  // Restore draft on mount
  useEffect(() => {
    if (mode !== "submit") return;
    const draft = localStorage.getItem(`form-draft-${formConfig.id}`);
    if (draft) {
      try {
        form.reset(JSON.parse(draft));
      } catch (e) {
        console.error("Failed to restore draft:", e);
      }
    }
  }, [form, formConfig.id, mode]);

  // Check if field should be visible based on conditional logic
  const shouldShowField = (field: FormConfig["fields"][0]) => {
    if (!field.conditionalLogic?.showIf) return true;

    return field.conditionalLogic.showIf.every((condition) => {
      // Type-safe field value access
      const fieldValue = formValues?.[condition.fieldKey];

      // Helper to check if value exists (type narrowing)
      const hasValue = (val: unknown): val is string | number | boolean | string[] => {
        return val !== null && val !== undefined && val !== "";
      };

      switch (condition.operator) {
        case "equals":
          return fieldValue === condition.value;
        case "notEquals":
          return fieldValue !== condition.value;
        case "contains": {
          // Type-safe array check
          if (Array.isArray(fieldValue) && typeof condition.value === "string") {
            return fieldValue.includes(condition.value);
          }
          // Type-safe string check
          if (typeof fieldValue === "string" && typeof condition.value === "string") {
            return fieldValue.includes(condition.value);
          }
          return false;
        }
        case "isEmpty":
          return !hasValue(fieldValue);
        case "isNotEmpty":
          return hasValue(fieldValue);
        default:
          return true;
      }
    });
  };

  const onSubmit = async (data: Record<string, unknown>) => {
    if (mode === "preview") {
      setPreviewNotice("Preview mode: submission is disabled.");
      return;
    }

    setSubmitting(true);
    try {
      await submitFormAction({
        formDefinitionId: formConfig.id,
        childId,
        submissionData: data,
      });

      // Clear draft after successful submission
      localStorage.removeItem(`form-draft-${formConfig.id}`);

      router.push("/dashboard/parent?submitted=true");
    } catch (error) {
      alert(
        `Error: ${error instanceof Error ? error.message : "Submission failed"}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Sort fields by displayOrder
  const sortedFields = [...visibleFields].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {mode === "preview" && previewNotice && (
        <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
          {previewNotice}
        </div>
      )}
      {sortedFields.map((field) => {
        // Check conditional visibility
        if (!shouldShowField(field)) return null;

        const error = form.formState.errors[field.fieldKey];

        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.fieldKey}>
              {field.label}
              {field.validationRules?.required && (
                <span className="text-destructive ml-1">*</span>
              )}
            </Label>
            {field.description && (
              <p className="text-sm text-muted-foreground">
                {field.description}
              </p>
            )}

            {/* Render field based on type */}
            {(field.fieldType === "text" || field.fieldType === "email") && (
              <Input
                id={field.fieldKey}
                type={field.fieldType}
                {...form.register(field.fieldKey)}
                className={error ? "border-destructive" : ""}
              />
            )}

            {field.fieldType === "textarea" && (
              <Textarea
                id={field.fieldKey}
                {...form.register(field.fieldKey)}
                className={error ? "border-destructive" : ""}
                rows={4}
              />
            )}

            {field.fieldType === "number" && (
              <Input
                id={field.fieldKey}
                type="number"
                {...form.register(field.fieldKey, { valueAsNumber: true })}
                className={error ? "border-destructive" : ""}
              />
            )}

            {field.fieldType === "date" && (
              <Input
                id={field.fieldKey}
                type="date"
                {...form.register(field.fieldKey)}
                className={error ? "border-destructive" : ""}
              />
            )}

            {field.fieldType === "boolean" && (
              <RadioGroup
                value={
                  form.watch(field.fieldKey) === true
                    ? "yes"
                    : form.watch(field.fieldKey) === false
                      ? "no"
                      : ""
                }
                onValueChange={(value) =>
                  form.setValue(field.fieldKey, value === "yes")
                }
                className="grid gap-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem
                    id={`${field.fieldKey}-yes`}
                    value="yes"
                  />
                  <Label
                    htmlFor={`${field.fieldKey}-yes`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    Yes
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem id={`${field.fieldKey}-no`} value="no" />
                  <Label
                    htmlFor={`${field.fieldKey}-no`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    No
                  </Label>
                </div>
              </RadioGroup>
            )}

            {field.fieldType === "select" && field.options && (
              <Select
                value={(form.watch(field.fieldKey) as string) || ""}
                onValueChange={(value) => form.setValue(field.fieldKey, value)}
              >
                <SelectTrigger
                  id={field.fieldKey}
                  className={error ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {field.fieldType === "radio" && field.options && (
              <div className="space-y-2">
                {field.options.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`${field.fieldKey}-${option.value}`}
                      value={option.value}
                      {...form.register(field.fieldKey)}
                      className="h-4 w-4"
                    />
                    <Label
                      htmlFor={`${field.fieldKey}-${option.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            )}

            {field.fieldType === "checkbox" && field.options && (
              <div className="space-y-2">
                {field.options.map((option) => {
                  const currentValues = form.watch(field.fieldKey) as string[] | undefined;
                  const isChecked = Array.isArray(currentValues) && currentValues.includes(option.value);

                  return (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${field.fieldKey}-${option.value}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          const values = Array.isArray(currentValues) ? currentValues : [];
                          if (checked) {
                            form.setValue(field.fieldKey, [...values, option.value]);
                          } else {
                            form.setValue(
                              field.fieldKey,
                              values.filter((v) => v !== option.value)
                            );
                          }
                        }}
                      />
                      <Label
                        htmlFor={`${field.fieldKey}-${option.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Error message */}
            {error && (
              <p className="text-sm text-destructive mt-1">
                {error?.message as string}
              </p>
            )}
          </div>
        );
      })}

      <div className="flex gap-4 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (confirm("Clear all form data?")) {
              form.reset();
              if (mode === "submit") {
                localStorage.removeItem(`form-draft-${formConfig.id}`);
              }
            }
          }}
          disabled={submitting}
        >
          Clear
        </Button>
        <Button type="submit" className="flex-1" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            mode === "preview" ? "Try submit (preview)" : "Submit Form"
          )}
        </Button>
      </div>
    </form>
  );
}
