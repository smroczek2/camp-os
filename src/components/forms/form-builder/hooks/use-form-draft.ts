import { useState, useCallback, useMemo } from "react";
import { DraftForm, DraftField, DraftOption, FormDetails } from "../types";
import { fieldTypeSupportsOptions } from "@/lib/form-ui";

function createUuid(): string {
  const cryptoObj = globalThis.crypto as
    | (Crypto & { randomUUID?: () => string })
    | undefined;
  if (cryptoObj?.randomUUID) return cryptoObj.randomUUID();
  if (cryptoObj?.getRandomValues) {
    const bytes = new Uint8Array(16);
    cryptoObj.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
      ""
    );
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  const fallback = Date.now().toString(16).padStart(12, "0");
  return `00000000-0000-4000-8000-${fallback}`;
}

export function useFormDraft(form: FormDetails) {
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

  const updateFormMetadata = useCallback(
    (updates: Partial<Pick<DraftForm, "name" | "description" | "formType">>) => {
      setDraft((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const updateField = useCallback((fieldId: string, updates: Partial<DraftField>) => {
    setDraft((prev) => ({
      ...prev,
      fields: prev.fields.map((f) =>
        f.id === fieldId ? { ...f, ...updates } : f
      ),
    }));
  }, []);

  const updateFieldType = useCallback((fieldId: string, fieldType: string) => {
    setDraft((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => {
        if (f.id !== fieldId) return f;
        const next: DraftField = { ...f, fieldType };
        if (
          fieldTypeSupportsOptions(fieldType) &&
          (!next.options || next.options.length === 0)
        ) {
          next.options = [
            {
              id: `new-opt-1-${fieldId}`,
              label: "Option 1",
              value: "option_1",
              displayOrder: 1,
            },
            {
              id: `new-opt-2-${fieldId}`,
              label: "Option 2",
              value: "option_2",
              displayOrder: 2,
            },
          ];
        }
        return next;
      }),
    }));
  }, []);

  const addField = useCallback(() => {
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
  }, []);

  const removeField = useCallback((fieldId: string) => {
    setDraft((prev) => {
      const next = prev.fields
        .filter((f) => f.id !== fieldId)
        .map((f, index) => ({
          ...f,
          displayOrder: index + 1,
        }));
      return { ...prev, fields: next };
    });
  }, []);

  const addOption = useCallback((fieldId: string) => {
    setDraft((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => {
        if (f.id !== fieldId) return f;
        const options = f.options ? [...f.options] : [];
        const nextOrder = options.length + 1;
        options.push({
          id: `new-opt-${nextOrder}-${fieldId}`,
          label: `Option ${nextOrder}`,
          value: `option_${nextOrder}`,
          displayOrder: nextOrder,
        });
        return { ...f, options };
      }),
    }));
  }, []);

  const updateOption = useCallback(
    (fieldId: string, optionId: string, updates: Partial<DraftOption>) => {
      setDraft((prev) => ({
        ...prev,
        fields: prev.fields.map((f) => {
          if (f.id !== fieldId) return f;
          return {
            ...f,
            options: (f.options ?? []).map((o) =>
              o.id === optionId ? { ...o, ...updates } : o
            ),
          };
        }),
      }));
    },
    []
  );

  const removeOption = useCallback((fieldId: string, optionId: string) => {
    setDraft((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => {
        if (f.id !== fieldId) return f;
        const next = (f.options ?? [])
          .filter((o) => o.id !== optionId)
          .map((o, index) => ({
            ...o,
            displayOrder: index + 1,
          }));
        return { ...f, options: next };
      }),
    }));
  }, []);

  const resetDraft = useCallback(() => {
    setDraft(initialDraft);
  }, [initialDraft]);

  return {
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
  };
}
