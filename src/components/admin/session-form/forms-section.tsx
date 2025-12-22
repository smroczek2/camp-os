"use client";

import { Control, UseFormSetValue } from "react-hook-form";
import { FormDescription } from "@/components/ui/form";
import type { CreateSessionInput } from "@/lib/validations/session";

interface FormsSectionProps {
  control: Control<CreateSessionInput>;
  setValue: UseFormSetValue<CreateSessionInput>;
}

export function FormsSection({ }: FormsSectionProps) {
  return (
    <div className="space-y-4">
      <FormDescription>
        Attach required forms to this session. Form management coming soon.
      </FormDescription>
      <p className="text-sm text-muted-foreground">
        This feature will allow you to attach health forms, waivers, and other documents to this session.
      </p>
    </div>
  );
}
