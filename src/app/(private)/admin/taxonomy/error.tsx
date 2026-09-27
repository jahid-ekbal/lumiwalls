"use client";

import BoundaryErrorCard from "@/components/Errors/BoundaryErrorCard";

type TaxonomyErrorProps = {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
};

const TaxonomyError = ({
  error,
  reset,
  unstable_retry,
}: TaxonomyErrorProps) => {
  return (
    <BoundaryErrorCard
      title="Could not load taxonomy"
      description="Something went wrong while loading categories and tags. Please try again."
      error={error}
      reset={reset}
      unstable_retry={unstable_retry}
      route="/admin/taxonomy"
      backHref="/admin"
      backLabel="Back to dashboard"
    />
  );
};

export default TaxonomyError;
