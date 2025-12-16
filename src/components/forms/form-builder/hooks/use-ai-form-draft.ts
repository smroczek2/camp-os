import { useState, useCallback } from "react";
import { FormType, DraftOption } from "../types";
import { fieldTypeSupportsOptions } from "@/lib/form-ui";

export type AIGeneratedForm = {
  formDefinition: {
    name: string;
    description: string;
    formType: FormType;
  };
  fields: Array<{
    fieldKey: string;
    label: string;
    fieldType: string;
    description?: string;
    validationRules?: {
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      min?: number;
      max?: number;
      pattern?: string;
    };
    displayOrder: number;
    sectionName?: string;
    conditionalLogic?: unknown;
    options?: Array<{
      label: string;
      value: string;
      displayOrder: number;
      triggersFields?: { fieldKeys?: string[] };
    }>;
  }>;
};

export function useAIFormDraft(initialForm: AIGeneratedForm | null) {
  const [draft, setDraft] = useState<AIGeneratedForm | null>(initialForm);

  const updateFormMetadata = useCallback(
    (
      updates: Partial<{
        name: string;
        description: string;
        formType: FormType;
      }>
    ) => {
      setDraft((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          formDefinition: {
            ...prev.formDefinition,
            ...updates,
          },
        };
      });
    },
    []
  );

  const updateField = useCallback(
    (
      fieldKey: string,
      updates: Partial<{
        label: string;
        description: string;
        validationRules: { required?: boolean };
      }>
    ) => {
      setDraft((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          fields: prev.fields.map((f) =>
            f.fieldKey === fieldKey ? { ...f, ...updates } : f
          ),
        };
      });
    },
    []
  );

  const updateFieldType = useCallback((fieldKey: string, fieldType: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        fields: prev.fields.map((f) => {
          if (f.fieldKey !== fieldKey) return f;
          const next: typeof f = { ...f, fieldType };
          if (
            fieldTypeSupportsOptions(fieldType) &&
            (!next.options || next.options.length === 0)
          ) {
            next.options = [
              { label: "Option 1", value: "option_1", displayOrder: 1 },
              { label: "Option 2", value: "option_2", displayOrder: 2 },
            ];
          }
          return next;
        }),
      };
    });
  }, []);

  const addField = useCallback(() => {
    setDraft((prev) => {
      if (!prev) return prev;
      const nextIndex = prev.fields.length + 1;
      return {
        ...prev,
        fields: [
          ...prev.fields,
          {
            fieldKey: `new_field_${nextIndex}`,
            label: `New field ${nextIndex}`,
            fieldType: "text",
            displayOrder: nextIndex,
            validationRules: { required: false },
          },
        ],
      };
    });
  }, []);

  const removeField = useCallback((fieldKey: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const nextFields = prev.fields
        .filter((f) => f.fieldKey !== fieldKey)
        .map((f, index) => ({
          ...f,
          displayOrder: index + 1,
        }));
      return { ...prev, fields: nextFields };
    });
  }, []);

  const addOption = useCallback((fieldKey: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        fields: prev.fields.map((f) => {
          if (f.fieldKey !== fieldKey) return f;
          const options = f.options ? [...f.options] : [];
          const nextOrder = options.length + 1;
          options.push({
            label: `Option ${nextOrder}`,
            value: `option_${nextOrder}`,
            displayOrder: nextOrder,
          });
          return { ...f, options };
        }),
      };
    });
  }, []);

  const updateOption = useCallback(
    (
      fieldKey: string,
      optionDisplayOrder: number,
      updates: Partial<DraftOption>
    ) => {
      setDraft((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          fields: prev.fields.map((f) => {
            if (f.fieldKey !== fieldKey) return f;
            const options = (f.options ?? []).map((o) =>
              o.displayOrder === optionDisplayOrder ? { ...o, ...updates } : o
            );
            return { ...f, options };
          }),
        };
      });
    },
    []
  );

  const removeOption = useCallback(
    (fieldKey: string, optionDisplayOrder: number) => {
      setDraft((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          fields: prev.fields.map((f) => {
            if (f.fieldKey !== fieldKey) return f;
            const next = (f.options ?? [])
              .filter((o) => o.displayOrder !== optionDisplayOrder)
              .map((o, index) => ({
                ...o,
                displayOrder: index + 1,
              }));
            return { ...f, options: next };
          }),
        };
      });
    },
    []
  );

  const setFormDraft = useCallback((form: AIGeneratedForm | null) => {
    setDraft(form);
  }, []);

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
    setFormDraft,
  };
}
