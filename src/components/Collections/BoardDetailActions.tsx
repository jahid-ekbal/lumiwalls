"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shadcnui/alert-dialog";
import { Button } from "@/components/shadcnui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcnui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import { Switch } from "@/components/shadcnui/switch";
import { Textarea } from "@/components/shadcnui/textarea";
import {
  personalBoardUpdateSchema,
  type PersonalBoardUpdateType,
} from "@/lib/zodSchema";
import {
  deletePersonalBoard,
  updatePersonalBoard,
} from "@/server/actions/boards";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckIcon,
  Loader2Icon,
  Share2Icon,
  SquarePenIcon,
  Trash2Icon,
} from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";

type BoardDetailActionsProps = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  isPublicToMembers: boolean;
  canEditBoard: boolean;
};

const BoardDetailActions = ({
  id,
  title,
  slug,
  description,
  isPublicToMembers,
  canEditBoard,
}: BoardDetailActionsProps) => {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<PersonalBoardUpdateType>({
    resolver: zodResolver(personalBoardUpdateSchema),
    defaultValues: {
      id,
      title,
      description: description ?? "",
      isPublicToMembers,
    },
    mode: "onTouched",
  });

  const handleShare = async () => {
    const url = `${window.location.origin}/collections/${encodeURIComponent(slug)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Collection link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleEdit = async (values: PersonalBoardUpdateType) => {
    const res = await updatePersonalBoard(values);
    if (!res.success) {
      toast.error("Could not update board");
      return;
    }
    toast.success("Board updated");
    setEditOpen(false);
    router.refresh();
  };

  const handleDelete = async () => {
    setDeleting(true);
    const res = await deletePersonalBoard({ id });
    setDeleting(false);
    if (!res.success) {
      toast.error("Could not delete board");
      return;
    }
    toast.success("Board deleted");
    router.replace("/collections?tab=mine" as Route);
    router.refresh();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => void handleShare()}>
        <Share2Icon data-icon="inline-start" />
        Share
      </Button>
      {canEditBoard ?
        <>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setEditOpen(true)}>
            <SquarePenIcon data-icon="inline-start" />
            Edit board
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}>
            <Trash2Icon data-icon="inline-start" />
            Delete board
          </Button>
        </>
      : null}

      <Dialog
        open={editOpen}
        onOpenChange={(next) => {
          if (!isSubmitting) setEditOpen(next);
        }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit board</DialogTitle>
            <DialogDescription>
              Update board name, description, and member visibility.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleSubmit(handleEdit)}
            className="grid gap-4"
            noValidate>
            <Controller
              name="title"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-board-title">Board name</FieldLabel>
                  <Input
                    {...field}
                    id="edit-board-title"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ?
                    <FieldError errors={[fieldState.error]} />
                  : null}
                </Field>
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-board-desc">Description</FieldLabel>
                  <Textarea
                    {...field}
                    id="edit-board-desc"
                    rows={3}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ?
                    <FieldError errors={[fieldState.error]} />
                  : null}
                </Field>
              )}
            />
            <Controller
              name="isPublicToMembers"
              control={control}
              render={({ field }) => (
                <div className="border-border/60 rounded-inset flex items-center justify-between gap-3 border p-3">
                  <div className="grid gap-0.5">
                    <span className="text-sm font-medium">
                      Visible to members
                    </span>
                    <span className="text-caption text-muted-foreground">
                      Show on your creator profile to signed-in members
                    </span>
                  </div>
                  <Switch
                    checked={field.value ?? true}
                    onCheckedChange={(checked) => field.onChange(checked)}
                    aria-label="Visible to members"
                  />
                </div>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}>
                {isSubmitting ?
                  <>
                    <Loader2Icon
                      data-icon="inline-start"
                      className="animate-spin"
                    />
                    Saving...
                  </>
                : <>
                    <CheckIcon data-icon="inline-start" />
                    Save changes
                  </>
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(next) => {
          if (!deleting) setDeleteOpen(next);
        }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete board?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the board &ldquo;{title}&rdquo;. Wallpapers inside it
              stay in the gallery.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={() => void handleDelete()}>
              {deleting ?
                <Loader2Icon
                  data-icon="inline-start"
                  className="animate-spin"
                />
              : <Trash2Icon data-icon="inline-start" />}
              Delete board
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BoardDetailActions;
