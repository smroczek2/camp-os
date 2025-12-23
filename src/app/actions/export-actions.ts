"use server";

import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { formSubmissions } from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";

/**
 * Export submissions to CSV
 */
export async function exportSubmissionsToCSV(data: {
  formDefinitionId?: string;
  submissionIds?: string[];
}) {
  const session = await getSession();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  // Build query
  let query;
  if (data.submissionIds && data.submissionIds.length > 0) {
    // Export specific submissions
    query = db.query.formSubmissions.findMany({
      where: inArray(formSubmissions.id, data.submissionIds),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        child: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
          },
        },
        session: {
          columns: {
            id: true,
            name: true,
            startDate: true,
          },
        },
      },
    });
  } else if (data.formDefinitionId) {
    // Export all submissions for a form
    query = db.query.formSubmissions.findMany({
      where: eq(formSubmissions.formDefinitionId, data.formDefinitionId),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        child: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
          },
        },
        session: {
          columns: {
            id: true,
            name: true,
            startDate: true,
          },
        },
      },
    });
  } else {
    throw new Error("Must provide either formDefinitionId or submissionIds");
  }

  const submissions = await query;

  if (submissions.length === 0) {
    return { success: false, error: "No submissions found to export" };
  }

  // Build CSV
  const csvRows = [];

  // Header
  csvRows.push(
    [
      "Submission ID",
      "Status",
      "Parent Name",
      "Parent Email",
      "Child Name",
      "Child Age",
      "Session",
      "Submitted Date",
      "Reviewed At",
      "Review Notes",
    ].join(",")
  );

  // Data rows
  submissions.forEach((submission) => {
    const childAge = submission.child
      ? Math.floor(
          (Date.now() - new Date(submission.child.dateOfBirth).getTime()) /
            31557600000
        )
      : "";

    csvRows.push(
      [
        submission.id,
        submission.status,
        `"${submission.user?.name || "Unknown"}"`,
        `"${submission.user?.email || ""}"`,
        submission.child
          ? `"${submission.child.firstName} ${submission.child.lastName}"`
          : "",
        childAge,
        submission.session ? `"${submission.session.name}"` : "",
        new Date(submission.createdAt).toISOString().split("T")[0],
        "",  // reviewedAt is not available in the type
        "",  // reviewNotes is not available in the type
      ].join(",")
    );
  });

  const csv = csvRows.join("\n");

  return {
    success: true,
    csv,
    filename: `submissions-${data.formDefinitionId || "export"}-${new Date().toISOString().split("T")[0]}.csv`,
  };
}
