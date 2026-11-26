"use client";

import { Button } from "@/components/shadcnui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcnui/dialog";
import { authClient } from "@/lib/auth-client";
import { formatBytes } from "@/lib/format";
import { ALLOWED_MIME_TYPES, MAX_UPLOAD_SIZE } from "@/lib/zodSchema";
import {
  removeProfileImage,
  updateProfileImage,
} from "@/server/actions/profile";
import {
  CameraIcon,
  CheckIcon,
  ImagePlusIcon,
  Loader2Icon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

type ProfileMediaProps = {
  kind: "avatar" | "banner";
  hasImage?: boolean;
};

const ProfileMedia = ({ kind, hasImage = false }: ProfileMediaProps) => {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const clearSelection = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPendingFile(null);
  };

  const onFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    if (
      !ALLOWED_MIME_TYPES.includes(
        file.type as (typeof ALLOWED_MIME_TYPES)[number],
      )
    ) {
      toast.error("Only JPEG, PNG, WebP, or AVIF images are supported.");
      return;
    }
    if (file.size < 1 || file.size > MAX_UPLOAD_SIZE) {
      toast.error("Image must be between 1 byte and 50 MB.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleConfirmUpload = async () => {
    if (!pendingFile) return;
    setIsSaving(true);
    const formData = new FormData();
    formData.set("kind", kind);
    formData.set("file", pendingFile);
    const result = await updateProfileImage(formData);
    if (result.success) {
      await authClient.getSession({ query: { disableCookieCache: true } });
      toast.success(kind === "avatar" ? "Avatar updated" : "Banner updated");
      clearSelection();
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setIsSaving(false);
  };

  const handleRemove = async () => {
    setIsSaving(true);
    const result = await removeProfileImage({ kind });
    if (result.success) {
      await authClient.getSession({ query: { disableCookieCache: true } });
      toast.success(kind === "avatar" ? "Avatar removed" : "Banner removed");
      clearSelection();
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
        onChange={onFileSelected}
        aria-hidden={true}
      />

      {kind === "avatar" ?
        <div className="flex items-center gap-1">
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
          {hasImage ?
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              className="rounded-full shadow-sm"
              aria-label="Remove avatar"
              disabled={isSaving}
              onClick={() => void handleRemove()}>
              <Trash2Icon className="size-3.5" />
            </Button>
          : null}
        </div>
      : <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="border border-white/15 bg-neutral-950/75 text-white backdrop-blur-sm hover:bg-neutral-900/90 hover:text-white"
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
          {hasImage ?
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="border border-white/15 bg-neutral-950/75 text-white backdrop-blur-sm hover:bg-neutral-900/90 hover:text-white"
              aria-label="Remove banner"
              disabled={isSaving}
              onClick={() => void handleRemove()}>
              <Trash2Icon
                data-icon="inline-start"
                className="size-4"
              />
              <span className="hidden sm:inline">Remove</span>
            </Button>
          : null}
        </div>
      }

      <Dialog
        open={Boolean(pendingFile && previewUrl)}
        onOpenChange={(next) => {
          if (!next && !isSaving) {
            clearSelection();
          }
        }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {kind === "avatar" ? "Preview avatar" : "Preview banner"}
            </DialogTitle>
            <DialogDescription>
              {pendingFile ?
                `${pendingFile.name} (${formatBytes(pendingFile.size)}). Processed automatically into WebP.`
              : ""}
            </DialogDescription>
          </DialogHeader>

          {previewUrl ?
            <div className="border-border/70 bg-muted/40 flex items-center justify-center overflow-hidden rounded-inset border p-4">
              {kind === "avatar" ?
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={previewUrl}
                  alt="Avatar framing preview"
                  className="size-40 rounded-full object-cover shadow-md"
                />
              : /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={previewUrl}
                  alt="Banner framing preview"
                  className="aspect-16/5 w-full rounded-lg object-cover"
                />
              }
            </div>
          : null}

          <DialogFooter>
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                />
              }>
              <XIcon data-icon="inline-start" />
              Cancel
            </DialogClose>
            <Button
              type="button"
              disabled={isSaving}
              onClick={() => void handleConfirmUpload()}>
              {isSaving ?
                <>
                  <Loader2Icon
                    data-icon="inline-start"
                    className="animate-spin"
                  />
                  Uploading
                </>
              : <>
                  <CheckIcon data-icon="inline-start" />
                  Save image
                </>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfileMedia;
