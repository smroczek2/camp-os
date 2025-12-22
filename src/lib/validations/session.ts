import { z } from "zod";

/**
 * Validation schemas for session-related operations
 */

// Grade validation helper - -1=PreK, 0=K, 1-12=grades
const gradeSchema = z.number().int().min(-1).max(12);

// Base session schema for create/update operations
export const createSessionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  price: z.coerce.number().min(0, "Price must be positive"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  status: z.enum(["draft", "open", "closed", "completed"]).default("draft"),

  // Optional fields
  description: z.string().optional(),

  // Eligibility
  minAge: z.coerce.number().int().min(0).max(100).optional(),
  maxAge: z.coerce.number().int().min(0).max(100).optional(),
  minGrade: gradeSchema.optional(),
  maxGrade: gradeSchema.optional(),

  // Registration window
  registrationOpenDate: z.coerce.date().optional(),
  registrationCloseDate: z.coerce.date().optional(),

  // Additional details
  specialInstructions: z.string().optional(),
  whatToBring: z.string().optional(),

  // Form attachment
  formIds: z.array(z.object({
    formId: z.string().uuid(),
    required: z.boolean().default(true),
    displayOrder: z.number().int().min(0).default(0),
  })).optional(),
}).refine(
  (data) => data.endDate > data.startDate,
  { message: "End date must be after start date", path: ["endDate"] }
).refine(
  (data) => {
    if (data.minAge !== undefined && data.maxAge !== undefined) {
      return data.maxAge >= data.minAge;
    }
    return true;
  },
  { message: "Max age must be greater than or equal to min age", path: ["maxAge"] }
).refine(
  (data) => {
    if (data.minGrade !== undefined && data.maxGrade !== undefined) {
      return data.maxGrade >= data.minGrade;
    }
    return true;
  },
  { message: "Max grade must be greater than or equal to min grade", path: ["maxGrade"] }
).refine(
  (data) => {
    if (data.registrationOpenDate && data.registrationCloseDate) {
      return data.registrationCloseDate > data.registrationOpenDate;
    }
    return true;
  },
  { message: "Registration close date must be after open date", path: ["registrationCloseDate"] }
);

export const updateSessionSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID"),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  price: z.coerce.number().min(0, "Price must be positive").optional(),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1").optional(),
  status: z.enum(["draft", "open", "closed", "completed"]).optional(),

  // Optional fields
  name: z.string().min(1).optional().nullable(),
  description: z.string().optional().nullable(),

  // Eligibility
  minAge: z.coerce.number().int().min(0).max(100).optional().nullable(),
  maxAge: z.coerce.number().int().min(0).max(100).optional().nullable(),
  minGrade: gradeSchema.optional().nullable(),
  maxGrade: gradeSchema.optional().nullable(),

  // Registration window
  registrationOpenDate: z.coerce.date().optional().nullable(),
  registrationCloseDate: z.coerce.date().optional().nullable(),

  // Additional details
  specialInstructions: z.string().optional().nullable(),
  whatToBring: z.string().optional().nullable(),
});

export const attachFormsSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID"),
  forms: z.array(z.object({
    formId: z.string().uuid("Invalid form ID"),
    required: z.boolean().default(true),
    displayOrder: z.number().int().min(0).default(0),
  })),
});

export const updateEligibilitySchema = z.object({
  sessionId: z.string().uuid("Invalid session ID"),
  minAge: z.coerce.number().int().min(0).max(100).optional().nullable(),
  maxAge: z.coerce.number().int().min(0).max(100).optional().nullable(),
  minGrade: gradeSchema.optional().nullable(),
  maxGrade: gradeSchema.optional().nullable(),
}).refine(
  (data) => {
    if (data.minAge !== undefined && data.minAge !== null &&
        data.maxAge !== undefined && data.maxAge !== null) {
      return data.maxAge >= data.minAge;
    }
    return true;
  },
  { message: "Max age must be greater than or equal to min age", path: ["maxAge"] }
).refine(
  (data) => {
    if (data.minGrade !== undefined && data.minGrade !== null &&
        data.maxGrade !== undefined && data.maxGrade !== null) {
      return data.maxGrade >= data.minGrade;
    }
    return true;
  },
  { message: "Max grade must be greater than or equal to min grade", path: ["maxGrade"] }
);

export const duplicateSessionSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  name: z.string().min(1).optional(),
}).refine(
  (data) => data.endDate > data.startDate,
  { message: "End date must be after start date", path: ["endDate"] }
);

export const createSessionBatchSchema = z.object({
  templateSessionId: z.string().uuid("Invalid template session ID").optional(),
  sessions: z.array(z.object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    name: z.string().min(1, "Name is required"),
    price: z.coerce.number().min(0).optional(),
    capacity: z.coerce.number().min(1).optional(),
  })).min(1, "At least one session required"),
  // Copy eligibility and details from template
  copyEligibility: z.boolean().default(true),
  copyForms: z.boolean().default(true),
});

// Type exports
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
export type AttachFormsInput = z.infer<typeof attachFormsSchema>;
export type UpdateEligibilityInput = z.infer<typeof updateEligibilitySchema>;
export type DuplicateSessionInput = z.infer<typeof duplicateSessionSchema>;
export type CreateSessionBatchInput = z.infer<typeof createSessionBatchSchema>;
