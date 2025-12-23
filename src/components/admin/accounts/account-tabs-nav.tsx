"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface AccountTabsNavProps {
  accountId: string;
}

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "finance", label: "Finance" },
  { id: "reservations", label: "Reservations" },
  { id: "activity", label: "Activity" },
] as const;

export function AccountTabsNav({ accountId }: AccountTabsNavProps) {
  const pathname = usePathname();

  const getTabHref = (tabId: string) => {
    if (tabId === "overview") {
      return `/dashboard/admin/accounts/${accountId}`;
    }
    return `/dashboard/admin/accounts/${accountId}/${tabId}`;
  };

  const isActiveTab = (tabId: string) => {
    const tabPath = getTabHref(tabId);
    return pathname === tabPath;
  };

  return (
    <nav className="flex border-b">
      {tabs.map((tab) => {
        const isActive = isActiveTab(tab.id);
        return (
          <Link
            key={tab.id}
            href={getTabHref(tab.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
