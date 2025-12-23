"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    Users,
    Calendar,
} from "lucide-react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
}

export function DashboardSidebar({ className }: SidebarProps) {
    const pathname = usePathname();

    const items = [
        {
            title: "Overview",
            href: "/dashboard/parent",
            icon: LayoutDashboard,
            matchExact: true,
        },
        {
            title: "My Children",
            href: "/dashboard/parent/children",
            icon: Users,
        },
        {
            title: "Registrations",
            href: "/dashboard/parent/registrations",
            icon: Calendar,
        },
    ];

    return (
        <div className={cn("pb-12 h-full", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <div className="space-y-1">
                        <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
                            Dashboard
                        </h2>
                        <nav className="space-y-1">
                            {items.map((item) => {
                                const isActive = item.matchExact
                                    ? pathname === item.href
                                    : pathname?.startsWith(item.href);

                                return (
                                    <Link key={item.href} href={item.href}>
                                        <Button
                                            variant={isActive ? "secondary" : "ghost"}
                                            className="w-full justify-start"
                                        >
                                            <item.icon className="mr-2 h-4 w-4" />
                                            {item.title}
                                        </Button>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    );
}
