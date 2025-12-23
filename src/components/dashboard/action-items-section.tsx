import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { FileText, ArrowRight } from "lucide-react";

interface FormItem {
  id: string;
  name: string;
  description: string | null;
  fields: { id: string }[];
  session: { name: string } | null;
}

interface ActionItemsSectionProps {
  availableForms: FormItem[];
  completedFormIds: string[];
}

export function ActionItemsSection({
  availableForms,
  completedFormIds,
}: ActionItemsSectionProps) {
  if (availableForms.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No forms available at this time"
        description="Forms will appear here once you register for a camp session."
      />
    );
  }

  return (
    <div className="space-y-4">
      {availableForms.map((form) => {
        const isCompleted = completedFormIds.includes(form.id);

        return (
          <div
            key={form.id}
            className="p-6 border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg">{form.name}</h3>
                  {isCompleted ? (
                    <StatusBadge status="completed" />
                  ) : (
                    <StatusBadge status="pending" label="Action Required" />
                  )}
                </div>
                {form.description && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {form.description}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  {form.fields?.length || 0} fields • {form.session?.name ?? "General"}
                </p>
              </div>
              <div>
                {!isCompleted && (
                  <Button asChild>
                    <Link href={`/dashboard/parent/forms/${form.id}`}>
                      Complete Form
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                )}
                {isCompleted && (
                  <Button asChild variant="outline">
                    <Link href={`/dashboard/parent/forms/${form.id}`}>
                      View Submission
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
