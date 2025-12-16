export const FIELD_TYPE_LABELS: Record<string, string> = {
  text: "Short text",
  textarea: "Long answer",
  email: "Email",
  phone: "Phone number",
  number: "Number",
  date: "Date",
  select: "Dropdown",
  radio: "Multiple choice",
  checkbox: "Checkboxes",
  multiselect: "Multi-select",
  boolean: "Yes / No",
};

export function getFieldTypeLabel(fieldType: string) {
  return FIELD_TYPE_LABELS[fieldType] ?? fieldType;
}

export function fieldTypeSupportsOptions(fieldType: string) {
  return (
    fieldType === "select" ||
    fieldType === "radio" ||
    fieldType === "checkbox" ||
    fieldType === "multiselect"
  );
}

export const FIELD_TYPE_OPTIONS = [
  { value: "text", label: FIELD_TYPE_LABELS.text },
  { value: "textarea", label: FIELD_TYPE_LABELS.textarea },
  { value: "email", label: FIELD_TYPE_LABELS.email },
  { value: "phone", label: FIELD_TYPE_LABELS.phone },
  { value: "number", label: FIELD_TYPE_LABELS.number },
  { value: "date", label: FIELD_TYPE_LABELS.date },
  { value: "select", label: FIELD_TYPE_LABELS.select },
  { value: "radio", label: FIELD_TYPE_LABELS.radio },
  { value: "checkbox", label: FIELD_TYPE_LABELS.checkbox },
  { value: "multiselect", label: FIELD_TYPE_LABELS.multiselect },
  { value: "boolean", label: FIELD_TYPE_LABELS.boolean },
];

export const RESERVED_FORM_FIELD_KEYS = new Set([
  "camp_id",
  "campid",
  "session_id",
  "sessionid",
  "registration_id",
  "registrationid",
  "child_id",
  "childid",
  "user_id",
  "userid",
]);

export function isReservedFieldKey(fieldKey: string) {
  const normalized = fieldKey.trim().toLowerCase().replaceAll("-", "_");
  return RESERVED_FORM_FIELD_KEYS.has(normalized);
}
