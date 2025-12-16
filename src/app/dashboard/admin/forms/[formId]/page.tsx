import { getSession } from "@/lib/auth-helper";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formDefinitions } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { FormDetailsView } from "@/components/forms/form-builder/form-details";

type FormType = "registration" | "waiver" | "medical" | "custom";

export default async function FormDetailsPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  const session = await getSession();
  if (!session?.user) {
    redirect("/dev-login");
  }

  // Check admin role
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (session.user as any).role;
  if (userRole !== "admin") {
    redirect("/dashboard");
  }

  const form = await db.query.formDefinitions.findFirst({
    where: eq(formDefinitions.id, formId),
    with: {
      camp: true,
      session: true,
      fields: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        orderBy: (fields: any, { asc }: any) => [asc(fields.displayOrder)],
        with: {
          options: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            orderBy: (options: any, { asc }: any) => [
              asc(options.displayOrder),
            ],
          },
        },
      },
      submissions: { columns: { id: true } },
    },
  });

  if (!form) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-2">Form Not Found</h1>
          <p className="text-muted-foreground">
            This form does not exist or has been deleted.
          </p>
        </div>
      </div>
    );
  }

  return <FormDetailsView form={{ ...form, formType: form.formType as FormType }} />;
}
