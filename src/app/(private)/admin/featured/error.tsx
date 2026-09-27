"use client";

import BoundaryErrorCard from "@/components/Errors/BoundaryErrorCard";

type FeaturedErrorProps = {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
};

const FeaturedError = ({
  error,
  reset,
  unstable_retry,
}: FeaturedErrorProps) => {
  return (
    <BoundaryErrorCard
      title="Could not load featured"
      description="Something went wrong while loading featured wallpapers. Please try again."
      error={error}
      reset={reset}
      unstable_retry={unstable_retry}
      route="/admin/featured"
      backHref="/admin"
      backLabel="Back to dashboard"
    />
  );
};

export default FeaturedError;
