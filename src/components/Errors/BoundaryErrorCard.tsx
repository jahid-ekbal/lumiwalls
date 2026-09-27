"use client";

import { Button, buttonVariants } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { logBoundaryError } from "@/server/actions/logBoundaryError";
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
    <div className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {error.digest ?
            <p className="text-muted-foreground text-xs">
              Reference: {error.digest}
            </p>
          : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={handleRetry}>
              Try again
            </Button>
            <Link
              href={backHref}
              className={buttonVariants({ variant: "outline" })}>
              {backLabel}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BoundaryErrorCard;
