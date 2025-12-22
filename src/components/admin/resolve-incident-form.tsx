"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2 } from "lucide-react";
import { resolveIncidentAction } from "@/app/actions/admin-actions";

interface ResolveIncidentFormProps {
  incidentId: string;
}

export function ResolveIncidentForm({ incidentId }: ResolveIncidentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    formData.set("incidentId", incidentId);

    const result = await resolveIncidentAction(formData);

    setLoading(false);

    if (result.success) {
      router.refresh();
    } else {
      setError(result.error || "Failed to resolve incident");
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="resolution">Resolution Notes</Label>
        <Textarea
          id="resolution"
          name="resolution"
          placeholder="Describe how the incident was resolved..."
          rows={4}
          required
        />
        <p className="text-xs text-muted-foreground">
          Include any follow-up actions taken, parent notifications, or
          recommendations
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Resolving...
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Mark as Resolved
          </>
        )}
      </Button>
    </form>
  );
}
