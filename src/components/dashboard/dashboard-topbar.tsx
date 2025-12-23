"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tent, User, Settings, LogOut } from "lucide-react";
import { DashboardCommandPalette } from "./dashboard-command-palette";
import { ModeToggle } from "@/components/ui/mode-toggle";
import type { DashboardRole } from "./dashboard-nav";

interface DashboardTopbarProps {
  role?: DashboardRole;
}

const roleLabels: Record<DashboardRole, string> = {
  admin: "Admin",
  staff: "Staff",
  nurse: "Nurse",
  parent: "Parent",
};

const roleColors: Record<DashboardRole, string> = {
  admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  staff: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  nurse: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  parent: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

export function DashboardTopbar({ role }: DashboardTopbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Tent className="h-6 w-6" />
          <span className="hidden md:inline">Camp OS</span>
        </Link>

        {/* Role badge */}
        {role && (
          <Badge variant="outline" className={roleColors[role]}>
            {roleLabels[role]}
          </Badge>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search / Command palette */}
        <div className="flex items-center gap-2">
          <DashboardCommandPalette role={role} />
        </div>

        {/* Theme toggle */}
        <ModeToggle />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/api/auth/signout">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
