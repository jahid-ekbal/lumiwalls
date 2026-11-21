import { buttonVariants } from "@/components/shadcnui/button";
import { Card, CardContent } from "@/components/shadcnui/card";
import { ImagesIcon, UploadIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

type UploadEmptyProps = {
  filtered: boolean;
};

const UploadEmpty = ({ filtered }: UploadEmptyProps) => {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <ImagesIcon className="text-muted-foreground size-10" />
        <p className="text-muted-foreground max-w-sm text-sm">
          {filtered ?
            "No uploads match this status. Try another filter."
          : "You have not uploaded anything yet. Share your first wallpaper."}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {filtered ?
            <Link
              href={"/upload" as Route}
              className={buttonVariants({ variant: "outline", size: "sm" })}>
              <ImagesIcon
                data-icon="inline-start"
                className="size-4"
              />
              View all uploads
            </Link>
          : null}
          <Link
            href={"/upload/new" as Route}
            className={buttonVariants({ size: "sm" })}>
            <UploadIcon
              data-icon="inline-start"
              className="size-4"
            />
            Upload wallpaper
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default UploadEmpty;
