import { db } from "@/lib/db";
import {
  formDefinitions,
  formFields,
  formOptions,
  formSubmissions,
  formSnapshots,
  events,
  aiActions,
} from "@/lib/schema";
import { buildSubmissionSchema, type FieldType } from "@/lib/form-validation";
import { eq, and, inArray } from "drizzle-orm";
import type { AIFormGeneration } from "@/types/forms";

export class FormService {
  /**
   * Get complete form with all fields and options (including nested)
   */
  async getFormComplete(formId: string) {
    return db.query.formDefinitions.findFirst({
      where: eq(formDefinitions.id, formId),
      with: {
        fields: {
          orderBy: (fields, { asc }) => [asc(fields.displayOrder)],
          with: {
            options: {
              orderBy: (options, { asc }) => [asc(options.displayOrder)],
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
   * Helper: Create a snapshot of the current form state
   */
  private async createSnapshot(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    formId: string,
    version: number
  ) {
    const completeForm = await tx.query.formDefinitions.findFirst({
      where: eq(formDefinitions.id, formId),
      with: {
        fields: {
          orderBy: (fields, { asc }) => [asc(fields.displayOrder)],
          with: {
            options: {
              orderBy: (options, { asc }) => [asc(options.displayOrder)],
              with: {
                childOptions: true,
              },
            },
          },
        },
      },
    });

    if (!completeForm) {
      throw new Error("Form not found for snapshot");
    }

    await tx.insert(formSnapshots).values({
      formDefinitionId: formId,
      version,
      snapshot: completeForm as unknown as Record<string, unknown>,
    });

    return completeForm;
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

    // Get snapshot for the current version
    const snapshot = await db.query.formSnapshots.findFirst({
      where: and(
        eq(formSnapshots.formDefinitionId, data.formDefinitionId),
        eq(formSnapshots.version, formDef.version)
      ),
    });

    if (!snapshot) {
      throw new Error(
        `Form snapshot not found for version ${formDef.version}. Please ensure the form is published.`
      );
    }

    // Validate against the snapshot, not current form
    const snapshotData = snapshot.snapshot as {
      fields: Array<{
        fieldKey: string;
        fieldType: string;
        validationRules?: {
          required?: boolean;
          minLength?: number;
          maxLength?: number;
          min?: number;
          max?: number;
          pattern?: string;
        };
      }>;
    };

    const submissionSchema = buildSubmissionSchema(
      snapshotData.fields.map((f) => ({
        fieldKey: f.fieldKey,
        fieldType: f.fieldType as FieldType,
        validationRules: f.validationRules ?? undefined,
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
          formVersion: formDef.version,
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
          formVersion: formDef.version,
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
          columns: { id: true, firstName: true, lastName: true, dateOfBirth: true },
        },
        session: {
          columns: { id: true, startDate: true, endDate: true },
          with: {
            camp: {
              columns: { id: true, name: true },
            },
          },
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
          version: 3,
          userId: approvedBy,
        },
      ]);

      return form;
    });
  }

  /**
   * Update a form definition + fields/options
   */
  async updateFormDefinition(
    formId: string,
    userId: string,
    data: {
      name: string;
      description: string | null;
      formType: "registration" | "waiver" | "medical" | "custom";
      fields: Array<{
        id?: string;
        fieldKey: string;
        label: string;
        description?: string | null;
        fieldType: string;
        required: boolean;
        displayOrder: number;
        options?: Array<{
          label: string;
          value: string;
          displayOrder: number;
          triggersFields?: { fieldKeys?: string[] };
          parentOptionId?: string | null;
        }>;
      }>;
    }
  ) {
    return db.transaction(async (tx) => {
      const existingForm = await tx.query.formDefinitions.findFirst({
        where: eq(formDefinitions.id, formId),
        columns: { id: true, version: true },
      });

      if (!existingForm) {
        throw new Error("Form not found");
      }

      const nextVersion = existingForm.version + 1;

      await tx
        .update(formDefinitions)
        .set({
          name: data.name,
          description: data.description,
          formType: data.formType,
          version: nextVersion,
          updatedAt: new Date(),
        })
        .where(eq(formDefinitions.id, formId));

      const existingFields = await tx.query.formFields.findMany({
        where: eq(formFields.formDefinitionId, formId),
        columns: { id: true, fieldKey: true, validationRules: true },
      });

      const existingFieldById = new Map(existingFields.map((f) => [f.id, f]));
      const keepFieldIds: string[] = [];

      // Upsert fields
      for (const field of data.fields) {
        if (field.id && existingFieldById.has(field.id)) {
          const existingField = existingFieldById.get(field.id)!;

          if (existingField.fieldKey !== field.fieldKey) {
            throw new Error(
              `Field key mismatch for ${field.id}; create a new field instead`
            );
          }

          const nextValidationRules = {
            ...(existingField.validationRules ?? {}),
            required: field.required,
          };

          await tx
            .update(formFields)
            .set({
              label: field.label,
              description: field.description ?? null,
              fieldType: field.fieldType,
              displayOrder: field.displayOrder,
              validationRules: nextValidationRules,
              updatedAt: new Date(),
            })
            .where(eq(formFields.id, field.id));

          keepFieldIds.push(field.id);

          // Replace options
          await tx
            .delete(formOptions)
            .where(eq(formOptions.formFieldId, field.id));

          if (field.options && field.options.length > 0) {
            await tx.insert(formOptions).values(
              field.options.map((opt) => ({
                formFieldId: field.id!,
                parentOptionId: opt.parentOptionId ?? null,
                label: opt.label,
                value: opt.value,
                displayOrder: opt.displayOrder,
                triggersFields: opt.triggersFields,
              }))
            );
          }
        } else {
          const [createdField] = await tx
            .insert(formFields)
            .values({
              formDefinitionId: formId,
              fieldKey: field.fieldKey,
              label: field.label,
              description: field.description ?? null,
              fieldType: field.fieldType,
              validationRules: { required: field.required },
              displayOrder: field.displayOrder,
              updatedAt: new Date(),
            })
            .returning();

          keepFieldIds.push(createdField.id);

          if (field.options && field.options.length > 0) {
            await tx.insert(formOptions).values(
              field.options.map((opt) => ({
                formFieldId: createdField.id,
                parentOptionId: opt.parentOptionId ?? null,
                label: opt.label,
                value: opt.value,
                displayOrder: opt.displayOrder,
                triggersFields: opt.triggersFields,
              }))
            );
          }
        }
      }

      // Delete removed fields (cascade deletes options)
      const toDelete = existingFields
        .map((f) => f.id)
        .filter((id) => !keepFieldIds.includes(id));
      if (toDelete.length > 0) {
        await tx.delete(formFields).where(inArray(formFields.id, toDelete));
      }

      // Create snapshot of the new version (if form is published)
      const formStatus = await tx.query.formDefinitions.findFirst({
        where: eq(formDefinitions.id, formId),
        columns: { isPublished: true },
      });

      if (formStatus?.isPublished) {
        await this.createSnapshot(tx, formId, nextVersion);
      }

      await tx.insert(events).values({
        streamId: `form-${formId}`,
        eventType: "FormUpdated",
        eventData: { formId, newVersion: nextVersion },
        version: nextVersion,
        userId,
      });

      const [updatedForm] = await tx
        .select()
        .from(formDefinitions)
        .where(eq(formDefinitions.id, formId));

      return updatedForm;
    });
  }

  /**
   * Publish a form (make it available to users)
   */
  async publishForm(formId: string, userId: string) {
    return db.transaction(async (tx) => {
      // Get current form version before publishing
      const currentForm = await tx.query.formDefinitions.findFirst({
        where: eq(formDefinitions.id, formId),
        columns: { version: true },
      });

      if (!currentForm) {
        throw new Error("Form not found");
      }

      // Create snapshot before publishing
      await this.createSnapshot(tx, formId, currentForm.version);

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
        eventData: { formId, version: currentForm.version },
        version: currentForm.version,
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
