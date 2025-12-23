import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  FileText,
  ClipboardCheck,
  AlertTriangle,
  Pill,
} from "lucide-react";

export type DashboardRole = "parent" | "staff" | "admin" | "nurse";

export type DashboardNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  matchExact?: boolean;
  mobile?: boolean;
  section?: string;
  badge?: string;
};

export const dashboardNavByRole: Record<DashboardRole, DashboardNavItem[]> = {
  parent: [
    {
      title: "Dashboard",
      href: "/dashboard/parent",
      icon: LayoutDashboard,
      matchExact: true,
      mobile: true,
      section: "Overview",
    },
    {
      title: "Children",
      href: "/dashboard/parent/children",
      icon: Users,
      mobile: true,
      section: "My Camp",
    },
    {
      title: "Registrations",
      href: "/dashboard/parent/registrations",
      icon: ClipboardList,
      mobile: true,
      section: "My Camp",
    },
    {
      title: "Sessions",
      href: "/dashboard/parent/sessions",
      icon: Calendar,
      mobile: true,
      section: "My Camp",
    },
    {
      title: "Forms",
      href: "/dashboard/parent/forms",
      icon: FileText,
      mobile: true,
      section: "My Camp",
    },
  ],
  staff: [
    {
      title: "Dashboard",
      href: "/dashboard/staff",
      icon: LayoutDashboard,
      matchExact: true,
      mobile: true,
      section: "Overview",
    },
    {
      title: "Groups",
      href: "/dashboard/staff/groups",
      icon: Users,
      mobile: true,
      section: "Work",
    },
    {
      title: "Attendance",
      href: "/dashboard/staff/attendance",
      icon: ClipboardCheck,
      mobile: true,
      section: "Work",
    },
  ],
  nurse: [
    {
      title: "Dashboard",
      href: "/dashboard/nurse",
      icon: LayoutDashboard,
      matchExact: true,
      mobile: true,
      section: "Overview",
    },
    {
      title: "Medications",
      href: "/dashboard/nurse/medications",
      icon: Pill,
      mobile: true,
      section: "Care",
    },
    {
      title: "Incidents",
      href: "/dashboard/nurse/incidents",
      icon: AlertTriangle,
      mobile: true,
      section: "Care",
    },
  ],
  admin: [
    {
      title: "Dashboard",
      href: "/dashboard/admin",
      icon: LayoutDashboard,
      matchExact: true,
      mobile: true,
      section: "Overview",
    },
    {
      title: "Accounts",
      href: "/dashboard/admin/accounts",
      icon: Users,
      mobile: true,
      section: "Management",
    },
    {
      title: "Sessions",
      href: "/dashboard/admin/programs",
      icon: Calendar,
      mobile: true,
      section: "Management",
    },
    {
      title: "Forms",
      href: "/dashboard/admin/forms",
      icon: FileText,
      mobile: true,
      section: "Management",
    },
    {
      title: "Attendance",
      href: "/dashboard/admin/attendance",
      icon: ClipboardCheck,
      section: "Operations",
    },
    {
      title: "Incidents",
      href: "/dashboard/admin/incidents",
      icon: AlertTriangle,
      section: "Operations",
    },
  ],
};

export function getDashboardNavItems(role?: DashboardRole): DashboardNavItem[] {
  if (!role) return [];
  return dashboardNavByRole[role] ?? [];
}

export function getSearchPlaceholder(role?: DashboardRole): string {
  switch (role) {
    case "admin":
      return "Search accounts, sessions, forms, incidents...";
    case "parent":
      return "Search sessions, registrations, children...";
    case "staff":
      return "Search groups, attendance, children...";
    case "nurse":
      return "Search medications, incidents, children...";
    default:
      return "Search...";
  }
}
