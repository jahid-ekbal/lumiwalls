import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";

const UsersContent = async () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>Account rows will stream here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          Users content is being built. This boundary keeps the header visible
          while the table loads.
        </p>
      </CardContent>
    </Card>
  );
};

export default UsersContent;
