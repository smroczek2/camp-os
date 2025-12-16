import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DraftField, DraftOption } from "./types";
import {
  FIELD_TYPE_OPTIONS,
  fieldTypeSupportsOptions,
  getFieldTypeLabel,
} from "@/lib/form-ui";

type FormFieldEditorProps = {
  field: DraftField;
  index: number;
  disabled?: boolean;
  onUpdateField: (fieldId: string, updates: Partial<DraftField>) => void;
  onUpdateFieldType: (fieldId: string, fieldType: string) => void;
  onRemoveField: (fieldId: string) => void;
  onAddOption: (fieldId: string) => void;
  onUpdateOption: (
    fieldId: string,
    optionId: string,
    updates: Partial<DraftOption>
  ) => void;
  onRemoveOption: (fieldId: string, optionId: string) => void;
};

export const FormFieldEditor = memo(function FormFieldEditor({
  field,
  index,
  disabled = false,
  onUpdateField,
  onUpdateFieldType,
  onRemoveField,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
}: FormFieldEditorProps) {
  return (
    <div className="p-4 border rounded-lg bg-muted/30">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-mono text-muted-foreground">
              {index + 1}.
            </span>
            <Input
              value={field.label}
              onChange={(e) =>
                onUpdateField(field.id, { label: e.target.value })
              }
              disabled={disabled}
            />
          </div>

          <div className="grid gap-2 mb-2">
            <Label className="text-xs text-muted-foreground">Help text</Label>
            <Textarea
              value={field.description}
              onChange={(e) =>
                onUpdateField(field.id, { description: e.target.value })
              }
              disabled={disabled}
            />
          </div>

          <div className="flex gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              {getFieldTypeLabel(field.fieldType)}
            </Badge>
            {field.required && (
              <Badge variant="destructive" className="text-xs">
                Required
              </Badge>
            )}
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            Key: <span className="font-mono">{field.fieldKey}</span>
          </p>

          <div className="mt-3 grid grid-cols-2 gap-3 items-center">
            <div className="grid gap-2">
              <Label>Answer type</Label>
              <Select
                value={field.fieldType}
                onValueChange={(value) => onUpdateFieldType(field.id, value)}
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
                checked={field.required}
                onCheckedChange={(checked) =>
                  onUpdateField(field.id, { required: checked })
                }
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={disabled}
          onClick={() => onRemoveField(field.id)}
        >
          Remove field
        </Button>
      </div>

      {fieldTypeSupportsOptions(field.fieldType) && (
        <div className="mt-3 pl-6 border-l-2 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Options:</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => onAddOption(field.id)}
            >
              Add
            </Button>
          </div>

          <div className="space-y-2">
            {(field.options ?? [])
              .slice()
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((opt) => (
                <div
                  key={opt.id}
                  className="grid grid-cols-[1fr,1fr,auto] gap-2"
                >
                  <Input
                    value={opt.label}
                    onChange={(e) =>
                      onUpdateOption(field.id, opt.id, { label: e.target.value })
                    }
                    disabled={disabled}
                  />
                  <Input
                    value={opt.value}
                    onChange={(e) =>
                      onUpdateOption(field.id, opt.id, { value: e.target.value })
                    }
                    disabled={disabled}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    onClick={() => onRemoveOption(field.id, opt.id)}
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
