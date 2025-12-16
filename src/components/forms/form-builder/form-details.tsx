"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  publishFormAction,
  archiveFormAction,
  updateFormAction,
} from "@/app/actions/form-actions";
import { useRouter } from "next/navigation";
import { Archive, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useMemo, useState } from "react";
import {
  FIELD_TYPE_OPTIONS,
  fieldTypeSupportsOptions,
  getFieldTypeLabel,
} from "@/lib/form-ui";
import { DynamicForm } from "@/components/forms/form-renderer/dynamic-form";
import { Separator } from "@/components/ui/separator";

type FormType = "registration" | "waiver" | "medical" | "custom";

type FormOptionDetails = {
  id: string;
  label: string;
  value: string;
  displayOrder: number;
  triggersFields?: { fieldKeys?: string[] } | null;
  parentOptionId?: string | null;
};

type FormConditionalLogic = {
  showIf?: Array<{
    fieldKey: string;
    operator: "equals" | "notEquals" | "contains" | "isEmpty" | "isNotEmpty";
    value: unknown;
  }>;
} | null;

type FormFieldDetails = {
  id: string;
  fieldKey: string;
  label: string;
  description?: string | null;
  fieldType: string;
  validationRules?: { required?: boolean } | null;
  conditionalLogic?: FormConditionalLogic;
  displayOrder: number;
  options?: FormOptionDetails[] | null;
};

type FormDetails = {
  id: string;
  name: string;
  description: string | null;
  formType: FormType;
  status: string;
  isPublished: boolean;
  aiActionId: string | null;
  camp?: { name: string } | null;
  session?: { startDate: Date } | null;
  fields?: FormFieldDetails[] | null;
  submissions?: Array<{ id: string }> | null;
};

type DraftOption = {
  id: string;
  label: string;
  value: string;
  displayOrder: number;
  triggersFields?: { fieldKeys?: string[] };
  parentOptionId?: string;
};

type DraftField = {
  id: string;
  fieldKey: string;
  label: string;
  description: string;
  fieldType: string;
  required: boolean;
  displayOrder: number;
  options?: DraftOption[];
};

type DraftForm = {
  name: string;
  description: string;
  formType: FormType;
  fields: DraftField[];
};

