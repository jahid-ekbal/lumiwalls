"use client";

import BoundaryErrorCard from "@/components/Errors/BoundaryErrorCard";

type ReportsErrorProps = {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
};

const ReportsError = ({ error, reset, unstable_retry }: ReportsErrorProps) => {
  return (
    <BoundaryErrorCard
      title="Could not load reports"
      description="Something went wrong while loading admin reports. Please try again."
      error={error}
      reset={reset}
      unstable_retry={unstable_retry}
      route="/admin/reports"
      backHref="/admin"
      backLabel="Back to dashboard"
    />
  );
};

export default ReportsError;
