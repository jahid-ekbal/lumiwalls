import EmptyState from "@/components/UI/EmptyState";
import { buttonVariants } from "@/components/shadcnui/button";
import { ArrowLeftIcon, SearchXIcon } from "lucide-react";
import Link from "next/link";

const AdminNotFound = () => {
  return (
    <div className="mx-auto max-w-xl py-8">
      <EmptyState
        icon={SearchXIcon}
        title="Admin page not found"
        description="The admin page you are looking for does not exist or was moved."
        action={
          <Link
            href="/admin"
            className={buttonVariants({ variant: "outline", size: "sm" })}>
            <ArrowLeftIcon data-icon="inline-start" />
            Back to dashboard
          </Link>
        }
      />
    </div>
  );
};

export default AdminNotFound;
