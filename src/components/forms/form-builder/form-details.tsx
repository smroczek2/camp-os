"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  publishFormAction,
  archiveFormAction,
  updateFormAction,
} from "@/app/actions/form-actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { fieldTypeSupportsOptions } from "@/lib/form-ui";
import { DynamicForm } from "@/components/forms/form-renderer/dynamic-form";
import { Separator } from "@/components/ui/separator";
import { FormDetails } from "./types";
import { useFormDraft } from "./hooks/use-form-draft";
import { FormHeader } from "./form-header";
import { FormMetadataEditor } from "./form-metadata-editor";
import { FormStats } from "./form-stats";
import { FormFieldList } from "./form-field-list";

export function FormDetailsView({ form }: { form: FormDetails }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<"details" | "preview">("details");

  const {
    draft,
    updateFormMetadata,
    updateField,
    updateFieldType,
    addField,
    removeField,
    addOption,
    updateOption,
    removeOption,
    resetDraft,
  } = useFormDraft(form);

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

  const scopeText = form.session
    ? `Session: ${new Date(form.session.startDate).toLocaleDateString()}`
    : `Camp: ${form.camp?.name}`;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <FormHeader
          formId={form.id}
          formName={form.name}
          formDescription={form.description}
          status={form.status}
          isPublished={form.isPublished}
          aiGenerated={!!form.aiActionId}
          submissionCount={form.submissions?.length ?? 0}
          view={view}
          isEditing={isEditing}
          saving={saving}
          onViewChange={setView}
          onEdit={() => {
            resetDraft();
            setIsEditing(true);
          }}
          onSave={handleSave}
          onCancel={() => {
            resetDraft();
            setIsEditing(false);
          }}
          onPublish={handlePublish}
          onArchive={handleArchive}
        />

        {view === "preview" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Parent preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                This shows how the form renders for parents. Submissions are
                disabled in preview.
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
              <FormMetadataEditor
                name={draft.name}
                description={draft.description}
                formType={draft.formType}
                disabled={saving}
                onNameChange={(name) => updateFormMetadata({ name })}
                onDescriptionChange={(description) =>
                  updateFormMetadata({ description })
                }
                onFormTypeChange={(formType) =>
                  updateFormMetadata({ formType })
                }
              />
            )}

            <FormStats
              fieldCount={form.fields?.length || 0}
              submissionCount={form.submissions?.length || 0}
              scope={scopeText}
            />

            <FormFieldList
              fields={isEditing ? draft.fields : form.fields || []}
              isEditing={isEditing}
              disabled={saving}
              onAddField={addField}
              onUpdateField={updateField}
              onUpdateFieldType={updateFieldType}
              onRemoveField={removeField}
              onAddOption={addOption}
              onUpdateOption={updateOption}
              onRemoveOption={removeOption}
            />

            {isEditing && (
              <div className="sticky bottom-4 mt-6">
                <div className="rounded-xl border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 p-3 flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetDraft();
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
