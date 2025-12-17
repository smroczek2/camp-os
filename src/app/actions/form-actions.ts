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
import { aiActions, events, children, registrations } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limit";
import type {
  GeneratedFormResult,
  AIFormGeneration,
} from "@/types/forms";

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

  if (!session.user.activeOrganizationId) {
    throw new Error("No active organization. Please select an organization.");
  }

  // Check permission
  await enforcePermission(session.user.id, "formSubmission", "create");

  // Check form access
  const canAccess = await canAccessForm(
    session.user.id,
    data.formDefinitionId
  );
  if (!canAccess) {
    throw new ForbiddenError("Cannot access this form");
  }

  // VALIDATE CHILD OWNERSHIP
  if (data.childId) {
    const child = await db.query.children.findFirst({
      where: and(
        eq(children.id, data.childId),
        eq(children.userId, session.user.id)
      ),
      columns: { id: true }, // Only need ID for validation
    });

    if (!child) {
      throw new ForbiddenError("Invalid child ID");
    }
  }

  // VALIDATE REGISTRATION OWNERSHIP
  if (data.registrationId) {
    const registration = await db.query.registrations.findFirst({
      where: and(
        eq(registrations.id, data.registrationId),
        eq(registrations.userId, session.user.id)
      ),
      columns: { id: true }, // Only need ID for validation
    });

    if (!registration) {
      throw new ForbiddenError("Invalid registration ID");
    }
  }

  return formService.submitForm(
    {
      ...data,
      userId: session.user.id,
    },
    session.user.activeOrganizationId
  );
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
}): Promise<GeneratedFormResult> {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Rate limiting for AI form generation
  const rateLimitResult = await checkRateLimit(
    "formGeneration",
    session.user.id
  );

  if (!rateLimitResult.success) {
    const resetDate = new Date(rateLimitResult.reset);
    throw new Error(
      `Rate limit exceeded. You can generate ${rateLimitResult.limit} forms per day. Please try again after ${resetDate.toLocaleString()}.`
    );
  }

  if (!session.user.activeOrganizationId) {
    throw new Error("No active organization. Please select an organization.");
  }

  // Permission check happens inside createFormGenerationAction
  const result = await createFormGenerationAction(
    session.user.id,
    session.user.activeOrganizationId,
    data.prompt,
    data.campId,
    data.sessionId
  );

  // Return properly typed result
  return {
    id: result.id,
    action: result.action,
    params: result.params as {
      prompt: string;
      campId: string;
      sessionId?: string;
      generatedForm: AIFormGeneration;
    },
    preview: result.preview as {
      formName: string;
      formType: "registration" | "waiver" | "medical" | "custom";
      fieldCount: number;
      sections?: string[];
      fields: Array<{
        label: string;
        type: string;
        required: boolean;
        conditional: boolean;
        hasOptions: boolean;
      }>;
    },
    status: result.status,
    createdAt: result.createdAt,
    userId: result.userId,
  };
}

/**
 * Approve AI-generated form (admin only)
 */
export async function approveAIFormAction(data: {
  aiActionId: string;
  generatedForm?: AIFormGeneration;
}): Promise<{ success: boolean; formId: string }> {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Rate limiting for AI form approval
  const rateLimitResult = await checkRateLimit(
    "formApproval",
    session.user.id
  );

  if (!rateLimitResult.success) {
    const resetDate = new Date(rateLimitResult.reset);
    throw new Error(
      `Rate limit exceeded. You can approve ${rateLimitResult.limit} forms per day. Please try again after ${resetDate.toLocaleString()}.`
    );
  }

  // Check permission
  await enforcePermission(session.user.id, "form", "create");

  // Validate input with proper typing
  const validated = z
    .object({
      aiActionId: z.string().uuid(),
      generatedForm: aiFormGenerationSchema.optional(),
    })
    .parse(data);

  const aiAction = await db.query.aiActions.findFirst({
    where: eq(aiActions.id, validated.aiActionId),
  });

  if (!aiAction) {
    throw new Error("AI action not found");
  }

  if (aiAction.status !== "pending") {
    throw new Error(`AI action is ${aiAction.status} and cannot be approved`);
  }

  // Parse existing params with proper typing
  const existingParams = aiAction.params as {
    prompt: string;
    campId: string;
    sessionId?: string;
    generatedForm: unknown;
  };

  // Determine which form to use and sanitize it
  const updatedGeneratedForm = validated.generatedForm
    ? sanitizeGeneratedForm(validated.generatedForm)
    : sanitizeGeneratedForm(aiFormGenerationSchema.parse(existingParams.generatedForm));

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
      .where(eq(aiActions.id, validated.aiActionId));

    await tx.insert(events).values({
      streamId: `ai-action-${validated.aiActionId}`,
      eventType: "AIActionApproved",
      eventData: { aiActionId: validated.aiActionId },
      version: 2,
      userId: session.user.id,
    });
  });

  const result = await formService.executeAIFormGeneration(validated.aiActionId, session.user.id);

  return {
    success: true,
    formId: result.id,
  };
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
