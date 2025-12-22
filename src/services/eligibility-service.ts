// src/services/eligibility-service.ts

/**
 * Eligibility Service
 *
 * Handles eligibility checks for camp sessions based on age and grade restrictions.
 * Used to determine if a child can register for a particular session.
 */

interface EligibilityCheck {
  eligible: boolean;
  reason?: string;
}

/**
 * Check if a child is eligible for a camp session based on age and grade restrictions
 *
 * @param child - Child information including birthDate and optional grade
 * @param session - Session information including startDate and optional age/grade restrictions
 * @returns EligibilityCheck object with eligible boolean and optional reason string
 */
export function checkEligibility(
  child: { birthDate: Date; grade?: number },
  session: { startDate: Date; minAge?: number | null; maxAge?: number | null; minGrade?: number | null; maxGrade?: number | null }
): EligibilityCheck {
  // Calculate age at session start
  const age = calculateAge(child.birthDate, session.startDate);

  // Check age restrictions
  if (session.minAge != null && age < session.minAge) {
    return { eligible: false, reason: `Too young (min age ${session.minAge})` };
  }
  if (session.maxAge != null && age > session.maxAge) {
    return { eligible: false, reason: `Too old (max age ${session.maxAge})` };
  }

  // Check grade restrictions (if child has grade and session has grade restrictions)
  if (child.grade != null) {
    if (session.minGrade != null && child.grade < session.minGrade) {
      return { eligible: false, reason: `Grade too low (min ${getGradeLabel(session.minGrade)})` };
    }
    if (session.maxGrade != null && child.grade > session.maxGrade) {
      return { eligible: false, reason: `Grade too high (max ${getGradeLabel(session.maxGrade)})` };
    }
  }

  return { eligible: true };
}

/**
 * Calculate a person's age at a specific date
 *
 * @param birthDate - The person's birth date
 * @param asOfDate - The date to calculate age as of
 * @returns Age in years
 */
function calculateAge(birthDate: Date, asOfDate: Date): number {
  const age = asOfDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = asOfDate.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && asOfDate.getDate() < birthDate.getDate())) {
    return age - 1;
  }
  return age;
}

/**
 * Convert a grade number to a human-readable label
 *
 * @param grade - Grade number (-1 for Pre-K, 0 for Kindergarten, 1+ for grades)
 * @returns Human-readable grade label
 */
export function getGradeLabel(grade: number): string {
  if (grade === -1) return "Pre-K";
  if (grade === 0) return "Kindergarten";
  return `Grade ${grade}`;
}

/**
 * Generate a human-readable summary of session eligibility requirements
 *
 * @param session - Session information with optional age/grade restrictions
 * @returns Summary string (e.g., "Ages 5-12, Grade 1 - Grade 6")
 */
export function getEligibilitySummary(session: { minAge?: number | null; maxAge?: number | null; minGrade?: number | null; maxGrade?: number | null }): string {
  const parts: string[] = [];

  // Add age range summary
  if (session.minAge != null || session.maxAge != null) {
    if (session.minAge != null && session.maxAge != null) {
      parts.push(`Ages ${session.minAge}-${session.maxAge}`);
    } else if (session.minAge != null) {
      parts.push(`Ages ${session.minAge}+`);
    } else if (session.maxAge != null) {
      parts.push(`Ages up to ${session.maxAge}`);
    }
  }

  // Add grade range summary
  if (session.minGrade != null || session.maxGrade != null) {
    if (session.minGrade != null && session.maxGrade != null) {
      parts.push(`${getGradeLabel(session.minGrade)} - ${getGradeLabel(session.maxGrade)}`);
    } else if (session.minGrade != null) {
      parts.push(`${getGradeLabel(session.minGrade)}+`);
    } else if (session.maxGrade != null) {
      parts.push(`Up to ${getGradeLabel(session.maxGrade)}`);
    }
  }

  return parts.join(", ") || "All ages welcome";
}
