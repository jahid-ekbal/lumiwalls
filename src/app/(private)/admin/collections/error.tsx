"use client";

import BoundaryErrorCard from "@/components/Errors/BoundaryErrorCard";

type CollectionsErrorProps = {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
};

const CollectionsError = ({
  error,
  reset,
  unstable_retry,
}: CollectionsErrorProps) => {
  return (
    <BoundaryErrorCard
      title="Could not load collections"
      description="Something went wrong while loading admin collections. Please try again."
      error={error}
      reset={reset}
      unstable_retry={unstable_retry}
      route="/admin/collections"
      backHref="/admin"
      backLabel="Back to dashboard"
    />
  );
};

export default CollectionsError;
