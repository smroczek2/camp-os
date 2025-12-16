/**
 * Shared type definitions for form system
 * Eliminates type mismatches between server actions, components, and services
 */

/**
 * Base form types
 */
export type FormType = "registration" | "waiver" | "medical" | "custom";

export type FormStatus = "draft" | "active" | "archived";

/**
 * Validation rules for form fields
 */
export type ValidationRules = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
};

/**
 * Conditional logic for showing/hiding fields
 */
export type ConditionalLogic = {
  showIf?: Array<{
    fieldKey: string;
    operator: "equals" | "notEquals" | "contains" | "isEmpty" | "isNotEmpty";
    value: string | number | boolean | string[];
  }>;
};

/**
 * Field options (for select, radio, checkbox, etc.)
 */
export type FieldOption = {
  label: string;
  value: string;
  displayOrder: number;
  triggersFields?: { fieldKeys?: string[] };
  parentOptionId?: string | null;
};

/**
 * AI-generated form structure
 */
export type AIFormGeneration = {
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
    validationRules?: ValidationRules;
    displayOrder: number;
    sectionName?: string;
    conditionalLogic?: ConditionalLogic;
    options?: Array<{
      label: string;
      value: string;
      displayOrder: number;
      triggersFields?: { fieldKeys?: string[] };
    }>;
  }>;
};

/**
 * Form preview data returned by AI generation
 */
export type FormPreview = {
  formName: string;
  formType: FormType;
  fieldCount: number;
  sections?: string[];
  fields: Array<{
    label: string;
    type: string;
    required: boolean;
    conditional: boolean;
    hasOptions: boolean;
  }>;
};

/**
 * Complete AI action result from generateFormAction
 */
export type GeneratedFormResult = {
  id: string;
  action: string;
  params: {
    prompt: string;
    campId: string;
    sessionId?: string;
    generatedForm: AIFormGeneration;
  };
  preview: FormPreview;
  status: string;
  createdAt: Date;
  userId: string;
};

/**
 * Form field details from database
 */
export type FormFieldDetails = {
  id: string;
  fieldKey: string;
  label: string;
  description?: string | null;
  fieldType: string;
  validationRules?: ValidationRules | null;
  conditionalLogic?: ConditionalLogic | null;
  displayOrder: number;
  options?: Array<{
    id: string;
    label: string;
    value: string;
    displayOrder: number;
    triggersFields?: { fieldKeys?: string[] } | null;
    parentOptionId?: string | null;
  }> | null;
};

/**
 * Complete form definition from database
 */
export type FormDetails = {
  id: string;
  name: string;
  description: string | null;
  formType: FormType;
  status: FormStatus;
  isPublished: boolean;
  aiActionId: string | null;
  camp?: { name: string } | null;
  session?: { startDate: Date } | null;
  fields?: FormFieldDetails[] | null;
  submissions?: Array<{ id: string }> | null;
};

/**
 * Form configuration for rendering (client-side)
 */
export type FormConfig = {
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

/**
 * Type guard to check if a value is a valid GeneratedFormResult
 */
export function isGeneratedFormResult(value: unknown): value is GeneratedFormResult {
  if (typeof value !== "object" || value === null) return false;

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === "string" &&
    typeof obj.action === "string" &&
    typeof obj.params === "object" &&
    obj.params !== null &&
    typeof obj.preview === "object" &&
    obj.preview !== null &&
    typeof obj.status === "string"
  );
}

/**
 * Type guard to check if a value is a valid AIFormGeneration
 */
export function isAIFormGeneration(value: unknown): value is AIFormGeneration {
  if (typeof value !== "object" || value === null) return false;

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.formDefinition === "object" &&
    obj.formDefinition !== null &&
    Array.isArray(obj.fields)
  );
}

/**
 * Type guard to check if conditional logic condition value is valid
 */
export function isValidConditionValue(
  value: unknown
): value is string | number | boolean | string[] {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    (Array.isArray(value) && value.every((v) => typeof v === "string"))
  );
}
