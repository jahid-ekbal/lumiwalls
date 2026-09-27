"use client";

import BoundaryErrorCard from "@/components/Errors/BoundaryErrorCard";

type AnalyticsErrorProps = {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
};

const AnalyticsError = ({
  error,
  reset,
  unstable_retry,
}: AnalyticsErrorProps) => {
  return (
    <BoundaryErrorCard
      title="Could not load analytics"
      description="Something went wrong while loading admin analytics. Please try again."
      error={error}
      reset={reset}
      unstable_retry={unstable_retry}
      route="/admin/analytics"
      backHref="/admin"
      backLabel="Back to dashboard"
    />
  );
};

export default AnalyticsError;
