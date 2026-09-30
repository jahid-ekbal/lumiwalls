import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";

const FeaturedContent = async () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Featured</CardTitle>
        <CardDescription>Featured picks will stream here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          Featured content is being built. This boundary keeps the header
          visible while the grid loads.
        </p>
      </CardContent>
    </Card>
  );
};

export default FeaturedContent;
