import AuthShell from "@/components/Auth/AuthShell";
import SignUpForm from "@/components/Auth/SignUpForm";
import { createMetadata } from "@/lib/metadata";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Sign Up",
  description: "Create your Lumiwalls account",
});

const SignUpPage = () => {
  return (
    <AuthShell
      title="Create your account"
      description="Join Lumiwalls to curate favorites and submit wallpapers"
      footer={
        <div className="flex justify-center gap-1 text-sm">
          <span className="text-muted-foreground">Already have an account?</span>
          <Link
            href="/"
            className="font-medium underline-offset-4 hover:underline">
            Sign in
          </Link>
        </div>
      }>
      <SignUpForm />
    </AuthShell>
  );
};

export default SignUpPage;
