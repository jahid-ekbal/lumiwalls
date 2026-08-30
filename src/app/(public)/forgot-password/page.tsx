import Brand from "@/components/Brand/Brand";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { createMetadata } from "@/lib/metadata";
import Link from "next/link";

export const metadata = createMetadata({
  title: "Forgot Password",
  description: "Reset your Lumiwalls password",
});

const ForgotPasswordPage = () => {
  return (
    <section className="grid h-dvh place-items-center">
      <Card className="w-xs sm:w-sm">
        <CardHeader className="text-center">
          <Brand />
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>Password reset is coming soon</CardDescription>
        </CardHeader>

        <CardContent className="text-muted-foreground text-center text-sm">
          If you have forgotten your password, please contact support or try
          again later. This placeholder will be replaced with a reset form.
        </CardContent>

        <CardFooter className="justify-center">
          <Link
            href="/"
            className="text-sm hover:underline">
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    </section>
  );
};

export default ForgotPasswordPage;
