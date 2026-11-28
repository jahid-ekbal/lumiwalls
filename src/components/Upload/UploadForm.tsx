"use client";

import StatusBadge from "@/components/UI/StatusBadge";
import TagSelector from "@/components/Upload/TagSelector";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/shadcnui/alert";
import { Badge } from "@/components/shadcnui/badge";
import { Button, buttonVariants } from "@/components/shadcnui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcnui/select";
import { Textarea } from "@/components/shadcnui/textarea";
import { formatBytes } from "@/lib/format";
import { toImagePath } from "@/lib/imageUrl";
import { ALLOWED_MIME_TYPES, MAX_UPLOAD_SIZE } from "@/lib/zodSchema";
import { finalizeUpload, initiateUpload } from "@/server/actions/upload";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircleIcon,
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
    icon: string | null;
    color: string | null;
  }>;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  remainingQuota: number;
};

const getAspectRatioLabel = (width: number, height: number): string => {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  const w = Math.round(width / divisor);
  const h = Math.round(height / divisor);
  if (w <= 32 && h <= 32) return `${w}:${h}`;
  return `${(width / height).toFixed(2)}:1`;
};

const STAGE_LABEL: Record<
  Exclude<UploadStage, "idle" | "done" | "error">,
  string
> = {
  initiating: "Preparing your submission...",
  uploading: "Uploading image...",
  processing: "Generating previews and verifying image...",
};

