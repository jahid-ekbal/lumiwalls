"use client";

import { Button, buttonVariants } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import Link from "next/link";
import { useEffect } from "react";

type BrowseErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const BrowseError = ({ error, reset }: BrowseErrorProps) => {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Could not load wallpapers</CardTitle>
          <CardDescription>
            Something went wrong while loading browse results. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => reset()}>
            Try again
          </Button>
          <Link
            href="/browse"
            className={buttonVariants({ variant: "outline" })}>
            Clear filters
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrowseError;
