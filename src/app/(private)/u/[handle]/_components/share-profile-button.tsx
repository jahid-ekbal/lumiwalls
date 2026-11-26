"use client";

import { Button } from "@/components/shadcnui/button";
import { CheckIcon, Share2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

type ShareProfileButtonProps = {
  handle: string;
};

const ShareProfileButton = ({ handle }: ShareProfileButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/u/${encodeURIComponent(handle)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Profile link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy profile link");
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => void handleShare()}>
      {copied ?
        <CheckIcon data-icon="inline-start" />
      : <Share2Icon data-icon="inline-start" />}
      {copied ? "Copied" : "Share"}
    </Button>
  );
};

export default ShareProfileButton;
