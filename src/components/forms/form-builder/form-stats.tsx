import { Card, CardContent } from "@/components/ui/card";

type FormStatsProps = {
  fieldCount: number;
  submissionCount: number;
  scope: string;
};

export function FormStats({
  fieldCount,
  submissionCount,
  scope,
}: FormStatsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">{fieldCount}</div>
          <p className="text-sm text-muted-foreground">Fields</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">{submissionCount}</div>
          <p className="text-sm text-muted-foreground">Submissions</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm font-medium">{scope}</div>
          <p className="text-sm text-muted-foreground">Scope</p>
        </CardContent>
      </Card>
    </div>
  );
}
