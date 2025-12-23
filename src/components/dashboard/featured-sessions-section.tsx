import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Calendar, Users as UsersIcon } from "lucide-react";
import { RegisterSessionDialog } from "@/components/parent/register-session-dialog";
import { JoinWaitlistButton } from "@/components/parent/join-waitlist-button";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Child {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  allergies: string[] | null;
  medicalNotes: string | null;
}

interface Session {
  id: string;
  name: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  price: string;
  capacity: number;
  status: string;
  minAge: number | null;
  maxAge: number | null;
  confirmedCount: number;
}

interface FeaturedSessionsSectionProps {
  sessions: Session[];
  childrenList: Child[];
}

export function FeaturedSessionsSection({
  sessions,
  childrenList,
}: FeaturedSessionsSectionProps) {
  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No sessions available"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sessions.map((campSession) => {
        const spotsLeft = campSession.capacity - campSession.confirmedCount;
        const isOpen = campSession.status === "open";
        const capacityPercentage = (campSession.confirmedCount / campSession.capacity) * 100;

        return (
          <div
            key={campSession.id}
            className="group p-6 border rounded-xl bg-card shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 relative overflow-hidden"
          >
            {/* Hover overlay with expanded details */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/95 to-background/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10" />

            <div className="relative z-20">
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-xl">
                    {campSession.name}
                  </h3>
                  {campSession.minAge && campSession.maxAge && (
                    <Badge variant="secondary" className="shrink-0">
                      Ages {campSession.minAge}-{campSession.maxAge}
                    </Badge>
                  )}
                </div>
                {campSession.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2 group-hover:line-clamp-none transition-all">
                    {campSession.description}
                  </p>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Dates</span>
                  <span className="font-medium text-xs">
                    {formatDate(campSession.startDate)} -{" "}
                    {formatDate(campSession.endDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-bold text-lg">${campSession.price}</span>
                </div>

                {/* Capacity Progress Bar */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <UsersIcon className="h-3 w-3" />
                      Capacity
                    </span>
                    <span
                      className={cn(
                        "font-medium",
                        spotsLeft < 5 ? "text-orange-600" : "text-green-600"
                      )}
                    >
                      {campSession.confirmedCount} / {campSession.capacity}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all rounded-full",
                        capacityPercentage >= 90
                          ? "bg-red-500"
                          : capacityPercentage >= 70
                          ? "bg-orange-500"
                          : "bg-green-500"
                      )}
                      style={{ width: `${capacityPercentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} remaining
                  </p>
                </div>
              </div>

              {isOpen && spotsLeft > 0 ? (
                <div className="mt-4">
                  <RegisterSessionDialog
                    session={campSession}
                    childrenList={childrenList}
                    disabled={childrenList.length === 0}
                  />
                </div>
              ) : !isOpen ? (
                <Badge variant="outline" className="w-full justify-center mt-4">
                  {campSession.status}
                </Badge>
              ) : (
                <div className="mt-4 space-y-2">
                  <Badge
                    variant="outline"
                    className="w-full justify-center text-red-600"
                  >
                    Full
                  </Badge>
                  <JoinWaitlistButton
                    session={campSession}
                    childrenList={childrenList}
                    disabled={childrenList.length === 0}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
