import { z } from "zod";

// Field types enum
export const fieldTypeSchema = z.enum([
  "text",
  "textarea",
  "email",
  "phone",
  "number",
  "date",
  "select",
  "radio",
  "checkbox",
  "multiselect",
  "boolean",
]);

export type FieldType = z.infer<typeof fieldTypeSchema>;

// Validation rules schema
export const validationRulesSchema = z
  .object({
    required: z.boolean().optional(),
    minLength: z.number().positive().optional(),
    maxLength: z.number().positive().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    customErrorMessage: z.string().optional(),
  })
  .optional();

// Conditional logic schema
export const conditionalLogicSchema = z
  .object({
    showIf: z
      .array(
        z.object({
          fieldKey: z.string(),
          operator: z.enum([
            "equals",
            "notEquals",
            "contains",
            "greaterThan",
            "lessThan",
            "isEmpty",
            "isNotEmpty",
          ]),
          value: z.union([
            z.string(),
            z.number(),
            z.boolean(),
            z.array(z.string()),
          ]),
          logic: z.enum(["and", "or"]).optional(),
        })
      )
      .optional(),
    hideIf: z
      .array(
        z.object({
          fieldKey: z.string(),
          operator: z.enum([
            "equals",
            "notEquals",
            "contains",
            "greaterThan",
            "lessThan",
            "isEmpty",
            "isNotEmpty",
          ]),
          value: z.union([
            z.string(),
            z.number(),
            z.boolean(),
            z.array(z.string()),
          ]),
          logic: z.enum(["and", "or"]).optional(),
        })
      )
      .optional(),
  })
  .optional();

// Form submission schema
export const createFormSubmissionSchema = z.object({
  formDefinitionId: z.string().uuid(),
  userId: z.string().optional(),
  childId: z.string().uuid().optional(),
  registrationId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
  submissionData: z.record(z.string(), z.unknown()),
});

// Form definition creation schema
export const createFormDefinitionSchema = z.object({
  campId: z.string().uuid(),
  sessionId: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  formType: z.enum(["registration", "waiver", "medical", "custom"]),
});

/**
 * CRITICAL: Dynamic submission validation
 *
 * Builds a Zod schema at runtime from form field definitions.
 * This provides type-safe validation for flexible JSONB submission data.
 */
export function buildSubmissionSchema(
  fields: Array<{
    fieldKey: string;
    fieldType: FieldType;
    validationRules?: z.infer<typeof validationRulesSchema>;
  }>
) {
  const schemaShape: Record<string, z.ZodTypeAny> = {};

  fields.forEach((field) => {
    let fieldSchema: z.ZodTypeAny;

    // Build schema based on field type
    switch (field.fieldType) {
      case "email":
        fieldSchema = z.string().email();
        break;
      case "phone":
        fieldSchema = z
          .string()
          .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number");
        break;
      case "number":
        fieldSchema = z.number();
        break;
      case "date":
        fieldSchema = z.string().datetime().or(z.coerce.date());
        break;
      case "boolean":
        fieldSchema = z.boolean();
        break;
      case "multiselect":
      case "checkbox":
        fieldSchema = z.array(z.string());
        break;
      case "textarea":
      case "text":
      default:
        fieldSchema = z.string();
    }

    // Apply validation rules
    if (field.validationRules) {
      const rules = field.validationRules;

      // Required field
      if (rules.required === false) {
        fieldSchema = fieldSchema.optional();
      }

      // String validations
      if (
        field.fieldType === "text" ||
        field.fieldType === "textarea" ||
        field.fieldType === "email"
      ) {
        if (rules.minLength) {
          fieldSchema = (fieldSchema as z.ZodString).min(
            rules.minLength,
            rules.customErrorMessage ||
              `Minimum length is ${rules.minLength} characters`
          );
        }
        if (rules.maxLength) {
          fieldSchema = (fieldSchema as z.ZodString).max(
            rules.maxLength,
            rules.customErrorMessage ||
              `Maximum length is ${rules.maxLength} characters`
          );
        }
        if (rules.pattern) {
          fieldSchema = (fieldSchema as z.ZodString).regex(
            new RegExp(rules.pattern),
            rules.customErrorMessage || "Invalid format"
          );
        }
      }

      // Number validations
      if (field.fieldType === "number") {
        if (rules.min !== undefined) {
          fieldSchema = (fieldSchema as z.ZodNumber).min(
            rules.min,
            rules.customErrorMessage || `Minimum value is ${rules.min}`
          );
        }
        if (rules.max !== undefined) {
          fieldSchema = (fieldSchema as z.ZodNumber).max(
            rules.max,
            rules.customErrorMessage || `Maximum value is ${rules.max}`
          );
        }
      }
    }

    schemaShape[field.fieldKey] = fieldSchema;
  });

  return z.object(schemaShape);
}
