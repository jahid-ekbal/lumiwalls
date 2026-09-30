import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";

const AnalyticsContent = async () => {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>Charts and trends will stream here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Analytics content is being built. This boundary keeps the header
            visible while charts load.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsContent;
