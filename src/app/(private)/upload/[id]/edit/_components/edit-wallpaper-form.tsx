"use client";

import TagSelector from "@/components/Upload/TagSelector";
import { Button } from "@/components/shadcnui/button";
import { Field, FieldError, FieldLabel } from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcnui/select";
import { Textarea } from "@/components/shadcnui/textarea";
import { updateWallpaperMetadata } from "@/server/actions/upload";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, SaveIcon } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import z from "zod";

const editWallpaperFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { error: "Title must be at least 3 characters" })
    .max(120, { error: "Title must not exceed 120 characters" }),
  description: z
    .string()
    .trim()
    .max(500, { error: "Description must not exceed 500 characters" })
    .optional()
    .or(z.literal("")),
  categoryId: z.string().min(1, { error: "Please select a category" }),
});

type EditWallpaperFormType = z.infer<typeof editWallpaperFormSchema>;

type EditWallpaperFormProps = {
  wallpaperId: string;
  initialTitle: string;
  initialDescription: string;
  initialCategoryId: string;
  initialTagIds: string[];
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
};

const EditWallpaperForm = ({
  wallpaperId,
  initialTitle,
  initialDescription,
  initialCategoryId,
  initialTagIds,
  categories,
  tags,
}: EditWallpaperFormProps) => {
  const router = useRouter();
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialTagIds);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<EditWallpaperFormType>({
    resolver: zodResolver(editWallpaperFormSchema),
    defaultValues: {
      title: initialTitle,
      description: initialDescription,
      categoryId: initialCategoryId,
    },
    mode: "all",
  });

  const categoryItems = useMemo(
    () =>
      categories.map((category) => ({
        value: category.id,
        label: category.name,
      })),
    [categories],
  );

  const hasCategories = categories.length > 0;

  const editHandler = async (data: EditWallpaperFormType) => {
    const result = await updateWallpaperMetadata({
      wallpaperId,
      title: data.title,
      description: data.description,
      categoryId: data.categoryId,
      tagIds: selectedTagIds,
    });

    if (!result.success) {
      toast.error(
        result.error === "FORBIDDEN" ?
          "You do not have permission to edit this wallpaper"
        : result.error === "NOT_FOUND" ? "Wallpaper not found"
        : result.error === "INVALID_CATEGORY" ? "That category no longer exists"
        : result.error === "INVALID_TAG" ?
          "One of the selected tags no longer exists"
        : result.error === "VALIDATION_ERROR" ? "Check the form and try again"
        : "Failed to save changes",
      );
      return;
    }

    toast.success("Wallpaper updated");
    router.push("/upload" as Route);
  };

  return (
    <form
      onSubmit={handleSubmit(editHandler)}
      className="grid gap-6"
      noValidate>
      <Controller
        name="title"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Title</FieldLabel>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="Enter wallpaper title"
              autoComplete="off"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="description"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Description</FieldLabel>
            <Textarea
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="Describe your wallpaper (optional)"
              rows={3}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="categoryId"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Category</FieldLabel>
            <Select
              value={field.value}
              items={categoryItems}
              onValueChange={field.onChange}>
              <SelectTrigger
                id={field.name}
                aria-invalid={fieldState.invalid}
                disabled={!hasCategories}
                className="w-full">
                <SelectValue
                  placeholder={
                    hasCategories ? "Select a category" : (
                      "No categories available"
                    )
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {hasCategories ?
                  categories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))
                : <SelectItem
                    value="__empty"
                    disabled>
                    No categories available
                  </SelectItem>
                }
              </SelectContent>
            </Select>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <TagSelector
        tags={tags}
        selectedTagIds={selectedTagIds}
        onSelectedChange={setSelectedTagIds}
      />

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || !hasCategories}>
        {isSubmitting ?
          <>
            <Loader2Icon
              data-icon="inline-start"
              className="animate-spin"
            />
            Saving...
          </>
        : <>
            <SaveIcon
              data-icon="inline-start"
              className="size-4"
            />
            Save changes
          </>
        }
      </Button>
    </form>
  );
};

export default EditWallpaperForm;
