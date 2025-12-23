"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getDashboardNavItems, type DashboardRole } from "./dashboard-nav";

export function MobileBottomNav({ role }: { role?: DashboardRole }) {
    const pathname = usePathname();

    const items = getDashboardNavItems(role).filter((item) => item.mobile);

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
            <div className="flex items-center justify-around h-16 px-2">
                {items.map((item) => {
                    const isActive = item.matchExact
                        ? pathname === item.href
                        : pathname?.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            <span className="text-xs font-medium">{item.title}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
