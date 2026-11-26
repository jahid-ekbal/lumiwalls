import EmptyState from "@/components/UI/EmptyState";
import { buttonVariants } from "@/components/shadcnui/button";
import { ArrowLeftIcon, SearchXIcon } from "lucide-react";
import Link from "next/link";

const PrivateNotFound = () => {
  return (
    <div className="mx-auto max-w-xl py-8">
      <EmptyState
        icon={SearchXIcon}
        title="Page not found"
        description="The page you are looking for does not exist or was moved."
        action={
          <Link
            href="/browse"
            className={buttonVariants({ variant: "outline", size: "sm" })}>
            <ArrowLeftIcon data-icon="inline-start" />
            Back to browse
          </Link>
        }
      />
    </div>
  );
};

export default PrivateNotFound;
