"use client";

import EmptyState from "@/components/UI/EmptyState";
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
  categoryCreateSchema,
  categoryUpdateSchema,
  type CategoryCreateType,
} from "@/lib/zodSchema";
import { slugify } from "@/lib/slugify";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/server/actions/categories";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  icons,
  FolderIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
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
  icon: string | null;
  color: string | null;
  _count: { wallpapers: number };
};

type Props = {
  categories: CategoryRow[];
};

const CategoryClient = ({ categories }: Props) => {
  const router = useRouter();

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(
    null,
  );
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);

  const categoryForm = useForm<CategoryCreateType>({
    resolver: zodResolver(categoryCreateSchema),
    defaultValues: { name: "", slug: "", icon: "", color: "" },
    mode: "all",
  });

  const categoryNameValue = useWatch({
    control: categoryForm.control,
    name: "name",
  });
  const categoryDerivedSlug = slugify(categoryNameValue ?? "");
  const categorySlugField =
    useWatch({ control: categoryForm.control, name: "slug" }) ?? "";

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

  useEffect(() => {
    if (editingCategory) return;
    categoryForm.setValue("slug", categoryDerivedSlug, {
      shouldValidate: true,
    });
  }, [categoryForm, categoryDerivedSlug, editingCategory]);

  const openCreateCategory = () => {
    setEditingCategory(null);
    categoryForm.reset({
      name: "",
      slug: "",
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

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FolderIcon className="size-4" />
              All categories ({categories.length})
            </CardTitle>
            <CardDescription>
              Organize wallpapers into browsable categories
            </CardDescription>
          </div>
          <Button onClick={openCreateCategory}>
            <PlusIcon data-icon="inline-start" />
            Add Category
          </Button>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ?
            <EmptyState
              compact={true}
              icon={FolderIcon}
              title="No categories yet"
              description="Create categories here first so uploaders can classify wallpapers."
              action={
                <Button
                  size="sm"
                  onClick={openCreateCategory}>
                  <PlusIcon data-icon="inline-start" />
                  Add Category
                </Button>
              }
            />
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
                    <TableCell>
                      <Badge variant="secondary">{cat._count.wallpapers}</Badge>
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
    </div>
  );
};

export default CategoryClient;
