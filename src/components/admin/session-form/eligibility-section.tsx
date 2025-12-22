"use client";

import { Control } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CreateSessionInput } from "@/lib/validations/session";

interface EligibilitySectionProps {
  control: Control<CreateSessionInput>;
}

const gradeOptions = [
  { value: "-1", label: "Pre-K" },
  { value: "0", label: "Kindergarten" },
  { value: "1", label: "1st Grade" },
  { value: "2", label: "2nd Grade" },
  { value: "3", label: "3rd Grade" },
  { value: "4", label: "4th Grade" },
  { value: "5", label: "5th Grade" },
  { value: "6", label: "6th Grade" },
  { value: "7", label: "7th Grade" },
  { value: "8", label: "8th Grade" },
  { value: "9", label: "9th Grade" },
  { value: "10", label: "10th Grade" },
  { value: "11", label: "11th Grade" },
  { value: "12", label: "12th Grade" },
];

export function EligibilitySection({ control }: EligibilitySectionProps) {
  return (
    <div className="space-y-4">
      <FormDescription>
        Set age and grade restrictions for this session
      </FormDescription>

      {/* Age Range */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Age Range</h4>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="minAge"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Age</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="5"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="maxAge"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Age</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="12"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Grade Range */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Grade Range</h4>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="minGrade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Grade</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value, 10))}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select min grade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {gradeOptions.map((grade) => (
                      <SelectItem key={grade.value} value={grade.value}>
                        {grade.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="maxGrade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Grade</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value, 10))}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select max grade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {gradeOptions.map((grade) => (
                      <SelectItem key={grade.value} value={grade.value}>
                        {grade.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
