import EmptyState from "@/components/UI/EmptyState";
import { buttonVariants } from "@/components/shadcnui/button";
import { ImagesIcon, UploadIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

type UploadEmptyProps = {
  filtered: boolean;
};

const UploadEmpty = ({ filtered }: UploadEmptyProps) => {
  return (
    <EmptyState
      icon={ImagesIcon}
      title={filtered ? "No uploads match this status" : "No uploads yet"}
      description={
        filtered ?
          "Switch status tabs to inspect your other submissions."
        : "You have not uploaded any wallpapers yet. Share your first one."
      }
      action={
        <>
          {filtered ?
            <Link
              href={"/upload" as Route}
              className={buttonVariants({ variant: "outline", size: "sm" })}>
              <ImagesIcon data-icon="inline-start" />
              View all uploads
            </Link>
          : null}
          <Link
            href={"/upload/new" as Route}
            className={buttonVariants({ size: "sm" })}>
            <UploadIcon data-icon="inline-start" />
            Upload wallpaper
          </Link>
        </>
      }
    />
  );
};

export default UploadEmpty;
