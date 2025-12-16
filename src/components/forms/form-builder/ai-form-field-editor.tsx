import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FIELD_TYPE_OPTIONS, fieldTypeSupportsOptions } from "@/lib/form-ui";

type AIFieldType = {
  fieldKey: string;
  label: string;
  fieldType: string;
  description?: string;
  validationRules?: { required?: boolean };
  displayOrder: number;
  options?: Array<{
    label: string;
    value: string;
    displayOrder: number;
  }>;
};

type AIFormFieldEditorProps = {
  field: AIFieldType;
  index: number;
  totalFields: number;
  disabled?: boolean;
  onUpdateField: (
    fieldKey: string,
    updates: Partial<{
      label: string;
      description: string;
      validationRules: { required?: boolean };
    }>
  ) => void;
  onUpdateFieldType: (fieldKey: string, fieldType: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onAddOption: (fieldKey: string) => void;
  onUpdateOption: (
    fieldKey: string,
    optionDisplayOrder: number,
    updates: { label?: string; value?: string }
  ) => void;
  onRemoveOption: (fieldKey: string, optionDisplayOrder: number) => void;
};

export const AIFormFieldEditor = memo(function AIFormFieldEditor({
  field,
  index,
  totalFields,
  disabled = false,
  onUpdateField,
  onUpdateFieldType,
  onMoveUp,
  onMoveDown,
  onRemove,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
}: AIFormFieldEditorProps) {
  return (
    <div className="p-4 border rounded-lg bg-muted/20 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="grid gap-2">
            <Label>Question</Label>
            <Input
              value={field.label}
              onChange={(e) =>
                onUpdateField(field.fieldKey, { label: e.target.value })
              }
              disabled={disabled}
            />
          </div>

          <div className="grid gap-2">
            <Label>Help text (optional)</Label>
            <Textarea
              value={field.description ?? ""}
              onChange={(e) =>
                onUpdateField(field.fieldKey, { description: e.target.value })
              }
              disabled={disabled}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Answer type</Label>
              <Select
                value={field.fieldType}
                onValueChange={(value) =>
                  onUpdateFieldType(field.fieldKey, value)
                }
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-3 pt-7">
              <div className="space-y-0.5">
                <Label>Required</Label>
                <p className="text-xs text-muted-foreground">Must be answered</p>
              </div>
              <Switch
                checked={!!field.validationRules?.required}
                onCheckedChange={(checked) =>
                  onUpdateField(field.fieldKey, {
                    validationRules: {
                      ...(field.validationRules ?? {}),
                      required: checked,
                    },
                  })
                }
                disabled={disabled}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Key: <span className="font-mono">{field.fieldKey}</span>
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || index === 0}
            onClick={onMoveUp}
          >
            Up
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || index === totalFields - 1}
            onClick={onMoveDown}
          >
            Down
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={disabled}
            onClick={onRemove}
          >
            Remove
          </Button>
        </div>
      </div>

      {fieldTypeSupportsOptions(field.fieldType) && (
        <div className="pt-2 border-t space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Options</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => onAddOption(field.fieldKey)}
            >
              Add option
            </Button>
          </div>

          <div className="space-y-2">
            {(field.options ?? [])
              .slice()
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((opt) => (
                <div
                  key={`${field.fieldKey}-opt-${opt.displayOrder}`}
                  className="grid grid-cols-[1fr,1fr,auto] gap-2 items-start"
                >
                  <Input
                    value={opt.label}
                    onChange={(e) =>
                      onUpdateOption(field.fieldKey, opt.displayOrder, {
                        label: e.target.value,
                      })
                    }
                    disabled={disabled}
                    placeholder="Label"
                  />
                  <Input
                    value={opt.value}
                    onChange={(e) =>
                      onUpdateOption(field.fieldKey, opt.displayOrder, {
                        value: e.target.value,
                      })
                    }
                    disabled={disabled}
                    placeholder="Value"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    onClick={() =>
                      onRemoveOption(field.fieldKey, opt.displayOrder)
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
});
