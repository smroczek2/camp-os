import { z } from "zod";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { db } from "@/lib/db";
import { aiActions, events } from "@/lib/schema";
import { enforcePermission } from "@/lib/rbac";
import type { AIFormGeneration } from "@/types/forms";
import { getFieldTypeLabel, isReservedFieldKey } from "@/lib/form-ui";

// AI schema for form generation
export const aiFormGenerationSchema = z.object({
  formDefinition: z.object({
    name: z.string().describe("Clear, descriptive name for the form"),
    description: z
      .string()
      .describe("Brief description of the form's purpose"),
    formType: z
      .enum(["registration", "waiver", "medical", "custom"])
      .describe("Type of form being created"),
  }),
  fields: z
    .array(
      z.object({
        fieldKey: z
          .string()
          .describe("Unique snake_case identifier (e.g., child_name)"),
        label: z.string().describe("User-facing label for the field"),
        fieldType: z
          .enum([
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
          ])
          .describe("Type of input field (use boolean for a Yes/No question)"),
        description: z.string().optional().describe("Help text for the field"),
        validationRules: z
          .object({
            required: z.boolean().optional(),
            minLength: z.number().optional(),
            maxLength: z.number().optional(),
            min: z.number().optional(),
            max: z.number().optional(),
            pattern: z.string().optional(),
          })
          .optional(),
        displayOrder: z.number().describe("Order in which field appears"),
        sectionName: z.string().optional().describe("Group fields by section"),
        conditionalLogic: z
          .object({
            showIf: z
              .array(
                z.object({
                  fieldKey: z.string(),
                  operator: z.enum(["equals", "notEquals", "contains"]),
                  value: z.union([
                    z.string(),
                    z.number(),
                    z.boolean(),
                    z.array(z.string()),
                  ]),
                })
              )
              .optional(),
          })
          .optional()
          .describe("Show this field only when conditions are met"),
        options: z
          .array(
            z.object({
              label: z.string(),
              value: z.string(),
              displayOrder: z.number(),
              triggersFields: z
                .object({
                  fieldKeys: z
                    .array(z.string())
                    .optional()
                    .describe(
                      "Show these fields when this option is selected"
                    ),
                })
                .optional(),
            })
          )
          .optional()
          .describe("Options for select/radio/checkbox fields"),
      })
    )
    .describe("Array of form fields in display order"),
});

/**
 * Generate form structure from natural language prompt using AI
 */
export async function generateFormFromPrompt(
  prompt: string,
  campId: string,
  sessionId?: string
): Promise<AIFormGeneration> {
  const systemPrompt = `You are an expert form designer for a camp management system.
Generate a structured form definition based on the user's requirements.

Guidelines:
- Use clear, descriptive field names
- fieldKey must be snake_case (e.g., "child_name", "t_shirt_size")
- NEVER create fields for internal IDs or scope (campId/camp_id, sessionId/session_id, registrationId, childId, userId). Parents should never be asked to choose these.
- Add validation rules where appropriate
- Use conditional logic to show/hide fields based on previous answers
- For nested options (e.g., "Select Activity" with sub-activities), use triggersFields
- Group related fields into sections
- Set proper displayOrder for logical flow
- Make required fields clear in validation rules

Example: "Form with name, age, dietary restrictions (with allergies if Yes)"
Should generate:
- child_name (text, required)
- age (number, required, min: 5, max: 18)
- has_dietary_restrictions (boolean, required) // Yes/No question
- dietary_restrictions (textarea, conditional: showIf has_dietary_restrictions = true)`;

  const result = await generateObject({
    model: openai(process.env.OPENAI_MODEL || "gpt-4o"),
    schema: aiFormGenerationSchema,
    system: systemPrompt,
    prompt: `Camp ID: ${campId}${sessionId ? `, Session ID: ${sessionId}` : ""}

User Request: ${prompt}

Generate a complete form definition with all necessary fields, validation, and conditional logic.`,
  });

  return result.object;
}

export function sanitizeGeneratedForm(generatedForm: AIFormGeneration): AIFormGeneration {
  const filteredFields = generatedForm.fields
    .filter((field) => !isReservedFieldKey(field.fieldKey))
    .map((field, index) => ({
      ...field,
      displayOrder: index + 1,
    }));

  return {
    ...generatedForm,
    fields: filteredFields,
  };
}

export function buildFormPreview(generatedForm: AIFormGeneration) {
  return {
    formName: generatedForm.formDefinition.name,
    formType: generatedForm.formDefinition.formType,
    fieldCount: generatedForm.fields.length,
    sections: [...new Set(generatedForm.fields.map((f) => f.sectionName))].filter(
      Boolean
    ),
    fields: generatedForm.fields.map((f) => ({
      label: f.label,
      type: getFieldTypeLabel(f.fieldType),
      required: f.validationRules?.required ?? false,
      conditional: !!f.conditionalLogic,
      hasOptions: !!f.options && f.options.length > 0,
    })),
  };
}

/**
 * Create AI action for form generation (requires admin approval)
 */
export async function createFormGenerationAction(
  userId: string,
  prompt: string,
  campId: string,
  sessionId?: string
) {
  // Enforce permission - only admins can create forms
  await enforcePermission(userId, "form", "create");

  // Generate form structure using AI
  const generatedForm = sanitizeGeneratedForm(
    await generateFormFromPrompt(prompt, campId, sessionId)
  );

  const preview = buildFormPreview(generatedForm);

  return db.transaction(async (tx) => {
    const [aiAction] = await tx
      .insert(aiActions)
      .values({
        userId,
        action: "createForm",
        params: {
          prompt,
          campId,
          sessionId,
          generatedForm,
        },
        preview,
        status: "pending",
      })
      .returning();

    await tx.insert(events).values({
      streamId: `ai-action-${aiAction.id}`,
      eventType: "AIFormGenerationRequested",
      eventData: {
        aiActionId: aiAction.id,
        campId,
        sessionId,
        prompt,
      },
      version: 1,
      userId,
    });

    return aiAction;
  });
}

/**
 * Get pending AI form generation actions for approval
 */
export async function getPendingFormGenerations() {
  return db.query.aiActions.findMany({
    where: (aiActions, { eq, and }) =>
      and(eq(aiActions.action, "createForm"), eq(aiActions.status, "pending")),
    with: {
      user: {
        columns: { id: true, name: true, email: true },
      },
    },
    orderBy: (aiActions, { desc }) => [desc(aiActions.createdAt)],
  });
}
