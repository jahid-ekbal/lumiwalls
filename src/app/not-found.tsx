import AmbientBackground from "@/components/Ambient/AmbientBackground";
import Brand from "@/components/Brand/Brand";
import EmptyState from "@/components/UI/EmptyState";
import { buttonVariants } from "@/components/shadcnui/button";
import { ArrowLeftIcon, CompassIcon, SearchXIcon } from "lucide-react";
import Link from "next/link";

const RootNotFound = () => {
  return (
    <div className="bg-background relative isolate grid min-h-dvh place-items-center px-4 py-12 sm:px-6">
      <AmbientBackground />
      <div className="grid w-full max-w-lg gap-6">
        <Brand />
        <EmptyState
          icon={SearchXIcon}
          title="Page not found"
          description="The page you requested does not exist or may have moved."
          action={
            <>
              <Link
                href="/"
                className={buttonVariants({ variant: "default", size: "sm" })}>
                <ArrowLeftIcon data-icon="inline-start" />
                Return home
              </Link>
              <Link
                href="/browse"
                className={buttonVariants({ variant: "outline", size: "sm" })}>
                <CompassIcon data-icon="inline-start" />
                Browse gallery
              </Link>
            </>
          }
        />
      </div>
    </div>
  );
};

export default RootNotFound;
