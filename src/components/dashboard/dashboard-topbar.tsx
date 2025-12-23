import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { getSearchPlaceholder, type DashboardRole } from "./dashboard-nav";

interface DashboardTopbarProps {
  role?: DashboardRole;
}

export function DashboardTopbar({ role }: DashboardTopbarProps) {
  const placeholder = getSearchPlaceholder(role);

  return (
    <div className="mb-6">
      <form
        action="/dashboard/search"
        method="GET"
        className="flex items-center gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            name="q"
            placeholder={placeholder}
            className="pl-10"
          />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>
    </div>
  );
}
