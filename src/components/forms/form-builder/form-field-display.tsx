import { Badge } from "@/components/ui/badge";
import { FormFieldDetails } from "./types";
import { fieldTypeSupportsOptions, getFieldTypeLabel } from "@/lib/form-ui";

type FormFieldDisplayProps = {
  field: FormFieldDetails;
  index: number;
};

export function FormFieldDisplay({ field, index }: FormFieldDisplayProps) {
  return (
    <div className="p-4 border rounded-lg bg-muted/30">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-mono text-muted-foreground">
              {index + 1}.
            </span>
            <p className="font-medium">{field.label}</p>
          </div>
          {field.description && (
            <p className="text-sm text-muted-foreground mb-2">
              {field.description}
            </p>
          )}
          <div className="flex gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              {getFieldTypeLabel(field.fieldType)}
            </Badge>
            {field.validationRules?.required && (
              <Badge variant="destructive" className="text-xs">
                Required
              </Badge>
            )}
            {!!field.conditionalLogic?.showIf?.length && (
              <Badge variant="secondary" className="text-xs">
                Conditional
              </Badge>
            )}
          </div>
        </div>
      </div>

      {fieldTypeSupportsOptions(field.fieldType) &&
        field.options &&
        field.options.length > 0 && (
          <div className="mt-3 pl-6 border-l-2">
            <p className="text-xs text-muted-foreground mb-2">Options:</p>
            <div className="flex flex-wrap gap-2">
              {field.options.map((opt) => (
                <Badge key={opt.value} variant="outline" className="text-xs">
                  {opt.label}
                </Badge>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
