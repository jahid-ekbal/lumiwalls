import { buttonVariants } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import Link from "next/link";

const PrivateNotFound = () => {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Page not found</CardTitle>
          <CardDescription>
            The page you are looking for does not exist or was moved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/browse"
            className={buttonVariants({ variant: "outline" })}>
            Back to browse
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivateNotFound;
