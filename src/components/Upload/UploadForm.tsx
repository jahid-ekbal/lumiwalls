"use client";

import TagSelector from "@/components/Upload/TagSelector";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/shadcnui/alert";
import { Badge } from "@/components/shadcnui/badge";
import { Button, buttonVariants } from "@/components/shadcnui/button";
import { Field, FieldError, FieldLabel } from "@/components/shadcnui/field";
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
import { toImagePath } from "@/lib/imageUrl";
import {
  getPresignedExpiryDate,
  getRemainingSeconds,
} from "@/lib/uploadExpiry";
import { ALLOWED_MIME_TYPES, MAX_UPLOAD_SIZE } from "@/lib/zodSchema";
import { finalizeUpload, initiateUpload } from "@/server/actions/upload";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ClockIcon,
  ImageIcon,
  ImagesIcon,
  Loader2Icon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
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
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const replaceButtonRef = useRef<HTMLButtonElement>(null);
  const isFirstPreviewRender = useRef(true);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tagSelectorKey, setTagSelectorKey] = useState(0);
  const [uploaded, setUploaded] = useState<{
    title: string;
    slug: string;
    thumb400Url: string | null;
    thumb800Url: string | null;
    originalUrl: string | null;
  } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [stage, setStage] = useState<UploadStage>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [presignedExpiresAt, setPresignedExpiresAt] = useState<Date | null>(
    null,
  );
  const [expiresRemaining, setExpiresRemaining] = useState<number | null>(null);
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

  useEffect(() => {
    if (isFirstPreviewRender.current) {
      isFirstPreviewRender.current = false;
      return;
    }
    if (previewUrl) {
      replaceButtonRef.current?.focus();
    } else {
      dropzoneRef.current?.focus();
    }
  }, [previewUrl]);

  useEffect(() => {
    if (presignedExpiresAt === null) {
      return;
    }
    if (stage !== "uploading" && stage !== "processing") {
      return;
    }
    const timer = setInterval(() => {
      setExpiresRemaining(getRemainingSeconds(presignedExpiresAt));
    }, 1000);
    return () => clearInterval(timer);
  }, [presignedExpiresAt, stage]);

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
    setIsDragOver(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (stage === "error") setStage("idle");
  }, [clearPreviewUrl, previewUrl, stage]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (
      stage === "initiating" ||
      stage === "uploading" ||
      stage === "processing"
    ) {
      return;
    }
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
    if (
      stage === "initiating" ||
      stage === "uploading" ||
      stage === "processing"
    ) {
      return;
    }
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    validateAndSetFile(file);
  };

  const categoryItems = useMemo(
    () =>
      categories.map((category) => ({
        value: category.id,
        label: category.name,
      })),
    [categories],
  );

  const hasCategories = categories.length > 0;

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
      const initiatePayload = {
        title: trimmedTitle,
        description: trimmedDescription,
        categoryId: data.categoryId,
        tagIds: selectedTagIds,
        fileName: selectedFile.name,
        mimeType: selectedFile.type,
        fileSize: selectedFile.size,
      };
      const initiateResult = await initiateUpload(initiatePayload);

      if (!initiateResult.success) {
        const msg =
          initiateResult.error === "VALIDATION_ERROR" ?
            "Validation failed, please check your inputs"
          : initiateResult.error === "RATE_LIMITED" ?
            "Rate limited: maximum 5 finalized uploads per hour"
          : initiateResult.error === "INVALID_CATEGORY" ?
            "Selected category is invalid"
          : initiateResult.error === "INVALID_TAG" ?
            "One or more selected tags are invalid"
          : initiateResult.error === "UNAUTHORIZED" ?
            "You must be signed in to upload"
          : initiateResult.error === "STORAGE_ERROR" ?
            "Storage unavailable, please try again"
          : initiateResult.error || "Failed to initiate upload";
        setErrorMsg(msg);
        toast.error(msg);
        setStage("error");
        setUploadProgress(0);
        return;
      }

      let { url, key, wallpaperId } = initiateResult.data;
      const expiresAt = getPresignedExpiryDate(initiateResult.data.expiresIn);
      setPresignedExpiresAt(expiresAt);
      setExpiresRemaining(initiateResult.data.expiresIn);

      setStage("uploading");
      setUploadProgress(30);

      let uploadResponse: Response | null = null;
      let proxyOk = false;
      try {
        const proxyForm = new FormData();
        proxyForm.set("wallpaperId", wallpaperId);
        proxyForm.set("key", key);
        proxyForm.set("file", selectedFile);
        const proxyResponse = await fetch("/api/upload/proxy", {
          method: "POST",
          body: proxyForm,
        });
        proxyOk = proxyResponse.ok;
        if (!proxyOk) {
          const msg =
            "Server upload failed, trying direct browser upload as fallback.";
          toast.info(msg);
        }
      } catch {
        proxyOk = false;
      }

      if (!proxyOk) {
        try {
          uploadResponse = await fetch(url, {
            method: "PUT",
            body: selectedFile,
            headers: {
              "Content-Type": selectedFile.type,
            },
          });
        } catch {
          const msg =
            "Could not reach object storage and server fallback failed. Please try again or contact an admin.";
          setErrorMsg(msg);
          toast.error(msg);
          setStage("error");
          setUploadProgress(0);
          setPresignedExpiresAt(null);
          setExpiresRemaining(null);
          return;
        }
      }

      if (uploadResponse && !uploadResponse.ok) {
        if (uploadResponse.status === 403) {
          const retryResult = await initiateUpload(initiatePayload);
          if (retryResult.success) {
            url = retryResult.data.url;
            key = retryResult.data.key;
            wallpaperId = retryResult.data.wallpaperId;
            const retryExpiresAt = getPresignedExpiryDate(
              retryResult.data.expiresIn,
            );
            setPresignedExpiresAt(retryExpiresAt);
            setExpiresRemaining(retryResult.data.expiresIn);
            try {
              uploadResponse = await fetch(url, {
                method: "PUT",
                body: selectedFile,
                headers: {
                  "Content-Type": selectedFile.type,
                },
              });
            } catch {
              const msg =
                "Upload URL expired, retried once but upload still failed. Please submit again.";
              setErrorMsg(msg);
              toast.error(msg);
              setStage("error");
              setUploadProgress(0);
              return;
            }
            if (!uploadResponse.ok) {
              const msg = `Upload failed with status ${uploadResponse.status} after retry. The presigned URL may have expired, please submit again.`;
              setErrorMsg(msg);
              toast.error(msg);
              setStage("error");
              setUploadProgress(0);
              return;
            }
          } else {
            const msg =
              "Upload URL expired (403). Please submit again to get a fresh URL.";
            setErrorMsg(msg);
            toast.error(msg);
            setStage("error");
            setUploadProgress(0);
            return;
          }
        } else {
          const msg =
            uploadResponse.status === 403 ?
              "Upload blocked (403). Check B2 CORS for http://localhost:3000 allows PUT plus Content-Type and checksum headers, then submit again."
            : `Upload failed with status ${uploadResponse.status}`;
          setErrorMsg(msg);
          toast.error(msg);
          setStage("error");
          setUploadProgress(0);
          return;
        }
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
            "Image processing failed, orphan files were cleaned up. Please try again."
          : finalizeResult.error === "NOT_FOUND" ? "Wallpaper record not found"
          : finalizeResult.error === "FORBIDDEN" ?
            "You do not have permission to finalize this upload"
          : finalizeResult.error === "KEY_MISMATCH" ? "Upload key mismatch"
          : finalizeResult.error === "FILE_TOO_LARGE" ?
            "File too large after upload verification, maximum 50MB"
          : finalizeResult.error === "STORAGE_ERROR" ?
            "Storage unavailable during finalize, please try again"
          : finalizeResult.error || "Failed to finalize upload";
        setErrorMsg(msg);
        toast.error(msg);
        setStage("error");
        setUploadProgress(0);
        setPresignedExpiresAt(null);
        return;
      }

      setUploaded({
        title: trimmedTitle,
        slug: finalizeResult.data.slug,
        thumb400Url: finalizeResult.data.thumb400Url,
        thumb800Url: finalizeResult.data.thumb800Url,
        originalUrl: finalizeResult.data.originalUrl,
      });

      reset({
        title: "",
        description: "",
        categoryId: "",
      });
      setSelectedTagIds([]);
      setTagSelectorKey((value) => value + 1);
      handleClearFile();
      setUploadProgress(0);
      setPresignedExpiresAt(null);
      setStage("idle");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Unexpected error during upload";
      setErrorMsg(msg);
      toast.error(msg);
      setStage("error");
      setUploadProgress(0);
      setPresignedExpiresAt(null);
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

  if (uploaded) {
    const previewUrl = toImagePath(
      uploaded.thumb800Url ?? uploaded.thumb400Url ?? uploaded.originalUrl,
    );

    return (
      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="bg-muted/40 relative aspect-video overflow-hidden rounded-3xl border lg:col-span-5">
          {previewUrl ?
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={previewUrl}
              alt={uploaded.title}
              className="size-full object-cover"
            />
          : <div className="text-muted-foreground flex size-full items-center justify-center">
              <ImageIcon className="size-10" />
            </div>
          }
        </div>

        <div className="grid gap-5 lg:col-span-7">
          <div className="grid gap-3">
            <Badge
              variant="secondary"
              className="w-fit">
              <ClockIcon className="size-3" />
              Pending review
            </Badge>
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              Upload complete
            </h2>
            <p className="text-muted-foreground text-sm">
              <span className="text-foreground font-medium">
                {uploaded.title}
              </span>{" "}
              is now waiting for moderator approval. You can follow its status
              from My uploads.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={"/upload" as Route}
              className={buttonVariants()}>
              <ImagesIcon data-icon="inline-start" />
              View my uploads
            </Link>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setUploaded(null)}>
              <UploadIcon data-icon="inline-start" />
              Upload another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      // eslint-disable-next-line react-hooks/refs
      onSubmit={handleSubmit(uploadHandler)}
      className="grid gap-6"
      noValidate>
      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="grid gap-6 lg:col-span-7">
          {!selectedFile && (
            <div
              ref={dropzoneRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => {
                if (isBusy) return;
                fileInputRef.current?.click();
              }}
              role="button"
              tabIndex={isBusy ? -1 : 0}
              aria-disabled={isBusy}
              onKeyDown={(e) => {
                if (isBusy) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              aria-label="Upload image dropzone"
              className={
                isDragOver ?
                  "border-primary bg-primary/5 flex min-h-64 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition-colors lg:min-h-96"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30 flex min-h-64 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition-colors lg:min-h-96"
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
            </div>
          )}

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
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={
                isDragOver ?
                  "bg-card ring-primary grid gap-3 overflow-hidden rounded-2xl border p-3 ring-2"
                : "bg-card grid gap-3 overflow-hidden rounded-2xl border p-3"
              }>
              <button
                ref={replaceButtonRef}
                type="button"
                disabled={isBusy}
                onClick={() => {
                  if (isBusy) return;
                  if (fileInputRef.current) fileInputRef.current.value = "";
                  fileInputRef.current?.click();
                }}
                aria-label="Replace image"
                className="relative block w-full cursor-pointer overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-80 w-full object-cover lg:h-96"
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
              </button>
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
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => {
                      if (isBusy) return;
                      if (fileInputRef.current) fileInputRef.current.value = "";
                      fileInputRef.current?.click();
                    }}>
                    <UploadIcon />
                    Replace
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isBusy}
                    onClick={handleClearFile}>
                    <XIcon />
                    Clear
                  </Button>
                </div>
              </div>
              <p className="text-muted-foreground text-xs">
                Click image or Replace to swap, or drop a new file here.
              </p>
            </div>
          )}
        </div>
        <div className="grid content-start gap-6 lg:col-span-5">
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
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
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
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
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
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <TagSelector
            key={tagSelectorKey}
            tags={availableTags}
            selectedTagIds={selectedTagIds}
            onSelectedChange={setSelectedTagIds}
          />
        </div>
      </div>
      {/* Progress */}
      {(stage === "uploading" || stage === "processing") && (
        <div className="grid gap-2">
          <Progress value={uploadProgress} />
          <p className="text-muted-foreground text-xs">
            {stage === "uploading" ? "Uploading..." : "Processing..."}{" "}
            {uploadProgress}%
            {expiresRemaining !== null && stage === "uploading" ?
              ` • URL expires in ${expiresRemaining}s, retry if expired`
            : ""}
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
