import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";

const ReportsContent = async () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports</CardTitle>
        <CardDescription>Open reports will stream here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          Reports content is being built. This boundary keeps the header visible
          while the list loads.
        </p>
      </CardContent>
    </Card>
  );
};

export default ReportsContent;
