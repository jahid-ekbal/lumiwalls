import { buttonVariants } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import Link from "next/link";

const AdminNotFound = () => {
  return (
    <div className="grid gap-6">
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Admin page not found</CardTitle>
          <CardDescription>
            The admin page you are looking for does not exist or was moved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/admin"
            className={buttonVariants({ variant: "outline" })}>
            Back to dashboard
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNotFound;
