import SignInForm from "@/components/Auth/SignInForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import type { Route } from "next";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign In — Lumiwalls",
  description: "Sign in to your Lumiwalls account",
};

const HomePage = () => {
  return (
    <section className="grid h-dvh place-items-center">
      <Card className="w-xs sm:w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Sign In</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>

        <CardContent>
          <SignInForm />
        </CardContent>

        <CardFooter className="flex-col gap-2">
          <div className="flex justify-center gap-1 text-sm">
            Don't have an account?
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
