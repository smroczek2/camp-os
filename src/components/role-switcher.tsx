"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, Activity, Shield, Heart, RefreshCw } from "lucide-react";

const DEV_USERS = [
  {
    id: "parent-1",
    name: "Jennifer Smith (Parent)",
    role: "parent",
    icon: Users,
  },
  {
    id: "parent-2",
    name: "David Williams (Parent)",
    role: "parent",
    icon: Users,
  },
  {
    id: "staff-1",
    name: "Sarah Johnson (Staff)",
    role: "staff",
    icon: Activity,
  },
  {
    id: "staff-2",
    name: "Mike Chen (Staff)",
    role: "staff",
    icon: Activity,
  },
  {
    id: "nurse-1",
    name: "Dr. Emily Martinez (Nurse)",
    role: "nurse",
    icon: Heart,
  },
  {
    id: "admin-1",
    name: "Admin User",
    role: "admin",
    icon: Shield,
  },
];

export function RoleSwitcher() {
  const [switching, setSwitching] = useState(false);

  const switchRole = async (userId: string) => {
    setSwitching(true);
    try {
      const response = await fetch("/api/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        window.location.href = "/dashboard";
      } else {
        alert("Failed to switch role");
      }
    } catch (error) {
      console.error("Role switch error:", error);
      alert("Failed to switch role");
    } finally {
      setSwitching(false);
    }
  };

  // Only show in development
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Switch Role
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Test as Different User</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {DEV_USERS.map((user) => {
          const Icon = user.icon;
          return (
            <DropdownMenuItem
              key={user.id}
              onClick={() => switchRole(user.id)}
              disabled={switching}
              className="cursor-pointer"
            >
              <Icon className="h-4 w-4 mr-2" />
              {user.name}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
