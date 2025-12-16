import Link from "next/link";
import { UserProfile } from "@/components/auth/user-profile";
import { ModeToggle } from "./ui/mode-toggle";
import { RoleSwitcher } from "@/components/role-switcher";
import { Tent } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          <Link
            href="/"
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/10 to-green-500/10 border border-blue-500/20">
              <Tent className="h-5 w-5 text-blue-600" />
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Camp OS
            </span>
          </Link>
        </h1>
        <div className="flex items-center gap-4">
          <RoleSwitcher />
          <UserProfile />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
