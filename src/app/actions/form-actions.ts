"use server";

import { z } from "zod";
import { getSession } from "@/lib/auth-helper";
import { enforcePermission, canAccessForm } from "@/lib/rbac";
import { formService } from "@/services/form-service";
import {
  aiFormGenerationSchema,
  buildFormPreview,
  createFormGenerationAction,
} from "@/lib/ai-tools/form-builder-tool";
import { sanitizeGeneratedForm } from "@/lib/ai-tools/form-builder-tool";
import { ForbiddenError } from "@/lib/rbac";
import { db } from "@/lib/db";
import { aiActions, events } from "@/lib/schema";
import { eq } from "drizzle-orm";

/**
 * Submit a form (parents submit forms for their children)
 */
export async function submitFormAction(data: {
  formDefinitionId: string;
  childId?: string;
  registrationId?: string;
  sessionId?: string;
  submissionData: Record<string, unknown>;
}) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Check permission
  await enforcePermission(session.user.id, "formSubmission", "create");

  // Check form access
  const canAccess = await canAccessForm(session.user.id, data.formDefinitionId);
  if (!canAccess) {
    throw new ForbiddenError("Cannot access this form");
  }

  return formService.submitForm({
    ...data,
    userId: session.user.id,
  });
}

/**
 * Get form with all fields and options (for rendering)
 */
export async function getFormAction(formId: string) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Check permission
  await enforcePermission(session.user.id, "form", "read");

  // Check form access
  const canAccess = await canAccessForm(session.user.id, formId);
  if (!canAccess) {
    throw new ForbiddenError("Cannot access this form");
  }

  return formService.getFormComplete(formId);
}

/**
 * Get all forms for a camp or session
 */
export async function getFormsAction(campId: string, sessionId?: string) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Check permission
  await enforcePermission(session.user.id, "form", "read");

  return formService.getFormsByCamp(campId, sessionId);
}

/**
 * Get user's form submissions
 */
export async function getMySubmissionsAction() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  return formService.getSubmissionsByUser(session.user.id);
}

/**
 * Get submissions for a form (admin only)
 */
export async function getFormSubmissionsAction(formId: string) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Check permission (only admins can view all submissions)
  await enforcePermission(session.user.id, "formSubmission", "read");

  return formService.getSubmissionsByForm(formId);
}

/**
 * Generate form using AI (admin only)
 */
export async function generateFormAction(data: {
  prompt: string;
  campId: string;
  sessionId?: string;
}) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Permission check happens inside createFormGenerationAction
  return createFormGenerationAction(
    session.user.id,
    data.prompt,
    data.campId,
    data.sessionId
  );
}

/**
 * Approve AI-generated form (admin only)
 */
export async function approveAIFormAction(data: {
  aiActionId: string;
  generatedForm?: unknown;
}) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Check permission
  await enforcePermission(session.user.id, "form", "create");

  const { aiActionId, generatedForm } = z
    .object({
      aiActionId: z.string().uuid(),
      generatedForm: z.unknown().optional(),
    })
    .parse(data);

  const aiAction = await db.query.aiActions.findFirst({
    where: eq(aiActions.id, aiActionId),
  });

  if (!aiAction) {
    throw new Error("AI action not found");
  }

  if (aiAction.status !== "pending") {
    throw new Error(`AI action is ${aiAction.status} and cannot be approved`);
  }

  const existingParams = aiAction.params as Record<string, unknown>;
  const updatedGeneratedForm = generatedForm
    ? sanitizeGeneratedForm(aiFormGenerationSchema.parse(generatedForm))
    : sanitizeGeneratedForm(aiFormGenerationSchema.parse(existingParams.generatedForm));

  if (!updatedGeneratedForm) {
    throw new Error("Missing generated form content");
  }

  const updatedParams = {
    ...existingParams,
    generatedForm: updatedGeneratedForm,
  };

  await db.transaction(async (tx) => {
    await tx
      .update(aiActions)
      .set({
        status: "approved",
        approvedBy: session.user.id,
        approvedAt: new Date(),
        params: updatedParams,
        preview: buildFormPreview(updatedGeneratedForm),
      })
      .where(eq(aiActions.id, aiActionId));

    await tx.insert(events).values({
      streamId: `ai-action-${aiActionId}`,
      eventType: "AIActionApproved",
      eventData: { aiActionId },
      version: 2,
      userId: session.user.id,
    });
  });

  return formService.executeAIFormGeneration(aiActionId, session.user.id);
}

/**
 * Publish a form (make it available to users)
 */
export async function publishFormAction(formId: string) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Check permission
  await enforcePermission(session.user.id, "form", "update");

  return formService.publishForm(formId, session.user.id);
}

/**
 * Archive a form
 */
export async function archiveFormAction(formId: string) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Check permission
  await enforcePermission(session.user.id, "form", "delete");

  return formService.archiveForm(formId, session.user.id);
}

/**
 * Update a form definition + fields (admin only)
 */
export async function updateFormAction(data: {
  formId: string;
  name: string;
  description?: string | null;
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
}) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  await enforcePermission(session.user.id, "form", "update");

  const parsed = z
    .object({
      formId: z.string().uuid(),
      name: z.string().min(1),
      description: z.string().nullable().optional(),
      formType: z.enum(["registration", "waiver", "medical", "custom"]),
      fields: z
        .array(
          z.object({
            id: z.string().uuid().optional(),
            fieldKey: z.string().min(1),
            label: z.string().min(1),
            description: z.string().nullable().optional(),
            fieldType: z.string().min(1),
            required: z.boolean(),
            displayOrder: z.number().int().min(1),
            options: z
              .array(
                z.object({
                  label: z.string().min(1),
                  value: z.string().min(1),
                  displayOrder: z.number().int().min(1),
                  triggersFields: z
                    .object({ fieldKeys: z.array(z.string()).optional() })
                    .optional(),
                  parentOptionId: z.string().uuid().nullable().optional(),
                })
              )
              .optional(),
          })
        )
        .min(1),
    })
    .parse(data);

  return formService.updateFormDefinition(parsed.formId, session.user.id, {
    name: parsed.name,
    description: parsed.description ?? null,
    formType: parsed.formType,
    fields: parsed.fields,
  });
}
