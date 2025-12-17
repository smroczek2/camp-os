"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LayoutDashboard, Settings, Tent, Calendar, Users, LogOut, ArrowLeft } from "lucide-react";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface Organization {
  id: string;
  name: string;
  slug: string;
  status: string;
  subscriptionTier: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string;
}

interface OrgHeaderProps {
  organization: Organization;
  user: User | null;
}

export function OrgHeader({ organization, user }: OrgHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const baseUrl = `/org/${organization.slug}`;

  const navItems = [
    {
      href: `${baseUrl}/dashboard`,
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: `${baseUrl}/camps`,
      label: "Camps",
      icon: Tent,
    },
    {
      href: `${baseUrl}/sessions`,
      label: "Sessions",
      icon: Calendar,
    },
    {
      href: `${baseUrl}/settings`,
      label: "Settings",
      icon: Settings,
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
  };

  const isSuperAdmin = user?.role === "super_admin";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo & Nav */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4">
            {isSuperAdmin && (
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
                <Link href="/super-admin/organizations">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Admin
                </Link>
              </Button>
            )}
            <Link
              href={`${baseUrl}/dashboard`}
              className="flex items-center gap-2 font-bold text-lg"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/10 to-green-500/10 border border-blue-500/20">
                <Tent className="h-5 w-5 text-blue-600" />
              </div>
              <span className="hidden sm:inline truncate max-w-[200px]">
                {organization.name}
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== `${baseUrl}/dashboard` &&
                  pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md",
                    isActive
                      ? "text-foreground bg-muted"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <ModeToggle />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image || ""} alt={user.name} />
                    <AvatarFallback>
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                    {isSuperAdmin && (
                      <p className="text-xs leading-none text-purple-600 font-medium mt-1">
                        Super Admin
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isSuperAdmin && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/super-admin">
                        <Users className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
