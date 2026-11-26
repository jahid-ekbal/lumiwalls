"use client";

import ErrorState from "@/components/UI/ErrorState";
import { buttonVariants } from "@/components/shadcnui/button";
import { logBoundaryError } from "@/server/actions/logBoundaryError";
import { ArrowLeftIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type BoundaryErrorCardProps = {
  title: string;
  description: string;
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
  route: string;
  backHref: Route;
  backLabel: string;
};

const BoundaryErrorCard = ({
  title,
  description,
  error,
  reset,
  unstable_retry,
  route,
  backHref,
  backLabel,
}: BoundaryErrorCardProps) => {
  const router = useRouter();

  useEffect(() => {
    void logBoundaryError({
      route,
      digest: error.digest,
      message: error.message,
      stack: error.stack,
    });
  }, [error, route]);

  const handleRetry = () => {
    if (unstable_retry) {
      unstable_retry();
    } else {
      reset?.();
      router.refresh();
    }
  };

  return (
    <div className="mx-auto max-w-2xl py-8">
      <ErrorState
        title={title}
        description={description}
        digest={error.digest}
        onRetry={handleRetry}
        action={
          <Link
            href={backHref}
            className={buttonVariants({ variant: "outline" })}>
            <ArrowLeftIcon data-icon="inline-start" />
            {backLabel}
          </Link>
        }
      />
    </div>
  );
};

export default BoundaryErrorCard;
