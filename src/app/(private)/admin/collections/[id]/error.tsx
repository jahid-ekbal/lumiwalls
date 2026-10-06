"use client";

import BoundaryErrorCard from "@/components/Errors/BoundaryErrorCard";

type CollectionDetailErrorProps = {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
};

const CollectionDetailError = ({
  error,
  reset,
  unstable_retry,
}: CollectionDetailErrorProps) => {
  return (
    <BoundaryErrorCard
      title="Could not load collection"
      description="Something went wrong while loading this collection. Please try again."
      error={error}
      reset={reset}
      unstable_retry={unstable_retry}
      route="/admin/collections/[id]"
      backHref="/admin/collections"
      backLabel="Back to collections"
    />
  );
};

export default CollectionDetailError;
