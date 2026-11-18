"use client";

import BoundaryErrorCard from "@/components/Errors/BoundaryErrorCard";

type TagsErrorProps = {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
};

const TagsError = ({ error, reset, unstable_retry }: TagsErrorProps) => {
  return (
    <BoundaryErrorCard
      title="Could not load tags"
      description="Something went wrong while loading tags. Please try again."
      error={error}
      reset={reset}
      unstable_retry={unstable_retry}
      route="/admin/tags"
      backHref="/admin"
      backLabel="Back to dashboard"
    />
  );
};

export default TagsError;
