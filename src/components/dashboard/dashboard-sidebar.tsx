"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getDashboardNavItems, type DashboardRole } from "./dashboard-nav";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  role?: DashboardRole;
}

export function DashboardSidebar({ className, role }: SidebarProps) {
  const pathname = usePathname();
  const items = getDashboardNavItems(role);

  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    const section = item.section || "Navigation";
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {});

  return (
    <div className={cn("h-full py-6", className)}>
      <div className="space-y-6">
        {Object.entries(grouped).map(([section, sectionItems]) => (
          <div key={section} className="px-3">
            <h2 className="mb-2 px-2 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
              {section}
            </h2>
            <nav className="space-y-1">
              {sectionItems.map((item) => {
                const isActive = item.matchExact
                  ? pathname === item.href
                  : pathname?.startsWith(item.href);

                return (
                  <Button
                    key={item.href}
                    asChild
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      isActive && "bg-secondary font-medium"
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className="mr-3 h-4 w-4" />
                      <span className="flex-1 text-left">{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </Button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </div>
  );
}
