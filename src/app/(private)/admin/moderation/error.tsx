"use client";

import BoundaryErrorCard from "@/components/Errors/BoundaryErrorCard";

type ModerationErrorProps = {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
};

const ModerationError = ({
  error,
  reset,
  unstable_retry,
}: ModerationErrorProps) => {
  return (
    <BoundaryErrorCard
      title="Could not load moderation"
      description="Something went wrong while loading the moderation queue. Please try again."
      error={error}
      reset={reset}
      unstable_retry={unstable_retry}
      route="/admin/moderation"
      backHref="/admin"
      backLabel="Back to dashboard"
    />
  );
};

export default ModerationError;
