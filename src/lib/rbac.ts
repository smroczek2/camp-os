import { db } from "@/lib/db";
import {
  user,
  children,
  registrations,
  documents,
  assignments,
  formDefinitions,
  formSubmissions,
} from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export type UserRole = "parent" | "staff" | "admin" | "nurse";

export const ROLE_PERMISSIONS: Record<UserRole, Record<string, string[]>> = {
  parent: {
    child: ["create", "read", "update"],
    registration: ["create", "read", "cancel"],
    medication: ["create", "read", "update", "delete"],
    medicalRecord: ["read", "update"],
    document: ["create", "read", "delete"],
    incident: ["read"],
    form: ["read", "submit"],
    formSubmission: ["read", "create"],
  },
  staff: {
    child: ["read"],
    registration: ["read"],
    medication: ["read", "update"],
    incident: ["create", "read", "update"],
    attendance: ["create", "update"],
    form: ["read"],
    formSubmission: ["read"],
  },
  nurse: {
    child: ["read"],
    registration: ["read"],
    medication: ["create", "read", "update", "delete"],
    medicalRecord: ["read", "update"],
    incident: ["create", "read", "update", "resolve"],
    form: ["read"],
    formSubmission: ["read", "update"],
  },
  admin: {
    child: ["create", "read", "update", "delete"],
    registration: ["create", "read", "update", "cancel"],
    medication: ["create", "read", "update", "delete"],
    medicalRecord: ["read", "update"],
    document: ["create", "read", "delete"],
    incident: ["create", "read", "update", "resolve"],
    session: ["create", "read", "update", "delete"],
    staff: ["read", "update"],
    form: ["create", "read", "update", "delete"],
    formSubmission: ["read", "update", "delete"],
    user: ["create", "read", "update", "delete"],
  },
};

// Custom error types
export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

// Permission check (core function)
export async function hasPermission(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  const userRecord = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (!userRecord) return false;

  const rolePermissions = ROLE_PERMISSIONS[userRecord.role as UserRole];
  if (!rolePermissions) return false;

  const resourcePermissions = rolePermissions[resource];
  if (!resourcePermissions) return false;

  return resourcePermissions.includes(action);
}

// Row-level ownership check
export async function ownsResource(
  userId: string,
  resourceType: "child" | "registration" | "document",
  resourceId: string
): Promise<boolean> {
  switch (resourceType) {
    case "child": {
      const child = await db.query.children.findFirst({
        where: and(eq(children.id, resourceId), eq(children.userId, userId)),
      });
      return !!child;
    }

    case "registration": {
      const registration = await db.query.registrations.findFirst({
        where: and(
          eq(registrations.id, resourceId),
          eq(registrations.userId, userId)
        ),
      });
      return !!registration;
    }

    case "document": {
      const document = await db.query.documents.findFirst({
        where: and(eq(documents.id, resourceId), eq(documents.userId, userId)),
      });
      return !!document;
    }

    default:
      return false;
  }
}

// Staff assignment check
export async function isAssignedToChild(
  staffId: string,
  childId: string
): Promise<boolean> {
  // Get child's registration to find session
  const registration = await db.query.registrations.findFirst({
    where: eq(registrations.childId, childId),
  });

  if (!registration) return false;

  // Check if staff is assigned to any group in this session
  const assignment = await db.query.assignments.findFirst({
    where: and(
      eq(assignments.staffId, staffId),
      eq(assignments.sessionId, registration.sessionId)
    ),
  });

  return !!assignment;
}

// Combined enforcement (use in Server Actions)
export async function enforcePermission(
  userId: string,
  resource: string,
  action: string,
  resourceId?: string
): Promise<void> {
  const userRecord = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (!userRecord) {
    throw new UnauthorizedError("User not found");
  }

  // Check role-based permission
  if (!(await hasPermission(userId, resource, action))) {
    throw new ForbiddenError(
      `${userRecord.role} cannot ${action} ${resource}`
    );
  }

  // For non-admins, check row-level ownership
  if (userRecord.role !== "admin" && resourceId) {
    if (userRecord.role === "parent") {
      const owns = await ownsResource(
        userId,
        resource as "child" | "registration" | "document",
        resourceId
      );
      if (!owns) {
        throw new ForbiddenError("Access denied to this resource");
      }
    } else if (userRecord.role === "staff") {
      const assigned = await isAssignedToChild(userId, resourceId);
      if (!assigned) {
        throw new ForbiddenError("Not assigned to this child");
      }
    }
  }
}

// Helper function to get user role
export async function getUserRole(userId: string): Promise<UserRole | null> {
  const userRecord = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  return userRecord ? (userRecord.role as UserRole) : null;
}

// Check if user is admin
export async function isAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === "admin";
}

// Check if user is staff or admin
export async function isStaffOrAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === "staff" || role === "admin" || role === "nurse";
}

// Check if user can access a form
export async function canAccessForm(
  userId: string,
  formId: string
): Promise<boolean> {
  const userRole = await getUserRole(userId);
  if (userRole === "admin") return true;

  const form = await db.query.formDefinitions.findFirst({
    where: eq(formDefinitions.id, formId),
  });

  if (!form) return false;

  if (userRole === "parent") {
    // Parents can access forms for sessions they're registered in
    if (!form.sessionId) return false;

    const hasRegistration = await db.query.registrations.findFirst({
      where: and(
        eq(registrations.userId, userId),
        eq(registrations.sessionId, form.sessionId)
      ),
    });
    return !!hasRegistration;
  }

  if (userRole === "staff" || userRole === "nurse") {
    // Staff can access forms for sessions they're assigned to
    if (!form.sessionId) return false;

    const hasAssignment = await db.query.assignments.findFirst({
      where: and(
        eq(assignments.staffId, userId),
        eq(assignments.sessionId, form.sessionId)
      ),
    });
    return !!hasAssignment;
  }

  return false;
}

// Check if user owns a form submission
export async function ownsFormSubmission(
  userId: string,
  submissionId: string
): Promise<boolean> {
  const submission = await db.query.formSubmissions.findFirst({
    where: and(
      eq(formSubmissions.id, submissionId),
      eq(formSubmissions.userId, userId)
    ),
  });
  return !!submission;
}
