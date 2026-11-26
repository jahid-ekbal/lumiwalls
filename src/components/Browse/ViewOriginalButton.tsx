import { buttonVariants } from "@/components/shadcnui/button";
import { toImagePath } from "@/lib/imageUrl";
import { cn } from "@/lib/utils";
import { ExternalLinkIcon } from "lucide-react";

type ViewOriginalButtonProps = {
  originalUrl: string | null;
  size?: "xs" | "sm" | "default";
  className?: string;
};

const ViewOriginalButton = ({
  originalUrl,
  size = "sm",
  className,
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
      className={cn(buttonVariants({ variant: "ghost", size }), className)}>
      <ExternalLinkIcon
        data-icon="inline-start"
        className="size-4"
      />
      View original
    </a>
  );
};

export default ViewOriginalButton;
