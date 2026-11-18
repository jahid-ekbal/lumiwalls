"use client";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/shadcnui/alert";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcnui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcnui/table";
import {
  tagCreateSchema,
  tagUpdateSchema,
  type TagCreateType,
} from "@/lib/zodSchema";
import { slugify } from "@/lib/slugify";
import { createTag, deleteTag, updateTag } from "@/server/actions/tags";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  TagsIcon,
  TrashIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "react-toastify";

type TagRow = {
  id: string;
  name: string;
  slug: string;
  _count: { wallpapers: number };
};

type Props = {
  tags: TagRow[];
};

const TagClient = ({ tags }: Props) => {
  const router = useRouter();

  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagRow | null>(null);
  const [deleteTagId, setDeleteTagId] = useState<string | null>(null);

  const tagForm = useForm<TagCreateType>({
    resolver: zodResolver(tagCreateSchema),
    defaultValues: { name: "", slug: "" },
    mode: "all",
  });

  const tagNameValue = useWatch({ control: tagForm.control, name: "name" });
  const tagDerivedSlug = slugify(tagNameValue ?? "");
  const tagSlugField =
    useWatch({ control: tagForm.control, name: "slug" }) ?? "";

  const tagToDelete = tags.find((tag) => tag.id === deleteTagId) ?? null;

  useEffect(() => {
    if (editingTag) return;
    tagForm.setValue("slug", tagDerivedSlug, {
      shouldValidate: true,
    });
  }, [tagForm, tagDerivedSlug, editingTag]);

  const openCreateTag = () => {
    setEditingTag(null);
    tagForm.reset({ name: "", slug: "" });
    setTagDialogOpen(true);
  };

  const openEditTag = (tag: TagRow) => {
    setEditingTag(tag);
    tagForm.reset({ name: tag.name, slug: tag.slug });
    setTagDialogOpen(true);
  };

  const handleTagSubmit = async (data: TagCreateType) => {
    const effectiveSlug =
      data.slug?.trim() ? data.slug.trim() : slugify(data.name);
    if (!effectiveSlug) {
      toast.error("Name must contain letters or numbers to generate a slug");
      return;
    }
    const payload =
      editingTag ?
        { id: editingTag.id, ...data, slug: effectiveSlug }
      : { ...data, slug: effectiveSlug };
    const schema = editingTag ? tagUpdateSchema : tagCreateSchema;
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      toast.error("Validation failed");
      return;
    }
    const action = editingTag ? updateTag : createTag;
    const result = await action(payload);
    if (!result.success) {
      const msg =
        result.error === "NAME_EXISTS" ? "Name already exists"
        : result.error === "SLUG_EXISTS" ? "Slug already exists"
        : result.error === "VALIDATION_ERROR" ? "Validation failed"
        : result.error;
      toast.error(msg);
      return;
    }
    toast.success(editingTag ? "Tag updated" : "Tag created");
    setTagDialogOpen(false);
    setEditingTag(null);
    router.refresh();
  };

  const handleDeleteTag = async () => {
    if (!deleteTagId) return;
    const result = await deleteTag(deleteTagId);
    if (!result.success) {
      toast.error(result.error || "Failed to delete");
      return;
    }
    toast.success("Tag deleted");
    setDeleteTagId(null);
    router.refresh();
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Tags
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage tags for wallpapers. Changes reflect in the upload page.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TagsIcon className="size-4" />
              Tags
            </CardTitle>
            <CardDescription>
              Tags users can select during upload (max 10 per wallpaper)
            </CardDescription>
          </div>
          <Button onClick={openCreateTag}>
            <PlusIcon />
            Add Tag
          </Button>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ?
            <Alert>
              <AlertTitle>No tags yet</AlertTitle>
              <AlertDescription>
                Create tags here first, then they will be available in the
                upload form.
              </AlertDescription>
            </Alert>
          : <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Wallpapers</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell className="font-medium">{tag.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {tag.slug}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{tag._count.wallpapers}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => openEditTag(tag)}
                          aria-label={`Edit ${tag.name}`}>
                          <PencilIcon />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => setDeleteTagId(tag.id)}
                          aria-label={`Delete ${tag.name}`}>
                          <TrashIcon className="text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          }
        </CardContent>
      </Card>

      {/* Tag dialog */}
      <Dialog
        open={tagDialogOpen}
        onOpenChange={(open) => {
          setTagDialogOpen(open);
          if (!open) setEditingTag(null);
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTag ? "Edit Tag" : "Add Tag"}</DialogTitle>
            <DialogDescription>
              {editingTag ? "Update tag details" : "Create a new tag"}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={tagForm.handleSubmit(handleTagSubmit)}
            className="grid gap-4"
            noValidate>
            <Controller
              name="name"
              control={tagForm.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder="sunset"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>Stored in lowercase</FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Field>
              <FieldLabel htmlFor="tag-slug-preview">
                Slug (auto-generated)
              </FieldLabel>
              <Input
                id="tag-slug-preview"
                value={editingTag ? tagSlugField : tagDerivedSlug}
                readOnly
                disabled
                placeholder="auto from name"
              />
              <FieldDescription>
                {editingTag ?
                  "Saved slug; a rename updates it only when untouched"
                : "Generated automatically from name"}
              </FieldDescription>
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTagDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={tagForm.formState.isSubmitting}>
                {tagForm.formState.isSubmitting ?
                  <>
                    <Loader2Icon className="animate-spin" /> Saving...
                  </>
                : editingTag ?
                  "Update"
                : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete tag confirm */}
      <Dialog
        open={!!deleteTagId}
        onOpenChange={(open) => !open && setDeleteTagId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete tag</DialogTitle>
            <DialogDescription>
              {tagToDelete ?
                `"${tagToDelete.name}" is used by ${tagToDelete._count.wallpapers} ${tagToDelete._count.wallpapers === 1 ? "wallpaper" : "wallpapers"}. It will be removed from all wallpapers. This cannot be undone.`
              : "This tag will be removed from all wallpapers. This cannot be undone."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTagId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTag}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TagClient;
