"use client";

import BoundaryErrorCard from "@/components/Errors/BoundaryErrorCard";

type AdminErrorProps = {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
};

const AdminError = ({ error, reset, unstable_retry }: AdminErrorProps) => {
  return (
    <BoundaryErrorCard
      title="Could not load admin dashboard"
      description="Something went wrong in the admin area. Please try again."
      error={error}
      reset={reset}
      unstable_retry={unstable_retry}
      route="/admin"
      backHref="/admin"
      backLabel="Back to dashboard"
    />
  );
};

export default AdminError;
