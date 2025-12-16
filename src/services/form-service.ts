import { db } from "@/lib/db";
import {
  formDefinitions,
  formFields,
  formOptions,
  formSubmissions,
  events,
  aiActions,
} from "@/lib/schema";
import { buildSubmissionSchema, type FieldType } from "@/lib/form-validation";
import { eq, and } from "drizzle-orm";

// Type for AI-generated form structure
export type AIFormGeneration = {
  formDefinition: {
    name: string;
    description: string;
    formType: "registration" | "waiver" | "medical" | "custom";
  };
  fields: Array<{
    fieldKey: string;
    label: string;
    fieldType: FieldType;
    description?: string;
    validationRules?: {
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      min?: number;
      max?: number;
      pattern?: string;
    };
    conditionalLogic?: {
      showIf?: Array<{
        fieldKey: string;
        operator: "equals" | "notEquals" | "contains";
        value: string | number | boolean | string[];
      }>;
    };
    displayOrder: number;
    sectionName?: string;
    options?: Array<{
      label: string;
      value: string;
      displayOrder: number;
      triggersFields?: {
        fieldKeys?: string[];
      };
    }>;
  }>;
};

export class FormService {
  /**
   * Get complete form with all fields and options (including nested)
   */
  async getFormComplete(formId: string) {
    return db.query.formDefinitions.findFirst({
      where: eq(formDefinitions.id, formId),
      with: {
        fields: {
          orderBy: (fields: any, { asc }: any) => [asc(fields.displayOrder)],
          with: {
            options: {
              orderBy: (options: any, { asc }: any) => [asc(options.displayOrder)],
              with: {
                childOptions: true, // Nested options
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get all forms for a camp or session
   */
  async getFormsByCamp(campId: string, sessionId?: string) {
    return db.query.formDefinitions.findMany({
      where: sessionId
        ? and(
            eq(formDefinitions.campId, campId),
            eq(formDefinitions.sessionId, sessionId)
          )
        : eq(formDefinitions.campId, campId),
      with: {
        fields: {
          orderBy: (fields, { asc }) => [asc(fields.displayOrder)],
        },
      },
    });
  }

  /**
   * Submit form response with dynamic validation
   */
  async submitForm(data: {
    formDefinitionId: string;
    userId?: string;
    childId?: string;
    registrationId?: string;
    sessionId?: string;
    submissionData: Record<string, unknown>;
  }) {
    const formDef = await this.getFormComplete(data.formDefinitionId);
    if (!formDef) {
      throw new Error("Form definition not found");
    }

    // Build dynamic validation schema from form definition
    const submissionSchema = buildSubmissionSchema(
      formDef.fields.map((f) => ({
        fieldKey: f.fieldKey,
        fieldType: f.fieldType as FieldType,
        validationRules: f.validationRules,
      }))
    );

    // Validate submission data
    const validated = submissionSchema.parse(data.submissionData);

    return db.transaction(async (tx) => {
      const [submission] = await tx
        .insert(formSubmissions)
        .values({
          formDefinitionId: data.formDefinitionId,
          userId: data.userId,
          childId: data.childId,
          registrationId: data.registrationId,
          sessionId: data.sessionId,
          submissionData: validated,
          status: "submitted",
        })
        .returning();

      // Log event for audit trail
      await tx.insert(events).values({
        streamId: `submission-${submission.id}`,
        eventType: "FormSubmitted",
        eventData: {
          submissionId: submission.id,
          formId: data.formDefinitionId,
          userId: data.userId,
        },
        version: 1,
        userId: data.userId ?? null,
      });

      return submission;
    });
  }

  /**
   * Get submissions for a form
   */
  async getSubmissionsByForm(formId: string) {
    return db.query.formSubmissions.findMany({
      where: eq(formSubmissions.formDefinitionId, formId),
      with: {
        user: {
          columns: { id: true, name: true, email: true },
        },
        child: {
          columns: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: (submissions, { desc }) => [desc(submissions.submittedAt)],
    });
  }

  /**
   * Get submissions by user
   */
  async getSubmissionsByUser(userId: string) {
    return db.query.formSubmissions.findMany({
      where: eq(formSubmissions.userId, userId),
      with: {
        formDefinition: {
          columns: { id: true, name: true, formType: true },
        },
        child: {
          columns: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: (submissions, { desc }) => [desc(submissions.submittedAt)],
    });
  }

  /**
   * Execute AI-generated form creation (approval workflow)
   */
  async executeAIFormGeneration(aiActionId: string, approvedBy: string) {
    const aiAction = await db.query.aiActions.findFirst({
      where: eq(aiActions.id, aiActionId),
    });

    if (!aiAction || aiAction.status !== "approved") {
      throw new Error("AI action not found or not approved");
    }

    const params = aiAction.params as {
      campId: string;
      sessionId?: string;
      generatedForm: AIFormGeneration;
    };

    return db.transaction(async (tx) => {
      // Create form definition
      const [form] = await tx
        .insert(formDefinitions)
        .values({
          campId: params.campId,
          sessionId: params.sessionId,
          name: params.generatedForm.formDefinition.name,
          description: params.generatedForm.formDefinition.description,
          formType: params.generatedForm.formDefinition.formType,
          createdBy: aiAction.userId,
          aiActionId,
          status: "draft",
        })
        .returning();

      // Create fields and options
      for (const field of params.generatedForm.fields) {
        const [createdField] = await tx
          .insert(formFields)
          .values({
            formDefinitionId: form.id,
            fieldKey: field.fieldKey,
            label: field.label,
            description: field.description,
            fieldType: field.fieldType,
            validationRules: field.validationRules,
            conditionalLogic: field.conditionalLogic,
            displayOrder: field.displayOrder,
            sectionName: field.sectionName,
          })
          .returning();

        // Create options if present
        if (field.options) {
          for (const option of field.options) {
            await tx.insert(formOptions).values({
              formFieldId: createdField.id,
              label: option.label,
              value: option.value,
              displayOrder: option.displayOrder,
              triggersFields: option.triggersFields,
            });
          }
        }
      }

      // Update AI action status
      await tx
        .update(aiActions)
        .set({
          status: "executed",
          executedAt: new Date(),
        })
        .where(eq(aiActions.id, aiActionId));

      // Log events
      await tx.insert(events).values([
        {
          streamId: `form-${form.id}`,
          eventType: "FormCreatedByAI",
          eventData: { formId: form.id, aiActionId },
          version: 1,
          userId: approvedBy,
        },
        {
          streamId: `ai-action-${aiActionId}`,
          eventType: "AIActionExecuted",
          eventData: { aiActionId, formId: form.id },
          version: 2,
          userId: approvedBy,
        },
      ]);

      return form;
    });
  }

  /**
   * Publish a form (make it available to users)
   */
  async publishForm(formId: string, userId: string) {
    return db.transaction(async (tx) => {
      const [form] = await tx
        .update(formDefinitions)
        .set({
          isPublished: true,
          publishedAt: new Date(),
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(formDefinitions.id, formId))
        .returning();

      await tx.insert(events).values({
        streamId: `form-${formId}`,
        eventType: "FormPublished",
        eventData: { formId },
        version: 2,
        userId,
      });

      return form;
    });
  }

  /**
   * Archive a form
   */
  async archiveForm(formId: string, userId: string) {
    return db.transaction(async (tx) => {
      const [form] = await tx
        .update(formDefinitions)
        .set({
          status: "archived",
          updatedAt: new Date(),
        })
        .where(eq(formDefinitions.id, formId))
        .returning();

      await tx.insert(events).values({
        streamId: `form-${formId}`,
        eventType: "FormArchived",
        eventData: { formId },
        version: 3,
        userId,
      });

      return form;
    });
  }
}

export const formService = new FormService();
