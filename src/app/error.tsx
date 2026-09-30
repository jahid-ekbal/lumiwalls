"use client";

import BoundaryErrorCard from "@/components/Errors/BoundaryErrorCard";

type RootErrorProps = {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
};

const RootError = ({ error, reset, unstable_retry }: RootErrorProps) => {
  return (
    <BoundaryErrorCard
      title="Something went wrong"
      description="An unexpected error stopped this page from loading. Please try again."
      error={error}
      reset={reset}
      unstable_retry={unstable_retry}
      route="/"
      backHref="/"
      backLabel="Return home"
    />
  );
};

export default RootError;
