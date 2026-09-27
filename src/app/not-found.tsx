import { buttonVariants } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import Link from "next/link";

const RootNotFound = () => {
  return (
    <div className="mx-auto grid min-h-svh max-w-2xl place-items-center p-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Page not found</CardTitle>
          <CardDescription>
            The page you are looking for does not exist or was moved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/"
            className={buttonVariants({ variant: "outline" })}>
            Return home
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default RootNotFound;
