"use client";

import { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import type { CreateSessionInput } from "@/lib/validations/session";

interface AdditionalDetailsSectionProps {
  control: Control<CreateSessionInput>;
}

export function AdditionalDetailsSection({ control }: AdditionalDetailsSectionProps) {
  return (
    <div className="space-y-4">
      <FormDescription>
        Add special instructions and what to bring for this session
      </FormDescription>

      <FormField
        control={control}
        name="specialInstructions"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Special Instructions</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value ?? ""}
                placeholder="Any special instructions for parents and campers..."
                rows={4}
              />
            </FormControl>
            <FormDescription>
              Drop-off times, parking info, medical requirements, etc.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="whatToBring"
        render={({ field }) => (
          <FormItem>
            <FormLabel>What to Bring</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value ?? ""}
                placeholder="List items campers should bring..."
                rows={4}
              />
            </FormControl>
            <FormDescription>
              Lunch, water bottle, sunscreen, change of clothes, etc.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
