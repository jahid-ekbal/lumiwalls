"use client";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/shadcnui/alert";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import { Checkbox } from "@/components/shadcnui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import { Progress } from "@/components/shadcnui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcnui/select";
import { Textarea } from "@/components/shadcnui/textarea";
import { ALLOWED_MIME_TYPES, MAX_UPLOAD_SIZE } from "@/lib/zodSchema";
import { finalizeUpload, initiateUpload } from "@/server/actions/upload";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ImageIcon,
  Loader2Icon,
  SearchIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import z from "zod";

const uploadFormClientSchema = z.object({
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

type UploadFormClientType = z.infer<typeof uploadFormClientSchema>;

type UploadStage =
  "idle" | "initiating" | "uploading" | "processing" | "done" | "error";

type UploadFormProps = {
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

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const getAspectRatioLabel = (width: number, height: number): string => {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  const w = Math.round(width / divisor);
  const h = Math.round(height / divisor);
  if (w <= 32 && h <= 32) return `${w}:${h}`;
  return `${(width / height).toFixed(2)}:1`;
};

const UploadForm = ({ categories, tags: availableTags }: UploadFormProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [stage, setStage] = useState<UploadStage>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = useForm<UploadFormClientType>({
    resolver: zodResolver(uploadFormClientSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
    },
    mode: "all",
  });

  const clearPreviewUrl = useCallback((url: string | null) => {
    if (url) URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!previewUrl) return;
    const img = new window.Image();
    img.onload = () => {
      setDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = () => setDimensions(null);
    img.src = previewUrl;
  }, [previewUrl]);

  const validateAndSetFile = useCallback(
    (file: File): boolean => {
      const isAllowedType = (ALLOWED_MIME_TYPES as readonly string[]).includes(
        file.type,
      );

      if (!isAllowedType) {
        const msg = `Invalid file type: ${file.type || "unknown"}. Allowed: JPEG, PNG, WebP, AVIF`;
        setErrorMsg(msg);
        toast.error(msg);
        return false;
      }

      if (file.size > MAX_UPLOAD_SIZE) {
        const msg = `File too large: ${formatFileSize(file.size)}. Max is ${formatFileSize(MAX_UPLOAD_SIZE)}`;
        setErrorMsg(msg);
        toast.error(msg);
        return false;
      }

      if (file.size < 1) {
        const msg = "File is empty";
        setErrorMsg(msg);
        toast.error(msg);
        return false;
      }

      clearPreviewUrl(previewUrl);
      const url = URL.createObjectURL(file);
      setSelectedFile(file);
      setPreviewUrl(url);
      setErrorMsg("");
      if (stage === "error") setStage("idle");
      return true;
    },
    [clearPreviewUrl, previewUrl, stage],
  );

  const handleClearFile = useCallback(() => {
    clearPreviewUrl(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    setDimensions(null);
    setErrorMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (stage === "error") setStage("idle");
  }, [clearPreviewUrl, previewUrl, stage]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    validateAndSetFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    validateAndSetFile(file);
  };

  const toggleTag = useCallback((tagId: string) => {
    setSelectedTagIds((prev) => {
      if (prev.includes(tagId)) return prev.filter((id) => id !== tagId);
      if (prev.length >= 10) {
        toast.error("Maximum 10 tags allowed");
        return prev;
      }
      return [...prev, tagId];
    });
  }, []);

  const removeTag = useCallback((tagId: string) => {
    setSelectedTagIds((prev) => prev.filter((id) => id !== tagId));
  }, []);

  const filteredTags = useMemo(() => {
    const q = tagSearch.trim().toLowerCase();
    if (!q) return availableTags;
    return availableTags.filter(
      (t) =>
        t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q),
    );
  }, [availableTags, tagSearch]);

  const selectedTags = useMemo(
    () => availableTags.filter((t) => selectedTagIds.includes(t.id)),
    [availableTags, selectedTagIds],
  );

  const uploadHandler = async (data: UploadFormClientType) => {
    if (!selectedFile) {
      const msg = "Please select an image to upload";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    const trimmedTitle = data.title.trim();
    const trimmedDescription =
      data.description?.trim() ? data.description.trim() : undefined;

    setErrorMsg("");
    setStage("initiating");
    setUploadProgress(10);

    try {
      const initiateResult = await initiateUpload({
        title: trimmedTitle,
        description: trimmedDescription,
        categoryId: data.categoryId,
        tagIds: selectedTagIds,
        fileName: selectedFile.name,
        mimeType: selectedFile.type,
        fileSize: selectedFile.size,
      });

      if (!initiateResult.success) {
        const msg =
          initiateResult.error === "VALIDATION_ERROR" ?
            "Validation failed, please check your inputs"
          : initiateResult.error === "RATE_LIMITED" ?
            "Rate limited: maximum 5 uploads per hour"
          : initiateResult.error === "INVALID_CATEGORY" ?
            "Selected category is invalid"
          : initiateResult.error === "INVALID_TAG" ?
            "One or more selected tags are invalid"
          : initiateResult.error === "UNAUTHORIZED" ?
            "You must be signed in to upload"
          : initiateResult.error || "Failed to initiate upload";
        setErrorMsg(msg);
        toast.error(msg);
        setStage("error");
        setUploadProgress(0);
        return;
      }

      const { url, key, wallpaperId } = initiateResult.data;

      setStage("uploading");
      setUploadProgress(30);

      let uploadResponse: Response;
      try {
        uploadResponse = await fetch(url, {
          method: "PUT",
          body: selectedFile,
          headers: {
            "Content-Type": selectedFile.type,
          },
        });
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to upload file";
        setErrorMsg(msg);
        toast.error(msg);
        setStage("error");
        setUploadProgress(0);
        return;
      }

      if (!uploadResponse.ok) {
        const msg = `Upload failed with status ${uploadResponse.status}`;
        setErrorMsg(msg);
        toast.error(msg);
        setStage("error");
        setUploadProgress(0);
        return;
      }

      setUploadProgress(60);
      setStage("processing");

      const finalizeResult = await finalizeUpload({
        wallpaperId,
        key,
      });

      if (!finalizeResult.success) {
        const msg =
          finalizeResult.error === "OBJECT_NOT_FOUND" ?
            "Uploaded file not found, please try again"
          : finalizeResult.error === "PROCESSING_FAILED" ?
            "Image processing failed"
          : finalizeResult.error === "NOT_FOUND" ? "Wallpaper record not found"
          : finalizeResult.error === "FORBIDDEN" ?
            "You do not have permission to finalize this upload"
          : finalizeResult.error === "KEY_MISMATCH" ? "Upload key mismatch"
          : finalizeResult.error || "Failed to finalize upload";
        setErrorMsg(msg);
        toast.error(msg);
        setStage("error");
        setUploadProgress(0);
        return;
      }

      setUploadProgress(100);
      setStage("done");
      toast.success("Wallpaper uploaded successfully!");

      reset({
        title: "",
        description: "",
        categoryId: "",
      });
      setSelectedTagIds([]);
      setTagSearch("");

      setTimeout(() => {
        handleClearFile();
        setUploadProgress(0);
        setStage("idle");
      }, 1500);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Unexpected error during upload";
      setErrorMsg(msg);
      toast.error(msg);
      setStage("error");
      setUploadProgress(0);
    }
  };

  const isBusy =
    isSubmitting ||
    stage === "initiating" ||
    stage === "uploading" ||
    stage === "processing";

  const aspectLabel =
    dimensions ?
      `${dimensions.width} x ${dimensions.height} • ${getAspectRatioLabel(dimensions.width, dimensions.height)}`
    : selectedFile ? selectedFile.type.split("/")[1]?.toUpperCase() || "IMAGE"
    : null;

  return (
    <form
      // eslint-disable-next-line react-hooks/refs
      onSubmit={handleSubmit(uploadHandler)}
      className="grid gap-6"
      noValidate>
      {/* Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        aria-label="Upload image dropzone"
        className={
          isDragOver ?
            "border-primary bg-primary/5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition-colors"
          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition-colors"
        }>
        <div className="bg-muted rounded-full p-3">
          <UploadIcon className="text-muted-foreground size-6" />
        </div>
        <div className="grid gap-1">
          <p className="text-sm font-medium">
            Drag and drop image here, or click to browse
          </p>
          <p className="text-muted-foreground text-xs">
            JPEG, PNG, WebP, AVIF up to 50MB
          </p>
        </div>
        {selectedFile && (
          <p className="text-muted-foreground text-xs">
            Selected: {selectedFile.name}
          </p>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        tabIndex={-1}
        onChange={handleFileInputChange}
      />

      {/* Preview */}
      {previewUrl && selectedFile && (
        <div className="bg-card grid gap-3 overflow-hidden rounded-2xl border p-3">
          <div className="relative overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview"
              className="h-64 w-full object-cover"
            />
            {aspectLabel && (
              <Badge className="absolute top-2 right-2 backdrop-blur">
                {aspectLabel}
              </Badge>
            )}
            <Badge
              variant="secondary"
              className="absolute top-2 left-2 backdrop-blur">
              <ImageIcon className="size-3" />
              Preview
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {selectedFile.name}
              </p>
              <p className="text-muted-foreground text-xs">
                {formatFileSize(selectedFile.size)} • {selectedFile.type}
                {dimensions ?
                  ` • ${dimensions.width} x ${dimensions.height}`
                : ""}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearFile}>
              <XIcon />
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Title */}
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

      {/* Description */}
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

      {/* Category */}
      <Controller
        name="categoryId"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Category</FieldLabel>
            <Select
              value={field.value}
              onValueChange={field.onChange}>
              <SelectTrigger
                id={field.name}
                aria-invalid={fieldState.invalid}
                className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem
                    key={category.id}
                    value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Tags - strict selection only */}
      <Field>
        <FieldLabel>Tags</FieldLabel>
        <FieldDescription>
          Select from admin-created tags only, max 10. Search to filter.
        </FieldDescription>
        {availableTags.length === 0 ?
          <Alert>
            <AlertTitle>No tags available</AlertTitle>
            <AlertDescription>
              An admin needs to create tags in Taxonomy before you can tag
              wallpapers.
            </AlertDescription>
          </Alert>
        : <>
            <div className="relative">
              <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                placeholder="Search tags"
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="gap-1 pr-1">
                    {tag.name}
                    <button
                      type="button"
                      aria-label={`Remove tag ${tag.name}`}
                      onClick={() => removeTag(tag.id)}
                      className="hover:bg-muted ml-1 rounded-full p-0.5">
                      <XIcon className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="bg-muted/30 max-h-48 overflow-y-auto rounded-xl border p-2">
              {filteredTags.length === 0 ?
                <p className="text-muted-foreground py-4 text-center text-xs">
                  No matching tags
                </p>
              : <div className="grid gap-1">
                  {filteredTags.map((tag) => {
                    const checked = selectedTagIds.includes(tag.id);
                    return (
                      <label
                        key={tag.id}
                        className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleTag(tag.id)}
                        />
                        <span className="flex-1">{tag.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {tag.slug}
                        </span>
                      </label>
                    );
                  })}
                </div>
              }
            </div>
            <p className="text-muted-foreground text-xs">
              {selectedTagIds.length} / 10 selected
            </p>
          </>
        }
      </Field>

      {/* Progress */}
      {(stage === "uploading" || stage === "processing") && (
        <div className="grid gap-2">
          <Progress value={uploadProgress} />
          <p className="text-muted-foreground text-xs">
            {stage === "uploading" ? "Uploading..." : "Processing..."}{" "}
            {uploadProgress}%
          </p>
        </div>
      )}
      {stage === "initiating" && (
        <div className="grid gap-2">
          <Progress value={uploadProgress} />
          <p className="text-muted-foreground text-xs">
            Initiating upload... {uploadProgress}%
          </p>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <Alert variant="destructive">
          <AlertTitle>Upload error</AlertTitle>
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      {/* Done Alert */}
      {stage === "done" && (
        <Alert>
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>
            Wallpaper uploaded and queued for moderation
          </AlertDescription>
        </Alert>
      )}

      {/* Submit */}
      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || !selectedFile || isBusy}>
        {(
          isSubmitting ||
          (stage !== "idle" && stage !== "done" && stage !== "error")
        ) ?
          <>
            <Loader2Icon className="animate-spin" />
            {stage === "initiating" ?
              "Initiating..."
            : stage === "uploading" ?
              "Uploading..."
            : stage === "processing" ?
              "Processing..."
            : "Uploading..."}
          </>
        : <>
            <UploadIcon />
            Upload Wallpaper
          </>
        }
      </Button>
    </form>
  );
};

export default UploadForm;
