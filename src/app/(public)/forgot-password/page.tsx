import AuthShell from "@/components/Auth/AuthShell";
import { Alert, AlertDescription, AlertTitle } from "@/components/shadcnui/alert";
import { buttonVariants } from "@/components/shadcnui/button";
import { createMetadata } from "@/lib/metadata";
import { ArrowLeftIcon, KeyRoundIcon, UserPlusIcon } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = createMetadata({
  title: "Account Recovery",
  description: "Get help recovering access to your Lumiwalls account",
});

const ForgotPasswordPage = () => {
  return (
    <AuthShell
      title="Account recovery"
      description="Reset your access with an instance administrator"
      footer={
        <div className="flex w-full flex-col gap-2">
          <Link
            href="/"
            className={buttonVariants({ variant: "default", className: "w-full" })}>
            <ArrowLeftIcon data-icon="inline-start" />
            Back to sign in
          </Link>
          <Link
            href="/sign-up"
            className={buttonVariants({ variant: "ghost", className: "w-full" })}>
            <UserPlusIcon data-icon="inline-start" />
            Create a new account
          </Link>
        </div>
      }>
      <div className="grid gap-4">
        <Alert>
          <KeyRoundIcon aria-hidden="true" />
          <AlertTitle>Admin-assisted password resets</AlertTitle>
          <AlertDescription>
            Automated reset emails are not enabled on this Lumiwalls instance.
          </AlertDescription>
        </Alert>

        <ol className="text-body-sm text-muted-foreground grid list-decimal gap-2 pl-5">
          <li>
            Contact your Lumiwalls administrator and share the email address
            linked to your account.
          </li>
          <li>
            Your administrator can issue a new temporary password from the user
            management console.
          </li>
          <li>
            Once signed in, you will be redirected to Profile security to set a
            new password right away.
          </li>
        </ol>
      </div>
    </AuthShell>
  );
};

export default ForgotPasswordPage;
