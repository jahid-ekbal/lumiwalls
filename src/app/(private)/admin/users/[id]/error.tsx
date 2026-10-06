"use client";

import BoundaryErrorCard from "@/components/Errors/BoundaryErrorCard";

type UserDetailErrorProps = {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
};

const UserDetailError = ({
  error,
  reset,
  unstable_retry,
}: UserDetailErrorProps) => {
  return (
    <BoundaryErrorCard
      title="Could not load user"
      description="Something went wrong while loading this account. Please try again."
      error={error}
      reset={reset}
      unstable_retry={unstable_retry}
      route="/admin/users/[id]"
      backHref="/admin/users"
      backLabel="Back to users"
    />
  );
};

export default UserDetailError;
