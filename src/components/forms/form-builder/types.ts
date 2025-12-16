export type FormType = "registration" | "waiver" | "medical" | "custom";

export type FormOptionDetails = {
  id: string;
  label: string;
  value: string;
  displayOrder: number;
  triggersFields?: { fieldKeys?: string[] } | null;
  parentOptionId?: string | null;
};

export type FormConditionalLogic = {
  showIf?: Array<{
    fieldKey: string;
    operator: "equals" | "notEquals" | "contains" | "isEmpty" | "isNotEmpty";
    value: string | number | boolean | string[];
  }>;
} | null;

export type FormFieldDetails = {
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

export type FormDetails = {
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

export type DraftOption = {
  id: string;
  label: string;
  value: string;
  displayOrder: number;
  triggersFields?: { fieldKeys?: string[] };
  parentOptionId?: string;
};

export type DraftField = {
  id: string;
  fieldKey: string;
  label: string;
  description: string;
  fieldType: string;
  required: boolean;
  displayOrder: number;
  options?: DraftOption[];
};

export type DraftForm = {
  name: string;
  description: string;
  formType: FormType;
  fields: DraftField[];
};
