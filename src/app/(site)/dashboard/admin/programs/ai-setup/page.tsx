import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helper";
import { AISetupChat } from "@/components/admin/ai-setup/ai-chat";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AISetupPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link
          href="/dashboard/admin/programs"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Programs
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              AI Session Setup
              <span className="text-xs font-normal px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                Beta
              </span>
            </h1>
            <p className="text-muted-foreground">
              Describe your camp sessions in plain language and let AI help you set them up.
            </p>
          </div>
        </div>
      </div>

      <AISetupChat />
    </div>
  );
}
