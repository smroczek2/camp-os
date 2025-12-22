import { z } from "zod";

/**
 * Waitlist validation schemas
 *
 * Defines validation rules for waitlist operations
 */

/**
 * Schema for joining a waitlist
 */
export const joinWaitlistSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID"),
  childId: z.string().uuid("Invalid child ID"),
});

export type JoinWaitlistInput = z.infer<typeof joinWaitlistSchema>;

/**
 * Schema for leaving a waitlist
 */
export const leaveWaitlistSchema = z.object({
  waitlistId: z.string().uuid("Invalid waitlist ID"),
});

export type LeaveWaitlistInput = z.infer<typeof leaveWaitlistSchema>;

/**
 * Schema for getting waitlist position
 */
export const getWaitlistPositionSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID"),
  childId: z.string().uuid("Invalid child ID"),
});

export type GetWaitlistPositionInput = z.infer<typeof getWaitlistPositionSchema>;

/**
 * Schema for promoting from waitlist (admin only)
 */
export const promoteFromWaitlistSchema = z.object({
  waitlistId: z.string().uuid("Invalid waitlist ID"),
  expirationHours: z.number().min(1).max(168).optional().default(48), // Default 48 hours, max 1 week
});

export type PromoteFromWaitlistInput = z.infer<typeof promoteFromWaitlistSchema>;