const UploadForm = ({
  categories,
  tags: availableTags,
  remainingQuota,
}: UploadFormProps) => {
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
    mode: "onTouched",
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

  const validateAndSetFile = useCallback(
    (file: File): boolean => {
      const isAllowedType = (ALLOWED_MIME_TYPES as readonly string[]).includes(
        file.type,
      );

      if (!isAllowedType) {
        const msg =
          "Unsupported image format. Please choose a JPEG, PNG, WebP, or AVIF file.";
        setErrorMsg(msg);
        toast.error(msg);
        return false;
      }

      if (file.size > MAX_UPLOAD_SIZE) {
        const msg = `This image is ${formatBytes(file.size)}. Maximum supported size is ${formatBytes(MAX_UPLOAD_SIZE)}.`;
        setErrorMsg(msg);
        toast.error(msg);
        return false;
      }

      if (file.size < 1) {
        const msg = "The selected file appears to be empty.";
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
      const msg = "Please select an image to upload.";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    const trimmedTitle = data.title.trim();
    const trimmedDescription =
      data.description?.trim() ? data.description.trim() : undefined;

    setErrorMsg("");
    setStage("initiating");

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
            "Please review the highlighted fields and try again."
          : initiateResult.error === "RATE_LIMITED" ?
            "You have reached the hourly limit of 5 uploads. Please try again later."
          : initiateResult.error === "INVALID_CATEGORY" ?
            "The selected category is no longer available."
          : initiateResult.error === "INVALID_TAG" ?
            "One or more selected tags are unavailable."
          : initiateResult.error === "UNAUTHORIZED" ?
            "Please sign in to upload wallpapers."
          : initiateResult.error === "STORAGE_ERROR" ?
            "Upload service is temporarily unavailable. Please try again shortly."
          : initiateResult.error || "Unable to start upload. Please try again.";
        setErrorMsg(msg);
        toast.error(msg);
        setStage("error");
        return;
      }

      let { url, key, wallpaperId } = initiateResult.data;

      setStage("uploading");

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
            "Unable to upload your image right now. Please check your connection and try again.";
          setErrorMsg(msg);
          toast.error(msg);
          setStage("error");
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
                "Your upload session timed out. Please try uploading again.";
              setErrorMsg(msg);
              toast.error(msg);
              setStage("error");
              return;
            }
            if (!uploadResponse.ok) {
              const msg =
                "Your upload session expired. Please submit your wallpaper again.";
              setErrorMsg(msg);
              toast.error(msg);
              setStage("error");
              return;
            }
          } else {
            const msg =
              "Your upload session expired. Please submit again to refresh.";
            setErrorMsg(msg);
            toast.error(msg);
            setStage("error");
            return;
          }
        } else {
          const msg =
            "The upload could not be accepted. Please try again in a moment.";
          setErrorMsg(msg);
          toast.error(msg);
          setStage("error");
          return;
        }
      }

      setStage("processing");

      const finalizeResult = await finalizeUpload({
        wallpaperId,
        key,
      });

      if (!finalizeResult.success) {
        const msg =
          finalizeResult.error === "OBJECT_NOT_FOUND" ?
            "Your uploaded file could not be found. Please try again."
          : finalizeResult.error === "PROCESSING_FAILED" ?
            "We could not process that image file. Please try another image or re-export it."
          : finalizeResult.error === "NOT_FOUND" ?
            "Your upload session could not be found. Please try again."
          : finalizeResult.error === "FORBIDDEN" ?
            "You do not have permission to complete this upload."
          : finalizeResult.error === "KEY_MISMATCH" ?
            "Your upload session could not be verified. Please try again."
          : finalizeResult.error === "FILE_TOO_LARGE" ?
            `This image exceeds the ${formatBytes(MAX_UPLOAD_SIZE)} limit.`
          : finalizeResult.error === "STORAGE_ERROR" ?
            "Could not finish saving your wallpaper. Please try again."
          : finalizeResult.error || "Unable to complete your upload.";
        setErrorMsg(msg);
        toast.error(msg);
        setStage("error");
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
      setStage("idle");
    } catch {
      const msg =
        "Something unexpected happened while uploading. Please try again.";
      setErrorMsg(msg);
      toast.error(msg);
      setStage("error");
    }
  };

  const isBusy =
    isSubmitting ||
    stage === "initiating" ||
    stage === "uploading" ||
    stage === "processing";

  const aspectLabel =
    dimensions ?
      `${dimensions.width} x ${dimensions.height} · ${getAspectRatioLabel(dimensions.width, dimensions.height)}`
    : selectedFile ? selectedFile.type.split("/")[1]?.toUpperCase() || "IMAGE"
    : null;

  if (uploaded) {
    const previewImage = toImagePath(
      uploaded.thumb800Url ?? uploaded.thumb400Url ?? uploaded.originalUrl,
    );

    return (
      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="bg-muted/40 rounded-surface relative aspect-video overflow-hidden border lg:col-span-5">
          {previewImage ?
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={previewImage}
              alt={`${uploaded.title} upload preview`}
              className="size-full object-cover"
            />
          : <div className="text-muted-foreground flex size-full items-center justify-center">
              <ImageIcon className="size-10" />
            </div>
          }
        </div>

        <div className="grid gap-5 lg:col-span-7">
          <div className="grid gap-3">
            <StatusBadge
              status="PENDING"
              className="w-fit"
            />
            <h2 className="font-heading text-h2 font-semibold tracking-tight">
              Submission received
            </h2>
            <p className="text-body-sm text-muted-foreground text-pretty">
              <span className="text-foreground font-medium">
                {uploaded.title}
              </span>{" "}
              is queued for moderation. Once approved, it will appear in Browse.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={"/upload?status=pending" as Route}
              className={buttonVariants()}>
              <ImagesIcon data-icon="inline-start" />
              View wallpaper
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
        <div className="grid gap-4 lg:col-span-7">
          {!selectedFile ?
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
                  "border-primary bg-primary/5 rounded-surface flex min-h-64 cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed p-8 text-center transition-colors lg:min-h-96"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30 focus-visible:ring-ring/50 rounded-surface flex min-h-64 cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed p-8 text-center transition-colors outline-none focus-visible:ring-3 lg:min-h-96"
              }>
              <div className="bg-muted rounded-full p-3.5">
                <UploadIcon
                  aria-hidden="true"
                  className="text-muted-foreground size-6"
                />
              </div>
              <div className="grid gap-1">
                <p className="text-body-sm font-medium">
                  Drag and drop an image here, or click to browse
                </p>
                <p className="text-caption text-muted-foreground">
                  JPEG, PNG, WebP, or AVIF up to {formatBytes(MAX_UPLOAD_SIZE)}
                </p>
              </div>
            </div>
          : null}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            tabIndex={-1}
            onChange={handleFileInputChange}
          />

          {previewUrl && selectedFile ?
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={
                isDragOver ?
                  "bg-card ring-primary rounded-surface grid gap-3 overflow-hidden border p-3.5 ring-2"
                : "bg-card rounded-surface grid gap-3 overflow-hidden border p-3.5"
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
                aria-label="Replace selected image"
                className="rounded-inset relative block w-full cursor-pointer overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt={`Preview of ${selectedFile.name}`}
                  className="h-80 w-full object-cover lg:h-96"
                />
                {aspectLabel ?
                  <Badge className="absolute top-2.5 right-2.5 backdrop-blur">
                    {aspectLabel}
                  </Badge>
                : null}
                <Badge
                  variant="secondary"
                  className="absolute top-2.5 left-2.5 backdrop-blur">
                  <ImageIcon data-icon="inline-start" />
                  Preview
                </Badge>
              </button>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm truncate font-medium">
                    {selectedFile.name}
                  </p>
                  <p className="text-caption text-muted-foreground">
                    {formatBytes(selectedFile.size)} &middot;{" "}
                    {selectedFile.type}
                    {dimensions ?
                      ` · ${dimensions.width} x ${dimensions.height}`
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
                    <UploadIcon data-icon="inline-start" />
                    Replace
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isBusy}
                    onClick={handleClearFile}>
                    <XIcon data-icon="inline-start" />
                    Clear
                  </Button>
                </div>
              </div>
              <p className="text-caption text-muted-foreground">
                Drop a new image anywhere on this frame or click Replace to
                swap.
              </p>
            </div>
          : null}
        </div>

        <div className="grid content-start gap-5 lg:col-span-5">
          <FieldGroup>
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
                  <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                  <Textarea
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="Describe your wallpaper (optional)"
                    rows={3}
                  />
                  {fieldState.invalid ?
                    <FieldError errors={[fieldState.error]} />
                  : null}
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
                  {fieldState.invalid ?
                    <FieldError errors={[fieldState.error]} />
                  : null}
                </Field>
              )}
            />
          </FieldGroup>

          <TagSelector
            key={tagSelectorKey}
            tags={availableTags}
            selectedTagIds={selectedTagIds}
            onSelectedChange={setSelectedTagIds}
          />
        </div>
      </div>

      {/* Honest indeterminate progress during upload and server processing */}
      {(
        stage === "initiating" ||
        stage === "uploading" ||
        stage === "processing"
      ) ?
        <div
          aria-live="polite"
          className="grid gap-2">
          <div
            role="progressbar"
            aria-label={STAGE_LABEL[stage]}
            aria-valuetext={STAGE_LABEL[stage]}
            className="bg-muted relative h-2.5 w-full overflow-hidden rounded-full">
            <div className="bg-primary progress-indeterminate h-full w-1/2 rounded-full" />
          </div>
          <p className="text-caption text-muted-foreground">
            {STAGE_LABEL[stage]}
          </p>
        </div>
      : null}

      <div
        aria-live="polite"
        aria-atomic="true">
        {errorMsg ?
          <Alert variant="destructive">
            <AlertCircleIcon aria-hidden="true" />
            <AlertTitle>Upload failed</AlertTitle>
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        : null}
      </div>

      <p className="text-caption text-muted-foreground text-center">
        {remainingQuota > 0 ?
          `${remainingQuota} of 5 uploads remaining this hour.`
        : "Hourly upload limit reached. Try again in a little while."}
      </p>

      <Button
        type="submit"
        className="w-full"
        disabled={
          isSubmitting || !selectedFile || isBusy || remainingQuota <= 0
        }>
        {isBusy ?
          <>
            <Loader2Icon
              data-icon="inline-start"
              className="animate-spin"
            />
            {(
              stage === "initiating" ||
              stage === "uploading" ||
              stage === "processing"
            ) ?
              STAGE_LABEL[stage]
            : "Uploading..."}
          </>
        : <>
            <UploadIcon data-icon="inline-start" />
            Upload Wallpaper
          </>
        }
      </Button>
    </form>
  );
};

export default UploadForm;
