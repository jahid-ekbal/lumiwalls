import AuthShell from "@/components/Auth/AuthShell";
import SignInForm from "@/components/Auth/SignInForm";
import { createMetadata } from "@/lib/metadata";
import type { Route } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Sign In",
  description: "Sign in to your Lumiwalls account",
});

const HomePage = () => {
  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to browse, save, and upload wallpapers"
      footer={
        <>
          <div className="flex justify-center gap-1 text-sm">
            <span className="text-muted-foreground">
              Don&apos;t have an account?
            </span>
            <Link
              href="/sign-up"
              className="font-medium underline-offset-4 hover:underline">
              Create one
            </Link>
          </div>
          <Link
            href={"/forgot-password" as Route}
            className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline">
            Need help signing in?
          </Link>
        </>
      }>
      <SignInForm />
    </AuthShell>
  );
};

export default HomePage;
