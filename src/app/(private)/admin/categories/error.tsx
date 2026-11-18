"use client";

import BoundaryErrorCard from "@/components/Errors/BoundaryErrorCard";

type CategoriesErrorProps = {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
};

const CategoriesError = ({
  error,
  reset,
  unstable_retry,
}: CategoriesErrorProps) => {
  return (
    <BoundaryErrorCard
      title="Could not load categories"
      description="Something went wrong while loading categories. Please try again."
      error={error}
      reset={reset}
      unstable_retry={unstable_retry}
      route="/admin/categories"
      backHref="/admin"
      backLabel="Back to dashboard"
    />
  );
};

export default CategoriesError;
