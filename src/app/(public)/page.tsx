import SignInForm from "@/components/Auth/SignInForm";
import Brand from "@/components/Brand/Brand";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/shadcnui/card";
import { createMetadata } from "@/lib/metadata";
import type { Route } from "next";
import Link from "next/link";

export const metadata = createMetadata({
  title: "Sign In",
  description: "Sign in to your Lumiwalls account",
});

const HomePage = () => {
  return (
    <section className="grid h-dvh place-items-center">
      <Card className="w-xs sm:w-sm">
        <CardHeader className="text-center">
          <Brand />
          <CardDescription>Sign in to your Lumiwalls account</CardDescription>
        </CardHeader>

        <CardContent>
          <SignInForm />
        </CardContent>

        <CardFooter className="flex-col gap-2">
          <div className="flex justify-center gap-1 text-sm">
            Don&apos;t have an account?
            <Link
              href="/sign-up"
              className="hover:underline">
              Create
            </Link>
          </div>
          <Link
            href={"/forgot-password" as Route}
            className="text-muted-foreground text-xs hover:underline">
            Forgot password?
          </Link>
        </CardFooter>
      </Card>
    </section>
  );
};

export default HomePage;
