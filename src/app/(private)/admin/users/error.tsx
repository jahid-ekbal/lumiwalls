"use client";

import BoundaryErrorCard from "@/components/Errors/BoundaryErrorCard";

type UsersErrorProps = {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
};

const UsersError = ({ error, reset, unstable_retry }: UsersErrorProps) => {
  return (
    <BoundaryErrorCard
      title="Could not load users"
      description="Something went wrong while loading admin users. Please try again."
      error={error}
      reset={reset}
      unstable_retry={unstable_retry}
      route="/admin/users"
      backHref="/admin"
      backLabel="Back to dashboard"
    />
  );
};

export default UsersError;
