"use server";

import { getSession } from "@/lib/auth-helper";
import { enforcePermission, canAccessForm } from "@/lib/rbac";
import { formService } from "@/services/form-service";
import { createFormGenerationAction } from "@/lib/ai-tools/form-builder-tool";
import { ForbiddenError } from "@/lib/rbac";

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
export async function approveAIFormAction(aiActionId: string) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Check permission
  await enforcePermission(session.user.id, "form", "create");

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
