"use client";

import BoundaryErrorCard from "@/components/Errors/BoundaryErrorCard";
import { usePathname } from "next/navigation";

type PrivateErrorProps = {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
};

const PrivateError = ({ error, reset, unstable_retry }: PrivateErrorProps) => {
  const pathname = usePathname() ?? "/browse";

  return (
    <BoundaryErrorCard
      title="Could not load this section"
      description="Something went wrong while loading this page. Please try again."
      error={error}
      reset={reset}
      unstable_retry={unstable_retry}
      route={pathname}
      backHref="/browse"
      backLabel="Back to browse"
    />
  );
};

export default PrivateError;
