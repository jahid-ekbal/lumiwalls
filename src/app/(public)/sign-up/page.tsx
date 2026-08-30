import SignUpForm from "@/components/Auth/SignUpForm";
import Brand from "@/components/Brand/Brand";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/shadcnui/card";
import { createMetadata } from "@/lib/metadata";
import Link from "next/link";

export const metadata = createMetadata({
  title: "Sign Up",
  description: "Create your Lumiwalls account",
});

const SignUpPage = () => {
  return (
    <section className="grid h-dvh place-items-center">
      <Card className="w-xs sm:w-sm">
        <CardHeader className="text-center">
          <Brand />
          <CardDescription>Create your Lumiwalls account</CardDescription>
        </CardHeader>

        <CardContent>
          <SignUpForm />
        </CardContent>

        <CardFooter className="flex-col gap-2">
          <div className="flex justify-center gap-1 text-sm">
            Already have an account?
            <Link
              href={"/"}
              className="hover:underline">
              Sign In
            </Link>
          </div>
        </CardFooter>
      </Card>
    </section>
  );
};

export default SignUpPage;
