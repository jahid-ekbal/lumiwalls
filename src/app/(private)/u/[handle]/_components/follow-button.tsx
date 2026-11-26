"use client";

import { Button } from "@/components/shadcnui/button";
import { toggleFollow } from "@/server/actions/profile";
import { Loader2Icon, UserMinusIcon, UserPlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

type FollowButtonProps = {
  handle: string;
  following: boolean;
};

const FollowButton = ({ handle, following }: FollowButtonProps) => {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(following);
  const [isPending, setIsPending] = useState(false);

  const onToggle = async () => {
    if (isPending) {
      return;
    }
    setIsPending(true);
    const result = await toggleFollow({ handle });
    if (result.success) {
      setIsFollowing(result.following);
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setIsPending(false);
  };

  return (
    <Button
      type="button"
      variant={isFollowing ? "secondary" : "default"}
      disabled={isPending}
      onClick={() => void onToggle()}>
      {isPending ?
        <Loader2Icon className="animate-spin" />
      : isFollowing ?
        <UserMinusIcon
          data-icon="inline-start"
          className="size-4"
        />
      : <UserPlusIcon
          data-icon="inline-start"
          className="size-4"
        />
      }
      <span>{isFollowing ? "Following" : "Follow"}</span>
    </Button>
  );
};

export default FollowButton;
