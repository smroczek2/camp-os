/**
 * Common medication templates for quick form filling
 */

export interface MedicationTemplate {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  category: "pain-relief" | "allergy" | "asthma" | "emergency" | "other";
}

export const MEDICATION_TEMPLATES: MedicationTemplate[] = [
  // Pain Relief
  {
    id: "tylenol-children",
    name: "Children's Tylenol (Acetaminophen)",
    dosage: "160mg",
    frequency: "Every 4-6 hours as needed",
    instructions: "Give with food or water. Do not exceed 5 doses in 24 hours.",
    category: "pain-relief",
  },
  {
    id: "ibuprofen-children",
    name: "Children's Ibuprofen (Advil/Motrin)",
    dosage: "100mg",
    frequency: "Every 6-8 hours as needed",
    instructions: "Give with food. Do not exceed 4 doses in 24 hours.",
    category: "pain-relief",
  },
  {
    id: "tylenol-adult",
    name: "Tylenol (Acetaminophen)",
    dosage: "500mg",
    frequency: "Every 4-6 hours as needed",
    instructions: "Do not exceed 4000mg in 24 hours. Take with food or water.",
    category: "pain-relief",
  },
  {
    id: "ibuprofen-adult",
    name: "Ibuprofen (Advil/Motrin)",
    dosage: "200mg",
    frequency: "Every 6-8 hours as needed",
    instructions: "Take with food. Do not exceed 1200mg in 24 hours.",
    category: "pain-relief",
  },

  // Allergy Medications
  {
    id: "benadryl-children",
    name: "Children's Benadryl (Diphenhydramine)",
    dosage: "12.5mg",
    frequency: "Every 6 hours as needed",
    instructions: "May cause drowsiness. Give with water.",
    category: "allergy",
  },
  {
    id: "benadryl-adult",
    name: "Benadryl (Diphenhydramine)",
    dosage: "25mg",
    frequency: "Every 6 hours as needed",
    instructions: "May cause drowsiness. Do not exceed 300mg in 24 hours.",
    category: "allergy",
  },
  {
    id: "zyrtec",
    name: "Zyrtec (Cetirizine)",
    dosage: "10mg",
    frequency: "Once daily",
    instructions: "Non-drowsy formula. Take at the same time each day.",
    category: "allergy",
  },
  {
    id: "claritin",
    name: "Claritin (Loratadine)",
    dosage: "10mg",
    frequency: "Once daily",
    instructions: "Non-drowsy formula. Take at the same time each day.",
    category: "allergy",
  },

  // Asthma/Respiratory
  {
    id: "albuterol-inhaler",
    name: "Albuterol Inhaler (ProAir/Ventolin)",
    dosage: "2 puffs",
    frequency: "Every 4-6 hours as needed",
    instructions: "Use spacer if provided. Wait 1 minute between puffs. For asthma or breathing difficulty.",
    category: "asthma",
  },
  {
    id: "albuterol-nebulizer",
    name: "Albuterol Nebulizer Solution",
    dosage: "2.5mg/3mL",
    frequency: "Every 4-6 hours as needed",
    instructions: "Administer via nebulizer. Treatment takes 10-15 minutes.",
    category: "asthma",
  },

  // Emergency Medications
  {
    id: "epipen-jr",
    name: "EpiPen Jr (Epinephrine Auto-Injector)",
    dosage: "0.15mg",
    frequency: "As needed for severe allergic reaction",
    instructions: "EMERGENCY USE ONLY. Inject into outer thigh. Call 911 immediately. May repeat after 5-15 minutes if needed.",
    category: "emergency",
  },
  {
    id: "epipen",
    name: "EpiPen (Epinephrine Auto-Injector)",
    dosage: "0.3mg",
    frequency: "As needed for severe allergic reaction",
    instructions: "EMERGENCY USE ONLY. Inject into outer thigh. Call 911 immediately. May repeat after 5-15 minutes if needed.",
    category: "emergency",
  },
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: MedicationTemplate["category"]) {
  return MEDICATION_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string) {
  return MEDICATION_TEMPLATES.find((t) => t.id === id);
}

/**
 * Search templates by name
 */
export function searchTemplates(query: string) {
  const lowerQuery = query.toLowerCase();
  return MEDICATION_TEMPLATES.filter((t) =>
    t.name.toLowerCase().includes(lowerQuery)
  );
}
