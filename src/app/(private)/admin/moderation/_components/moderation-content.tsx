import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";

const ModerationContent = async () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Queue</CardTitle>
        <CardDescription>Pending items will stream here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          Moderation content is being built. This boundary keeps the header
          visible while the queue loads.
        </p>
      </CardContent>
    </Card>
  );
};

export default ModerationContent;
