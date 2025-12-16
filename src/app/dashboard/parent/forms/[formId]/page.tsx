import { getSession } from "@/lib/auth-helper";
import { redirect } from "next/navigation";
import { getFormAction } from "@/app/actions/form-actions";
import { DynamicForm } from "@/components/forms/form-renderer/dynamic-form";
import { Card } from "@/components/ui/card";

export default async function ParentFormPage({
  params,
  searchParams,
}: {
  params: { formId: string };
  searchParams: { childId?: string };
}) {
  const session = await getSession();
  if (!session?.user) redirect("/dev-login");

  let formConfig;
  try {
    formConfig = await getFormAction(params.formId);
  } catch (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Form Not Available</h1>
          <p className="text-muted-foreground">
            This form is not available or you don't have permission to access
            it.
          </p>
        </Card>
      </div>
    );
  }

  if (!formConfig) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Form Not Found</h1>
          <p className="text-muted-foreground">
            This form doesn't exist or has been removed.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{formConfig.name}</h1>
        {formConfig.description && (
          <p className="text-muted-foreground mb-8">
            {formConfig.description}
          </p>
        )}

        <Card className="p-6">
          <DynamicForm
            formConfig={formConfig as any}
            userId={session.user.id}
            childId={searchParams.childId}
          />
        </Card>
      </div>
    </div>
  );
}
