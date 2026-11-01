"use client";

import { Button } from "@/components/shadcnui/button";
import { Link2Icon } from "lucide-react";
import { toast } from "react-toastify";

type CopyLinkButtonProps = {
  slug: string;
  size?: "xs" | "sm" | "default";
};

const CopyLinkButton = ({ slug, size = "sm" }: CopyLinkButtonProps) => {
  const handleCopy = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const url = `${window.location.origin}/browse?preview=${encodeURIComponent(slug)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      onClick={(event) => void handleCopy(event)}>
      <Link2Icon
        data-icon="inline-start"
        className="size-4"
      />
      Copy link
    </Button>
  );
};

export default CopyLinkButton;
