"use client";

import { Button } from "@/components/shadcnui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcnui/dialog";
import { deleteOwnWallpaper } from "@/server/actions/upload";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

type DeleteUploadDialogProps = {
  wallpaperId: string;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const DeleteUploadDialog = ({
  wallpaperId,
  title,
  open,
  onOpenChange,
}: DeleteUploadDialogProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteOwnWallpaper({ wallpaperId });
    setIsDeleting(false);

    if (!result.success) {
      toast.error(
        result.error === "FORBIDDEN" ?
          "You do not have permission to delete this wallpaper"
        : result.error === "NOT_FOUND" ? "Wallpaper not found"
        : "Failed to delete wallpaper",
      );
      return;
    }

    toast.success(`"${title}" was deleted`);
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete wallpaper</DialogTitle>
          <DialogDescription>
            {`"${title}" and its files will be permanently deleted. It will also disappear from favorites and collections. This cannot be undone.`}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={isDeleting}
            onClick={() => void handleDelete()}>
            {isDeleting ?
              <Loader2Icon
                data-icon="inline-start"
                className="animate-spin"
              />
            : <Trash2Icon
                data-icon="inline-start"
                className="size-4"
              />
            }
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteUploadDialog;
