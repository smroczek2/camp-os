import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { FormType } from "./types";

type FormMetadataEditorProps = {
  name: string;
  description: string;
  formType: FormType;
  disabled?: boolean;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onFormTypeChange: (formType: FormType) => void;
};

export function FormMetadataEditor({
  name,
  description,
  formType,
  disabled = false,
  onNameChange,
  onDescriptionChange,
  onFormTypeChange,
}: FormMetadataEditorProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Edit form</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="edit-form-name">Form name</Label>
          <Input
            id="edit-form-name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="edit-form-description">Description</Label>
          <Textarea
            id="edit-form-description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="grid gap-2">
          <Label>Form type</Label>
          <Select
            value={formType}
            onValueChange={(value) => onFormTypeChange(value as FormType)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="registration">Registration</SelectItem>
              <SelectItem value="waiver">Waiver</SelectItem>
              <SelectItem value="medical">Medical</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
