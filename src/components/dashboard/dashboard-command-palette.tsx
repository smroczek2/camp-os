"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  getDashboardNavItems,
  getSearchPlaceholder,
  type DashboardRole,
} from "./dashboard-nav";

type QuickAction = {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  section?: string;
};

const roleQuickActions: Record<DashboardRole, QuickAction[]> = {
  admin: [
    { label: "Create session", href: "/dashboard/admin/programs", section: "Actions" },
    { label: "New incident report", href: "/dashboard/admin/incidents", section: "Actions" },
  ],
  staff: [
    { label: "Take attendance", href: "/dashboard/staff/attendance", section: "Actions" },
    { label: "View my groups", href: "/dashboard/staff/groups", section: "Actions" },
  ],
  nurse: [
    { label: "Log medication", href: "/dashboard/nurse/medications", section: "Actions" },
    { label: "Report incident", href: "/dashboard/nurse/incidents", section: "Actions" },
  ],
  parent: [
    { label: "Register for session", href: "/dashboard/parent/sessions", section: "Actions" },
    { label: "Pay invoice", href: "/dashboard/parent/registrations", section: "Actions" },
  ],
};

function buildQuickActions(role?: DashboardRole): QuickAction[] {
  const roleKey = role ?? "parent";
  const navItems = getDashboardNavItems(roleKey).map((item) => ({
    label: item.title,
    href: item.href,
    icon: item.icon,
    section: "Navigation",
  }));

  const actions = roleQuickActions[roleKey] ?? [];
  return [...navItems, ...actions];
}

export function DashboardCommandPalette({ role }: { role?: DashboardRole }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const placeholder = getSearchPlaceholder(role);

  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const onNavigate = React.useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router]
  );

  const quickActions = buildQuickActions(role);

  // Group actions by section
  const grouped = quickActions.reduce<Record<string, QuickAction[]>>((acc, action) => {
    const section = action.section || "Other";
    if (!acc[section]) acc[section] = [];
    acc[section].push(action);
    return acc;
  }, {});

  // Filter based on query
  const filtered = Object.entries(grouped).reduce<Record<string, QuickAction[]>>(
    (acc, [section, actions]) => {
      const matches = actions.filter((action) =>
        action.label.toLowerCase().includes(query.toLowerCase())
      );
      if (matches.length > 0) {
        acc[section] = matches;
      }
      return acc;
    },
    {}
  );

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="hidden md:inline-flex gap-2 min-w-[200px] justify-start text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <Command className="h-3 w-3" />K
        </kbd>
      </Button>

      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="md:hidden"
        aria-label="Open search"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="sr-only">Command Menu</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                autoFocus
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="pl-10"
              />
            </div>

            {Object.keys(filtered).length > 0 ? (
              <div className="max-h-[400px] overflow-y-auto">
                {Object.entries(filtered).map(([section, actions]) => (
                  <div key={section} className="mb-4 last:mb-0">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                      {section}
                    </div>
                    <div className="space-y-1">
                      {actions.map((action) => {
                        const Icon = action.icon;
                        return (
                          <button
                            key={`${action.href}-${action.label}`}
                            type="button"
                            onClick={() => onNavigate(action.href)}
                            className="w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-left hover:bg-accent transition-colors"
                          >
                            {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                            <span className="flex-1 font-medium">{action.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : query ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No results found for &quot;{query}&quot;
              </div>
            ) : null}

            <div className="border-t pt-3 text-xs text-muted-foreground flex items-center justify-between">
              <span>Navigate with ↑↓ keys</span>
              <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px]">
                <Command className="h-3 w-3" />K
              </kbd>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
