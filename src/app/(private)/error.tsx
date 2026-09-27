"use client";

import BoundaryErrorCard from "@/components/Errors/BoundaryErrorCard";

type PrivateErrorProps = {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
};

const PrivateError = ({ error, reset, unstable_retry }: PrivateErrorProps) => {
  return (
    <BoundaryErrorCard
      title="Could not load this section"
      description="Something went wrong while loading this page. Please try again."
      error={error}
      reset={reset}
      unstable_retry={unstable_retry}
      route="/private"
      backHref="/browse"
      backLabel="Back to browse"
    />
  );
};

export default PrivateError;