export function FormDetailsView({ form }: { form: FormDetails }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<"details" | "preview">("details");

  const initialDraft: DraftForm = useMemo(() => {
    const fields = (form.fields ?? [])
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((field, index) => ({
        id: field.id,
        fieldKey: field.fieldKey,
        label: field.label,
        description: field.description ?? "",
        fieldType: field.fieldType,
        required: !!field.validationRules?.required,
        displayOrder: index + 1,
        options: (field.options ?? [])
          .slice()
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((opt, optIndex) => ({
            id: opt.id,
            label: opt.label,
            value: opt.value,
            displayOrder: optIndex + 1,
            triggersFields: opt.triggersFields ?? undefined,
            parentOptionId: opt.parentOptionId ?? undefined,
          })),
      }));

    return {
      name: form.name,
      description: form.description ?? "",
      formType: form.formType,
      fields,
    };
  }, [form.description, form.fields, form.formType, form.name]);

  const [draft, setDraft] = useState<DraftForm>(initialDraft);

  const addField = () => {
    const createUuid = () => {
      const cryptoObj = globalThis.crypto as
        | (Crypto & { randomUUID?: () => string })
        | undefined;
      if (cryptoObj?.randomUUID) return cryptoObj.randomUUID();
      if (cryptoObj?.getRandomValues) {
        const bytes = new Uint8Array(16);
        cryptoObj.getRandomValues(bytes);
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = Array.from(bytes, (b) =>
          b.toString(16).padStart(2, "0")
        ).join("");
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
      }
      const fallback = Date.now().toString(16).padStart(12, "0");
      return `00000000-0000-4000-8000-${fallback}`;
    };

    const id = createUuid();

    setDraft((prev) => {
      const nextIndex = prev.fields.length + 1;
      return {
        ...prev,
        fields: [
          ...prev.fields,
          {
            id,
            fieldKey: `new_field_${nextIndex}`,
            label: `New field ${nextIndex}`,
            description: "",
            fieldType: "text",
            required: false,
            displayOrder: nextIndex,
          },
        ],
      };
    });
  };

  const handlePublish = async () => {
    try {
      await publishFormAction(form.id);
      router.refresh();
    } catch (error) {
      alert(
        `Error: ${error instanceof Error ? error.message : "Failed to publish"}`
      );
    }
  };

  const handleArchive = async () => {
    if (
      confirm("Archive this form? It will no longer be available to users.")
    ) {
      try {
        await archiveFormAction(form.id);
        router.push("/dashboard/admin/forms");
      } catch (error) {
        alert(
          `Error: ${error instanceof Error ? error.message : "Failed to archive"}`
        );
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateFormAction({
        formId: form.id,
        name: draft.name,
        description: draft.description,
        formType: draft.formType,
        fields: draft.fields.map((field) => ({
          id: field.id,
          fieldKey: field.fieldKey,
          label: field.label,
          description: field.description,
          fieldType: field.fieldType,
          required: field.required,
          displayOrder: field.displayOrder,
          options: fieldTypeSupportsOptions(field.fieldType)
            ? (field.options ?? []).map((opt) => ({
                label: opt.label,
                value: opt.value,
                displayOrder: opt.displayOrder,
                triggersFields: opt.triggersFields,
                parentOptionId: opt.parentOptionId,
              }))
            : [],
        })),
      });
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      alert(
        `Error: ${error instanceof Error ? error.message : "Failed to save changes"}`
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link href="/dashboard/admin/forms">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Forms
          </Button>
        </Link>

        {/* Header */}
        <Card className="mb-6">
          <CardHeader className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-3xl font-bold leading-tight truncate">
                  {form.name}
                </h1>
                {form.description && (
                  <p className="text-muted-foreground mt-1 line-clamp-2">
                    {form.description}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Badge variant={form.isPublished ? "default" : "outline"}>
                  {form.status}
                </Badge>
                {form.aiActionId && (
                  <Badge variant="secondary" className="text-xs">
                    AI Generated
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={view === "details" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setView("details")}
                >
                  Details
                </Button>
                <Button
                  type="button"
                  variant={view === "preview" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setView("preview")}
                >
                  Parent preview
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {!isEditing && view === "details" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDraft(initialDraft);
                      setIsEditing(true);
                    }}
                  >
                    Edit
                  </Button>
                )}
                {isEditing && view === "details" && (
                  <>
                    <Button onClick={handleSave} size="sm" disabled={saving}>
                      {saving ? "Saving..." : "Save changes"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDraft(initialDraft);
                        setIsEditing(false);
                      }}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </>
                )}
                {!form.isPublished && form.status === "draft" && view === "details" && (
                  <Button onClick={handlePublish} size="sm">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Publish
                  </Button>
                )}
                {form.status !== "archived" && view === "details" && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleArchive}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {view === "preview" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Parent preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                This shows how the form renders for parents. Submissions are disabled in preview.
              </p>
              <Separator />
              <DynamicForm
                mode="preview"
                formConfig={{
                  id: form.id,
                  name: form.name,
                  fields: (form.fields ?? []).map((field) => ({
                    id: field.id,
                    fieldKey: field.fieldKey,
                    label: field.label,
                    description: field.description ?? undefined,
                    fieldType: field.fieldType,
                    validationRules: field.validationRules ?? undefined,
                    conditionalLogic: field.conditionalLogic ?? undefined,
                    displayOrder: field.displayOrder,
                    options: (field.options ?? []).map((opt) => ({
                      label: opt.label,
                      value: opt.value,
                    })),
                  })),
                }}
              />
            </CardContent>
          </Card>
        )}

        {view === "details" && (
          <>
            {isEditing && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Edit form</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-form-name">Form name</Label>
                <Input
                  id="edit-form-name"
                  value={draft.name}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, name: e.target.value }))
                  }
                  disabled={saving}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-form-description">Description</Label>
                <Textarea
                  id="edit-form-description"
                  value={draft.description}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  disabled={saving}
                />
              </div>

              <div className="grid gap-2">
                <Label>Form type</Label>
                <Select
                  value={draft.formType}
                  onValueChange={(value) =>
                    setDraft((prev) => ({
                      ...prev,
                      formType: value as FormType,
                    }))
                  }
                  disabled={saving}
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
            )}

        {/* Form Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {form.fields?.length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Fields</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {form.submissions?.length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Submissions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium">
                {form.session
                  ? `Session: ${new Date(form.session.startDate).toLocaleDateString()}`
                  : `Camp: ${form.camp?.name}`}
              </div>
              <p className="text-sm text-muted-foreground">Scope</p>
            </CardContent>
          </Card>
        </div>

        {/* Fields List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Form Fields</CardTitle>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addField}
                  disabled={saving}
                >
                  Add field
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {form.fields && form.fields.length > 0 ? (
                isEditing ? (
                  draft.fields
                    .slice()
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((field, idx) => (
                      <div
                        key={field.id}
                        className="p-4 border rounded-lg bg-muted/30"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-mono text-muted-foreground">
                                {idx + 1}.
                              </span>
                              <Input
                                value={field.label}
                                onChange={(e) =>
                                  setDraft((prev) => ({
                                    ...prev,
                                    fields: prev.fields.map((f) =>
                                      f.id === field.id
                                        ? { ...f, label: e.target.value }
                                        : f
                                    ),
                                  }))
                                }
                                disabled={saving}
                              />
                            </div>

                            <div className="grid gap-2 mb-2">
                              <Label className="text-xs text-muted-foreground">
                                Help text
                              </Label>
                              <Textarea
                                value={field.description}
                                onChange={(e) =>
                                  setDraft((prev) => ({
                                    ...prev,
                                    fields: prev.fields.map((f) =>
                                      f.id === field.id
                                        ? { ...f, description: e.target.value }
                                        : f
                                    ),
                                  }))
                                }
                                disabled={saving}
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
                              Key:{" "}
                              <span className="font-mono">{field.fieldKey}</span>
                            </p>

                            <div className="mt-3 grid grid-cols-2 gap-3 items-center">
                              <div className="grid gap-2">
                                <Label>Answer type</Label>
                                <Select
                                  value={field.fieldType}
                                  onValueChange={(value) =>
                                    setDraft((prev) => ({
                                      ...prev,
                                      fields: prev.fields.map((f) => {
                                        if (f.id !== field.id) return f;
                                        const next: DraftField = {
                                          ...f,
                                          fieldType: value,
                                        };
                                        if (
                                          fieldTypeSupportsOptions(value) &&
                                          (!next.options ||
                                            next.options.length === 0)
                                        ) {
                                          next.options = [
                                            {
                                              id: `new-opt-1-${field.id}`,
                                              label: "Option 1",
                                              value: "option_1",
                                              displayOrder: 1,
                                            },
                                            {
                                              id: `new-opt-2-${field.id}`,
                                              label: "Option 2",
                                              value: "option_2",
                                              displayOrder: 2,
                                            },
                                          ];
                                        }
                                        return next;
                                      }),
                                    }))
                                  }
                                  disabled={saving}
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
                                  <p className="text-xs text-muted-foreground">
                                    Must be answered
                                  </p>
                                </div>
                                <Switch
                                  checked={field.required}
                                  onCheckedChange={(checked) =>
                                    setDraft((prev) => ({
                                      ...prev,
                                      fields: prev.fields.map((f) =>
                                        f.id === field.id
                                          ? { ...f, required: checked }
                                          : f
                                      ),
                                    }))
                                  }
                                  disabled={saving}
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
                            disabled={saving}
                            onClick={() =>
                              setDraft((prev) => {
                                const next = prev.fields
                                  .filter((f) => f.id !== field.id)
                                  .map((f, index) => ({
                                    ...f,
                                    displayOrder: index + 1,
                                  }));
                                return { ...prev, fields: next };
                              })
                            }
                          >
                            Remove field
                          </Button>
                        </div>

                        {fieldTypeSupportsOptions(field.fieldType) && (
                          <div className="mt-3 pl-6 border-l-2 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-muted-foreground">
                                Options:
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={saving}
                                onClick={() =>
                                  setDraft((prev) => ({
                                    ...prev,
                                    fields: prev.fields.map((f) => {
                                      if (f.id !== field.id) return f;
                                      const options = f.options
                                        ? [...f.options]
                                        : [];
                                      const nextOrder = options.length + 1;
                                      options.push({
                                        id: `new-opt-${nextOrder}-${field.id}`,
                                        label: `Option ${nextOrder}`,
                                        value: `option_${nextOrder}`,
                                        displayOrder: nextOrder,
                                      });
                                      return { ...f, options };
                                    }),
                                  }))
                                }
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
                                        setDraft((prev) => ({
                                          ...prev,
                                          fields: prev.fields.map((f) => {
                                            if (f.id !== field.id) return f;
                                            return {
                                              ...f,
                                              options: (f.options ?? []).map((o) =>
                                                o.id === opt.id
                                                  ? { ...o, label: e.target.value }
                                                  : o
                                              ),
                                            };
                                          }),
                                        }))
                                      }
                                      disabled={saving}
                                    />
                                    <Input
                                      value={opt.value}
                                      onChange={(e) =>
                                        setDraft((prev) => ({
                                          ...prev,
                                          fields: prev.fields.map((f) => {
                                            if (f.id !== field.id) return f;
                                            return {
                                              ...f,
                                              options: (f.options ?? []).map((o) =>
                                                o.id === opt.id
                                                  ? { ...o, value: e.target.value }
                                                  : o
                                              ),
                                            };
                                          }),
                                        }))
                                      }
                                      disabled={saving}
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      disabled={saving}
                                      onClick={() =>
                                        setDraft((prev) => ({
                                          ...prev,
                                          fields: prev.fields.map((f) => {
                                            if (f.id !== field.id) return f;
                                            const next = (f.options ?? [])
                                              .filter((o) => o.id !== opt.id)
                                              .map((o, index) => ({
                                                ...o,
                                                displayOrder: index + 1,
                                              }));
                                            return { ...f, options: next };
                                          }),
                                        }))
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
                    ))
                ) : (
                  form.fields
                    .slice()
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((field, idx) => (
                      <div
                        key={field.id}
                        className="p-4 border rounded-lg bg-muted/30"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-mono text-muted-foreground">
                                {idx + 1}.
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
                              <p className="text-xs text-muted-foreground mb-2">
                                Options:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {field.options.map((opt) => (
                                  <Badge
                                    key={opt.value}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {opt.label}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
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

        {isEditing && (
          <div className="sticky bottom-4 mt-6">
            <div className="rounded-xl border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 p-3 flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setDraft(initialDraft);
                  setIsEditing(false);
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
