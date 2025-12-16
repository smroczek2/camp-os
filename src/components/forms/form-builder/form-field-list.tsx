import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { DraftField, FormFieldDetails } from "./types";
import { FormFieldEditor } from "./form-field-editor";
import { FormFieldDisplay } from "./form-field-display";
import { DraftOption } from "./types";

type FormFieldListProps = {
  fields: FormFieldDetails[] | DraftField[];
  isEditing: boolean;
  disabled?: boolean;
  onAddField?: () => void;
  onUpdateField?: (fieldId: string, updates: Partial<DraftField>) => void;
  onUpdateFieldType?: (fieldId: string, fieldType: string) => void;
  onRemoveField?: (fieldId: string) => void;
  onAddOption?: (fieldId: string) => void;
  onUpdateOption?: (
    fieldId: string,
    optionId: string,
    updates: Partial<DraftOption>
  ) => void;
  onRemoveOption?: (fieldId: string, optionId: string) => void;
};

export function FormFieldList({
  fields,
  isEditing,
  disabled = false,
  onAddField,
  onUpdateField,
  onUpdateFieldType,
  onRemoveField,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
}: FormFieldListProps) {
  // Memoize sorted fields to avoid re-sorting on every render
  const sortedFields = useMemo(
    () => [...fields].sort((a, b) => a.displayOrder - b.displayOrder),
    [fields]
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Form Fields</CardTitle>
          {isEditing && onAddField && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddField}
              disabled={disabled}
            >
              Add field
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {fields && fields.length > 0 ? (
            isEditing ? (
              sortedFields.map((field, idx) => (
                <FormFieldEditor
                  key={field.id}
                  field={field as DraftField}
                  index={idx}
                  disabled={disabled}
                  onUpdateField={onUpdateField!}
                  onUpdateFieldType={onUpdateFieldType!}
                  onRemoveField={onRemoveField!}
                  onAddOption={onAddOption!}
                  onUpdateOption={onUpdateOption!}
                  onRemoveOption={onRemoveOption!}
                />
              ))
            ) : (
              sortedFields.map((field, idx) => (
                <FormFieldDisplay
                  key={field.id}
                  field={field as FormFieldDetails}
                  index={idx}
                />
              ))
            )
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No fields configured
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
