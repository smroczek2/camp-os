"use client";

import { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CreateSessionInput } from "@/lib/validations/session";

interface DatesPricingSectionProps {
  control: Control<CreateSessionInput>;
}

export function DatesPricingSection({ control }: DatesPricingSectionProps) {
  return (
    <div className="space-y-4">
      {/* Name (required) */}
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Session Name</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ""} placeholder="e.g., Summer Week 1, Art Camp June" />
            </FormControl>
            <FormDescription>
              A descriptive name for this session
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Description */}
      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description (optional)</FormLabel>
            <FormControl>
              <Textarea {...field} value={field.value ?? ""} placeholder="Session description..." rows={3} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : ""}
                  onChange={(e) => field.onChange(new Date(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="endDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Date</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : ""}
                  onChange={(e) => field.onChange(new Date(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Price and Capacity */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price ($)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="299.00"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacity</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder="25"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Registration Window (optional) */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Registration Window (optional)</h4>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="registrationOpenDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Opens</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : ""}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="registrationCloseDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Closes</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : ""}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
