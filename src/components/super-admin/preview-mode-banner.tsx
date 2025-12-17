"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Eye, X } from "lucide-react";
import { endPreviewModeAction } from "@/app/actions/super-admin-actions";

/**
 * Preview Mode Banner
 *
 * Shows when a super admin is previewing an organization's data.
 * Provides visual indicator and exit button.
 *
 * Bug #2 fix: The actual read-only enforcement happens in middleware.
 * This banner is just the UI indicator.
 */
export function PreviewModeBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const previewOrgId = searchParams.get("preview_org");
  const previewOrgName = searchParams.get("preview_org_name");

  if (!previewOrgId) {
    return null;
  }

  const handleEndPreview = async () => {
    await endPreviewModeAction();
    router.push("/super-admin/organizations");
  };

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <span className="text-sm font-medium">
            Preview Mode: Viewing{" "}
            <strong>{previewOrgName || "Organization"}</strong> (Read-Only)
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleEndPreview}
          className="h-7 text-amber-950 hover:bg-amber-600 hover:text-amber-950"
        >
          <X className="h-4 w-4 mr-1" />
          Exit Preview
        </Button>
      </div>
    </div>
  );
}
