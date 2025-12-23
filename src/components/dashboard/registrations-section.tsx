import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Calendar, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Registration {
  id: string;
  status: string;
  amountPaid: string | null;
  session: {
    name: string;
    description: string | null;
    startDate: Date;
    endDate: Date;
    price: string;
  };
  child: {
    firstName: string;
    lastName: string;
  };
}

// Type guard for status
function isValidStatus(
  status: string
): status is "pending" | "confirmed" | "canceled" | "refunded" {
  return ["pending", "confirmed", "canceled", "refunded"].includes(status);
}

interface RegistrationsSectionProps {
  registrations: Registration[];
}

export function RegistrationsSection({
  registrations,
}: RegistrationsSectionProps) {
  if (registrations.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No camp registrations yet"
        action={
          <Link href="#browse-sessions">
            <Button>
              Browse Available Sessions
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {registrations.map((registration) => (
        <div
          key={registration.id}
          className="p-6 border rounded-xl bg-card shadow-sm"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-lg">
                  {registration.session.name}
                </h3>
                <StatusBadge
                  status={
                    isValidStatus(registration.status)
                      ? registration.status
                      : "pending"
                  }
                  label={
                    registration.status === "pending"
                      ? "Pending Payment"
                      : undefined
                  }
                />
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                {registration.child.firstName} {registration.child.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDate(registration.session.startDate)} -{" "}
                {formatDate(registration.session.endDate)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold">${registration.session.price}</p>
              {registration.amountPaid ? (
                <p className="text-sm text-green-600">Paid</p>
              ) : registration.status === "pending" ? (
                <Link href={`/checkout/${registration.id}`}>
                  <Button size="sm" className="mt-2">
                    Pay Now
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>

          {registration.session.description && (
            <p className="text-sm text-muted-foreground">
              {registration.session.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
