import { buttonVariants } from "@/components/shadcnui/button";
import { toImagePath } from "@/lib/imageUrl";
import { ExternalLinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewOriginalButtonProps = {
  originalUrl: string | null;
  size?: "xs" | "sm" | "default";
};

const ViewOriginalButton = ({
  originalUrl,
  size = "sm",
}: ViewOriginalButtonProps) => {
  if (!originalUrl) {
    return null;
  }

  return (
    <a
      href={toImagePath(originalUrl) ?? originalUrl}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => event.stopPropagation()}
      className={cn(buttonVariants({ variant: "ghost", size }))}>
      <ExternalLinkIcon
        data-icon="inline-start"
        className="size-4"
      />
      View original
    </a>
  );
};

export default ViewOriginalButton;
