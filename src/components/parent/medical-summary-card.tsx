"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Pill,
  Printer,
  Clock,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

type Medication = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  instructions: string | null;
  startDate: Date;
  endDate: Date | null;
};

type Allergy = {
  name: string;
  severity?: "mild" | "moderate" | "severe";
};

interface MedicalSummaryCardProps {
  childName: string;
  allergies?: string[] | Allergy[];
  medications?: Medication[];
  medicalNotes?: string | null;
}

export function MedicalSummaryCard({
  childName,
  allergies = [],
  medications = [],
  medicalNotes,
}: MedicalSummaryCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Normalize allergies to objects with severity
  const normalizedAllergies: Allergy[] = allergies.map((a) =>
    typeof a === "string" ? { name: a, severity: undefined } : a
  );

  // Filter active medications
  const now = new Date();
  const activeMedications = medications.filter(
    (med) => !med.endDate || new Date(med.endDate) > now
  );

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "severe":
        return "bg-red-500 border-red-600";
      case "moderate":
        return "bg-orange-500 border-orange-600";
      case "mild":
        return "bg-yellow-500 border-yellow-600";
      default:
        return "bg-gray-500 border-gray-600";
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Medical Form - ${childName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            h1 {
              color: #1a1a1a;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            h2 {
              color: #333;
              margin-top: 30px;
              margin-bottom: 15px;
            }
            .section {
              margin-bottom: 30px;
            }
            .allergy-item {
              display: inline-block;
              padding: 5px 12px;
              margin: 5px;
              border: 1px solid #ddd;
              border-radius: 4px;
              background-color: #f9f9f9;
            }
            .allergy-severe {
              background-color: #fee;
              border-color: #fcc;
              font-weight: bold;
            }
            .allergy-moderate {
              background-color: #fff4e5;
              border-color: #ffd7a3;
            }
            .medication-item {
              padding: 15px;
              margin: 10px 0;
              border: 1px solid #ddd;
              border-radius: 4px;
              background-color: #f9f9f9;
            }
            .medication-name {
              font-weight: bold;
              font-size: 16px;
              margin-bottom: 5px;
            }
            .medication-details {
              color: #666;
              font-size: 14px;
              margin: 5px 0;
            }
            .notes-box {
              padding: 15px;
              border: 1px solid #ddd;
              border-radius: 4px;
              background-color: #f9f9f9;
              white-space: pre-wrap;
            }
            .print-date {
              text-align: right;
              color: #666;
              font-size: 12px;
              margin-top: 40px;
            }
            @media print {
              body {
                padding: 20px;
              }
            }
          </style>
        </head>
        <body>
          <h1>Medical Information: ${childName}</h1>

          <div class="section">
            <h2>Allergies</h2>
            ${
              normalizedAllergies.length > 0
                ? normalizedAllergies
                    .map(
                      (allergy) => `
              <span class="allergy-item ${
                allergy.severity === "severe"
                  ? "allergy-severe"
                  : allergy.severity === "moderate"
                    ? "allergy-moderate"
                    : ""
              }">
                ${allergy.name}${
                  allergy.severity ? ` (${allergy.severity})` : ""
                }
              </span>
            `
                    )
                    .join("")
                : "<p>No known allergies</p>"
            }
          </div>

          <div class="section">
            <h2>Active Medications</h2>
            ${
              activeMedications.length > 0
                ? activeMedications
                    .map(
                      (med) => `
              <div class="medication-item">
                <div class="medication-name">${med.name}</div>
                <div class="medication-details">Dosage: ${med.dosage}</div>
                <div class="medication-details">Frequency: ${med.frequency}</div>
                ${
                  med.instructions
                    ? `<div class="medication-details">Instructions: ${med.instructions}</div>`
                    : ""
                }
                <div class="medication-details">
                  Start: ${formatDate(med.startDate)}
                  ${med.endDate ? ` | End: ${formatDate(med.endDate)}` : " | Ongoing"}
                </div>
              </div>
            `
                    )
                    .join("")
                : "<p>No active medications</p>"
            }
          </div>

          ${
            medicalNotes
              ? `
          <div class="section">
            <h2>Medical Notes</h2>
            <div class="notes-box">${medicalNotes}</div>
          </div>
          `
              : ""
          }

          <div class="print-date">
            Printed on ${new Date().toLocaleString()}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border-t pt-4 mt-4">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent"
          >
            <span className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              Medical Summary
            </span>
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4 space-y-4">
          {/* Allergies with Severity */}
          {normalizedAllergies.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                Allergies
              </p>
              <div className="flex flex-wrap gap-2">
                {normalizedAllergies.map((allergy, idx) => (
                  <Badge
                    key={idx}
                    className={`${allergy.severity ? getSeverityColor(allergy.severity) : "bg-gray-500"} text-white`}
                  >
                    {allergy.name}
                    {allergy.severity && (
                      <span className="ml-1 text-xs opacity-90">
                        ({allergy.severity})
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Active Medications with Schedules */}
          {activeMedications.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                Active Medications
              </p>
              <div className="space-y-2">
                {activeMedications.map((med) => (
                  <div
                    key={med.id}
                    className="text-xs p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-semibold text-sm">{med.name}</p>
                      <Badge variant="outline" className="text-xs">
                        <Pill className="h-3 w-3 mr-1" />
                        {med.dosage}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground flex items-center gap-1 mb-1">
                      <Clock className="h-3 w-3" />
                      {med.frequency}
                    </p>
                    {med.instructions && (
                      <p className="text-muted-foreground italic mt-2 text-xs">
                        {med.instructions}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-blue-200 dark:border-blue-900">
                      {formatDate(med.startDate)} -{" "}
                      {med.endDate ? formatDate(med.endDate) : "Ongoing"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Medical Notes */}
          {medicalNotes && (
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                Medical Notes
              </p>
              <div className="text-xs p-3 bg-muted/50 rounded-lg">
                <p className="whitespace-pre-wrap">{medicalNotes}</p>
              </div>
            </div>
          )}

          {/* Print Button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Medical Form
          </Button>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
