import { z } from "zod";

/**
 * Validation schemas for medication-related operations
 */

// Base medication schema for create operations
export const createMedicationSchema = z.object({
  childId: z.string().uuid("Invalid child ID"),
  name: z.string().min(1, "Medication name is required").max(200),
  dosage: z.string().min(1, "Dosage is required").max(100),
  frequency: z.string().min(1, "Frequency is required").max(200),
  instructions: z.string().max(1000).optional(),
  startDate: z.date(),
  endDate: z.date().optional().nullable(),
}).refine(
  (data) => {
    if (data.endDate) {
      return data.endDate >= data.startDate;
    }
    return true;
  },
  { message: "End date must be after or equal to start date", path: ["endDate"] }
);

// Update medication schema - all fields optional except medicationId
export const updateMedicationSchema = z.object({
  medicationId: z.string().uuid("Invalid medication ID"),
  name: z.string().min(1).max(200).optional(),
  dosage: z.string().min(1).max(100).optional(),
  frequency: z.string().min(1).max(200).optional(),
  instructions: z.string().max(1000).optional().nullable(),
  startDate: z.date().optional(),
  endDate: z.date().optional().nullable(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.endDate >= data.startDate;
    }
    return true;
  },
  { message: "End date must be after or equal to start date", path: ["endDate"] }
);

// Delete medication schema
export const deleteMedicationSchema = z.object({
  medicationId: z.string().uuid("Invalid medication ID"),
});

// Log medication administration schema
export const logMedicationAdminSchema = z.object({
  medicationId: z.string().uuid("Invalid medication ID"),
  childId: z.string().uuid("Invalid child ID"),
  administeredAt: z.date(),
  dosage: z.string().min(1, "Dosage is required").max(100),
  photoVerificationUrl: z.string().url().optional().nullable(),
  guardianNotified: z.boolean().default(false),
});

// Get medication schedule schema
export const getMedicationScheduleSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID").optional(),
  date: z.coerce.date().optional(),
  childId: z.string().uuid("Invalid child ID").optional(),
});

// Type exports
export type CreateMedicationInput = z.infer<typeof createMedicationSchema>;
export type UpdateMedicationInput = z.infer<typeof updateMedicationSchema>;
export type DeleteMedicationInput = z.infer<typeof deleteMedicationSchema>;
export type LogMedicationAdminInput = z.infer<typeof logMedicationAdminSchema>;
export type GetMedicationScheduleInput = z.infer<typeof getMedicationScheduleSchema>;
