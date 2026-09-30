import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";

const CollectionsContent = async () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Collections</CardTitle>
        <CardDescription>Curated sets will stream here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          Collections content is being built. This boundary keeps the header
          visible while the grid loads.
        </p>
      </CardContent>
    </Card>
  );
};

export default CollectionsContent;
