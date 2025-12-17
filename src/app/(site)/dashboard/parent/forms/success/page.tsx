import { getSession } from "@/lib/auth-helper";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formDefinitions } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Home, FileText } from "lucide-react";
import Link from "next/link";

export default async function FormSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ formId?: string }>;
}) {
  const { formId } = await searchParams;
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  let formName = "Form";

  if (formId) {
    const form = await db.query.formDefinitions.findFirst({
      where: eq(formDefinitions.id, formId),
      columns: {
        name: true,
      },
    });
    if (form) {
      formName = form.name;
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <CardContent className="pt-6">
            <div className="text-center">
              {/* Success Icon */}
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/10">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold mb-2">
                Form Submitted Successfully!
              </h1>

              {/* Message */}
              <p className="text-lg text-muted-foreground mb-6">
                Thank you for completing <strong>{formName}</strong>
              </p>

              <div className="max-w-md mx-auto mb-8 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Your submission has been received and will be reviewed by our
                  team. You can view your submission at any time from your
                  dashboard.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard/parent">
                  <Button size="lg" className="w-full sm:w-auto">
                    <Home className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
                {formId && (
                  <Link href={`/dashboard/parent/forms/${formId}`}>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Submission
                    </Button>
                  </Link>
                )}
              </div>

              {/* Additional Info */}
              <div className="mt-8 pt-8 border-t">
                <p className="text-sm text-muted-foreground">
                  Need help?{" "}
                  <Link
                    href="mailto:support@camposarai.co"
                    className="text-foreground underline hover:no-underline"
                  >
                    Contact Support
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
