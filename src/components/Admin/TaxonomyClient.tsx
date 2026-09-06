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
import { Textarea } from "@/components/shadcnui/textarea";
import {
  categoryCreateSchema,
  categoryUpdateSchema,
  tagCreateSchema,
  tagUpdateSchema,
  type CategoryCreateType,
  type TagCreateType,
} from "@/lib/zodSchema";
import { slugify } from "@/lib/slugify";
import {
  createCategory,
  createTag,
  deleteCategory,
  deleteTag,
  updateCategory,
  updateTag,
} from "@/server/actions/taxonomy";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  icons,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  TagsIcon,
  TrashIcon,
  FolderIcon,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "react-toastify";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  _count: { wallpapers: number };
};

type TagRow = {
  id: string;
  name: string;
  slug: string;
  _count: { wallpapers: number };
};

type Props = {
  categories: CategoryRow[];
  tags: TagRow[];
};

const TaxonomyClient = ({ categories, tags }: Props) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"categories" | "tags">(
    "categories",
  );

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(
    null,
  );
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);

  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagRow | null>(null);
  const [deleteTagId, setDeleteTagId] = useState<string | null>(null);

  const categoryForm = useForm<CategoryCreateType>({
    resolver: zodResolver(categoryCreateSchema),
    defaultValues: { name: "", slug: "", description: "", icon: "", color: "" },
    mode: "all",
  });

  const tagForm = useForm<TagCreateType>({
    resolver: zodResolver(tagCreateSchema),
    defaultValues: { name: "", slug: "" },
    mode: "all",
  });

  const categoryNameValue = useWatch({
    control: categoryForm.control,
    name: "name",
  });
  const tagNameValue = useWatch({ control: tagForm.control, name: "name" });
  const categoryDerivedSlug = slugify(categoryNameValue ?? "");
  const tagDerivedSlug = slugify(tagNameValue ?? "");
  const categorySlugField =
    useWatch({ control: categoryForm.control, name: "slug" }) ?? "";
  const tagSlugField =
    useWatch({ control: tagForm.control, name: "slug" }) ?? "";

  const categoryIconValue = useWatch({
    control: categoryForm.control,
    name: "icon",
  });
  const trimmedIconName = categoryIconValue?.trim() ?? "";
  const IconPreview =
    trimmedIconName ?
      (icons as Record<string, LucideIcon | undefined>)[trimmedIconName]
    : undefined;

  const categoryToDelete =
    categories.find((cat) => cat.id === deleteCategoryId) ?? null;
  const tagToDelete = tags.find((tag) => tag.id === deleteTagId) ?? null;

  useEffect(() => {
    if (editingCategory) return;
    categoryForm.setValue("slug", categoryDerivedSlug, {
      shouldValidate: true,
    });
  }, [categoryForm, categoryDerivedSlug, editingCategory]);

  useEffect(() => {
    if (editingTag) return;
    tagForm.setValue("slug", tagDerivedSlug, {
      shouldValidate: true,
    });
  }, [tagForm, tagDerivedSlug, editingTag]);

  const openCreateCategory = () => {
    setEditingCategory(null);
    categoryForm.reset({
      name: "",
      slug: "",
      description: "",
      icon: "",
      color: "",
    });
    setCategoryDialogOpen(true);
  };

  const openEditCategory = (cat: CategoryRow) => {
    setEditingCategory(cat);
    categoryForm.reset({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? "",
      icon: cat.icon ?? "",
      color: cat.color ?? "",
    });
    setCategoryDialogOpen(true);
  };

  const handleCategorySubmit = async (data: CategoryCreateType) => {
    const effectiveSlug =
      data.slug?.trim() ? data.slug.trim() : slugify(data.name);
    if (!effectiveSlug) {
      toast.error("Name must contain letters or numbers to generate a slug");
      return;
    }
    const payload =
      editingCategory ?
        { id: editingCategory.id, ...data, slug: effectiveSlug }
      : { ...data, slug: effectiveSlug };
    const schema =
      editingCategory ? categoryUpdateSchema : categoryCreateSchema;
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      toast.error("Validation failed");
      return;
    }

    const action = editingCategory ? updateCategory : createCategory;
    const result = await action(payload);
    if (!result.success) {
      const msg =
        result.error === "NAME_EXISTS" ? "Name already exists"
        : result.error === "SLUG_EXISTS" ? "Slug already exists"
        : result.error === "INVALID_ICON" ? "Unknown lucide icon name"
        : result.error === "VALIDATION_ERROR" ? "Validation failed"
        : result.error;
      toast.error(msg);
      return;
    }
    toast.success(editingCategory ? "Category updated" : "Category created");
    setCategoryDialogOpen(false);
    setEditingCategory(null);
    router.refresh();
  };

  const handleDeleteCategory = async () => {
    if (!deleteCategoryId) return;
    const result = await deleteCategory(deleteCategoryId);
    if (!result.success) {
      toast.error(result.error || "Failed to delete");
      return;
    }
    toast.success("Category deleted, wallpapers unset");
    setDeleteCategoryId(null);
    router.refresh();
  };

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
            Taxonomy
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage categories and tags for wallpapers. Changes reflect in the
            upload page.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeTab === "categories" ? "default" : "outline"}
            onClick={() => setActiveTab("categories")}>
            <FolderIcon />
            Categories ({categories.length})
          </Button>
          <Button
            variant={activeTab === "tags" ? "default" : "outline"}
            onClick={() => setActiveTab("tags")}>
            <TagsIcon />
            Tags ({tags.length})
          </Button>
        </div>
      </div>

      {activeTab === "categories" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderIcon className="size-4" />
                Categories
              </CardTitle>
              <CardDescription>
                Organize wallpapers into browsable categories
              </CardDescription>
            </div>
            <Button onClick={openCreateCategory}>
              <PlusIcon />
              Add Category
            </Button>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ?
              <Alert>
                <AlertTitle>No categories yet</AlertTitle>
                <AlertDescription>
                  Create categories here first, then they will be available in
                  the upload form.
                </AlertDescription>
              </Alert>
            : <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Wallpapers</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {cat.color && (
                            <span
                              className="size-3 rounded-full border"
                              style={{ backgroundColor: cat.color }}
                            />
                          )}
                          <span className="font-medium">{cat.name}</span>
                          {cat.icon && (
                            <Badge variant="outline">{cat.icon}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {cat.slug}
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate text-xs">
                        {cat.description ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {cat._count.wallpapers}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => openEditCategory(cat)}
                            aria-label={`Edit ${cat.name}`}>
                            <PencilIcon />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => setDeleteCategoryId(cat.id)}
                            aria-label={`Delete ${cat.name}`}>
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
      )}

      {activeTab === "tags" && (
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
                        <Badge variant="secondary">
                          {tag._count.wallpapers}
                        </Badge>
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
      )}

      {/* Category dialog */}
      <Dialog
        open={categoryDialogOpen}
        onOpenChange={(open) => {
          setCategoryDialogOpen(open);
          if (!open) setEditingCategory(null);
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Add Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory ?
                "Update category details"
              : "Create a new wallpaper category"}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={categoryForm.handleSubmit(handleCategorySubmit)}
            className="grid gap-4"
            noValidate>
            <Controller
              name="name"
              control={categoryForm.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder="Nature"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Field>
              <FieldLabel htmlFor="category-slug-preview">
                Slug (auto-generated)
              </FieldLabel>
              <Input
                id="category-slug-preview"
                value={
                  editingCategory ? categorySlugField : categoryDerivedSlug
                }
                readOnly
                disabled
                placeholder="auto from name"
              />
              <FieldDescription>
                {editingCategory ?
                  "Saved slug; a rename updates it only when untouched"
                : "Generated automatically from name"}
              </FieldDescription>
            </Field>
            <Controller
              name="description"
              control={categoryForm.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                  <Textarea
                    {...field}
                    id={field.name}
                    placeholder="Landscapes, forests, oceans"
                    rows={2}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="icon"
                control={categoryForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Icon (lucide name)
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      placeholder="Leaf"
                      aria-invalid={fieldState.invalid}
                    />
                    {trimmedIconName !== "" &&
                      (IconPreview ?
                        <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                          <IconPreview className="size-4" />
                          {trimmedIconName}
                        </span>
                      : <span className="text-destructive text-xs">
                          Unknown icon name
                        </span>)}
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="color"
                control={categoryForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Color</FieldLabel>
                    <div className="flex gap-2">
                      <Input
                        {...field}
                        id={field.name}
                        placeholder="#22C55E"
                        aria-invalid={fieldState.invalid}
                      />
                      <input
                        type="color"
                        value={
                          field.value && /^#[0-9A-Fa-f]{6}$/.test(field.value) ?
                            field.value
                          : "#000000"
                        }
                        onChange={(e) => field.onChange(e.target.value)}
                        className="h-9 w-9 cursor-pointer rounded-md border bg-transparent p-1"
                        aria-label="Color picker"
                      />
                    </div>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCategoryDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={categoryForm.formState.isSubmitting}>
                {categoryForm.formState.isSubmitting ?
                  <>
                    <Loader2Icon className="animate-spin" /> Saving...
                  </>
                : editingCategory ?
                  "Update"
                : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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

      {/* Delete category confirm */}
      <Dialog
        open={!!deleteCategoryId}
        onOpenChange={(open) => !open && setDeleteCategoryId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete category</DialogTitle>
            <DialogDescription>
              {categoryToDelete ?
                `"${categoryToDelete.name}" has ${categoryToDelete._count.wallpapers} ${categoryToDelete._count.wallpapers === 1 ? "wallpaper" : "wallpapers"}. They will become uncategorized. This cannot be undone.`
              : "Wallpapers in this category will become uncategorized. This cannot be undone."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteCategoryId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCategory}>
              Delete
            </Button>
          </div>
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

export default TaxonomyClient;
