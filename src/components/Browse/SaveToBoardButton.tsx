"use client";

import { Button, buttonVariants } from "@/components/shadcnui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcnui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcnui/dropdown-menu";
import { Field, FieldError, FieldLabel } from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import { cn } from "@/lib/utils";
import {
  personalBoardCreateSchema,
  type PersonalBoardCreateType,
} from "@/lib/zodSchema";
import {
  createPersonalBoard,
  toggleWallpaperInBoard,
} from "@/server/actions/boards";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BookmarkIcon,
  CheckIcon,
  FolderPlusIcon,
  Loader2Icon,
  PlusIcon,
} from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useGallerySync } from "./GallerySyncContext";

type SaveToBoardButtonProps = {
  wallpaperId: string;
  size?: "xs" | "sm" | "default";
  variant?: "ghost" | "outline" | "secondary" | "default";
  className?: string;
  label?: string;
};

const SaveToBoardButton = ({
  wallpaperId,
  size = "xs",
  variant = "secondary",
  className,
  label = "Save",
}: SaveToBoardButtonProps) => {
  const sync = useGallerySync();
  const [createOpen, setCreateOpen] = useState(false);
  const [busyBoardId, setBusyBoardId] = useState<string | null>(null);

  const boards = sync?.boards ?? [];
  const savedBoardIds = new Set(
    sync?.getState({ id: wallpaperId } as never).boardIds ?? [],
  );
  const savedCount = savedBoardIds.size;

  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = useForm<PersonalBoardCreateType>({
    resolver: zodResolver(personalBoardCreateSchema),
    defaultValues: { title: "", description: "", isPublicToMembers: true },
  });

  const handleToggle = async (boardId: string) => {
    if (busyBoardId) return;
    setBusyBoardId(boardId);
    const result = await toggleWallpaperInBoard({
      collectionId: boardId,
      wallpaperId,
    });
    setBusyBoardId(null);
    if (!result.success) {
      toast.error("Could not update board");
      return;
    }
    sync?.toggleBoardMembership(wallpaperId, boardId, result.saved);
    toast.success(result.saved ? "Saved to board" : "Removed from board");
  };

  const handleCreateAndSave = async (values: PersonalBoardCreateType) => {
    const created = await createPersonalBoard(values);
    if (!created.success) {
      toast.error("Could not create board");
      return;
    }
    sync?.addBoard({
      id: created.data.id,
      title: created.data.title,
      slug: created.data.slug,
      isPublicToMembers: created.data.isPublicToMembers,
      itemCount: 0,
    });
    const pinned = await toggleWallpaperInBoard({
      collectionId: created.data.id,
      wallpaperId,
    });
    if (pinned.success) {
      sync?.toggleBoardMembership(wallpaperId, created.data.id, pinned.saved);
    }
    toast.success(`Saved to ${created.data.title}`);
    reset();
    setCreateOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          onClick={(event) => event.stopPropagation()}
          className={cn(
            buttonVariants({
              variant: savedCount > 0 ? "default" : variant,
              size,
            }),
            className,
          )}>
          <BookmarkIcon
            data-icon="inline-start"
            className={cn("size-3.5", savedCount > 0 && "fill-current")}
          />
          <span>{savedCount > 0 ? `Saved (${savedCount})` : label}</span>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-60"
          onClick={(event) => event.stopPropagation()}>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Save to personal board</DropdownMenuLabel>
            {boards.length === 0 ?
              <div className="text-muted-foreground px-2 py-2 text-xs">
                No personal boards yet
              </div>
            : boards.map((board) => {
                const isSaved = savedBoardIds.has(board.id);
                const busy = busyBoardId === board.id;
                return (
                  <DropdownMenuItem
                    key={board.id}
                    disabled={busy}
                    onClick={() => void handleToggle(board.id)}
                    className="justify-between gap-2">
                    <span className="truncate">{board.title}</span>
                    {busy ?
                      <Loader2Icon className="size-3.5 shrink-0 animate-spin" />
                    : isSaved ?
                      <CheckIcon className="text-primary size-3.5 shrink-0" />
                    : <PlusIcon className="text-muted-foreground size-3.5 shrink-0" />
                    }
                  </DropdownMenuItem>
                );
              })
            }
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setCreateOpen(true)}>
            <FolderPlusIcon />
            Create new board
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={createOpen}
        onOpenChange={(next) => {
          if (!isSubmitting) setCreateOpen(next);
        }}>
        <DialogContent
          className="sm:max-w-md"
          onClick={(event) => event.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Create personal board</DialogTitle>
            <DialogDescription>
              Create a new board and pin this wallpaper into it.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleSubmit(handleCreateAndSave)}
            className="grid gap-4"
            noValidate>
            <Controller
              name="title"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="quick-board-title">Board name</FieldLabel>
                  <Input
                    {...field}
                    id="quick-board-title"
                    aria-invalid={fieldState.invalid}
                    placeholder="e.g. Ultrawide OLED, Minimalism"
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
                  <FieldLabel htmlFor="quick-board-desc">
                    Description (optional)
                  </FieldLabel>
                  <Input
                    {...field}
                    id="quick-board-desc"
                    aria-invalid={fieldState.invalid}
                    placeholder="Mood or resolution notes"
                  />
                  {fieldState.invalid ?
                    <FieldError errors={[fieldState.error]} />
                  : null}
                </Field>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}>
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
                    Create and save
                  </>
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SaveToBoardButton;
