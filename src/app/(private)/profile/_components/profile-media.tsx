"use client";

import { Button } from "@/components/shadcnui/button";
import { updateProfileImage } from "@/server/actions/profile";
import { CameraIcon, ImagePlusIcon, Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "react-toastify";

type ProfileMediaProps = {
  kind: "avatar" | "banner";
};

const ProfileMedia = ({ kind }: ProfileMediaProps) => {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setIsSaving(true);
    const formData = new FormData();
    formData.set("kind", kind);
    formData.set("file", file);
    const result = await updateProfileImage(formData);
    if (result.success) {
      toast.success(kind === "avatar" ? "Avatar updated" : "Banner updated");
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setIsSaving(false);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(event) => void onFileSelected(event)}
        aria-hidden={true}
      />
      {kind === "avatar" ?
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          className="rounded-full shadow-sm"
          aria-label="Change avatar"
          disabled={isSaving}
          onClick={() => inputRef.current?.click()}>
          {isSaving ?
            <Loader2Icon className="animate-spin" />
          : <CameraIcon />}
        </Button>
      : <Button
          type="button"
          variant="ghost"
          size="sm"
          className="bg-background/40 text-foreground hover:bg-background/70 backdrop-blur-sm"
          disabled={isSaving}
          onClick={() => inputRef.current?.click()}>
          {isSaving ?
            <Loader2Icon className="size-4 animate-spin" />
          : <ImagePlusIcon
              data-icon="inline-start"
              className="size-4"
            />
          }
          <span>Change banner</span>
        </Button>
      }
    </>
  );
};

export default ProfileMedia;
