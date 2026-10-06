"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcnui/avatar";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcnui/dialog";
import { Field, FieldLabel } from "@/components/shadcnui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcnui/select";
import { Textarea } from "@/components/shadcnui/textarea";
import { incrementDownloadCount } from "@/server/actions/browse";
import { createReport } from "@/server/actions/moderation";
import {
  DownloadIcon,
  EyeIcon,
  FlagIcon,
  ImagesIcon,
  Loader2Icon,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { toast } from "react-toastify";
import { toImagePath } from "@/lib/imageUrl";
import { browseParsers } from "./browse-search-params";
import type { BrowseWallpaper } from "./browse-types";

type WallpaperPreviewProps = {
  wallpapers: BrowseWallpaper[];
  previewWallpaper: BrowseWallpaper | null;
  reportedIds?: string[];
};

const initials = (name: string) => {
  const source = name.trim();
  if (!source) {
    return "?";
  }
  const parts = source.split(/\s+/);
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
};

const formatBytes = (bytes: number | null) => {
  if (bytes === null) {
    return "Unknown size";
  }
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const PreviewDetails = ({
  item,
  reported,
}: {
  item: BrowseWallpaper;
  reported: boolean;
}) => {
  const router = useRouter();
  const [downloadCount, setDownloadCount] = useState(item.downloadCount);
  const [downloading, setDownloading] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("SPAM");
  const [details, setDetails] = useState("");
  const [reporting, setReporting] = useState(false);

  const largeImage = toImagePath(
    item.thumb1920Url ??
      item.thumb800Url ??
      item.originalUrl ??
      item.thumb400Url,
  );
  const downloadUrl = toImagePath(item.originalUrl ?? largeImage);

  const handleDownload = async () => {
    if (downloading) {
      return;
    }
    const previous = downloadCount;
    setDownloadCount(previous + 1);
    setDownloading(true);
    try {
      const result = await incrementDownloadCount({ wallpaperId: item.id });
      if (result.success) {
        setDownloadCount(result.downloadCount);
      } else {
        setDownloadCount(previous);
        toast.error("Download failed, please try again");
      }
    } catch {
      setDownloadCount(previous);
      toast.error("Download failed, please try again");
    } finally {
      setDownloading(false);
    }
  };

  const handleReport = async () => {
    if (reporting) {
      return;
    }
    if (reason === "OTHER" && !details.trim()) {
      toast.error("Details are required for Other");
      return;
    }
    setReporting(true);
    try {
      const result = await createReport({
        wallpaperId: item.id,
        reason,
        details,
      });
      if (!result.success) {
        toast.error(
          result.error === "ALREADY_REPORTED" ?
            "Already reported, awaiting review"
          : result.error === "CANNOT_REPORT_OWN" ?
            "Cannot flag your own wallpaper"
          : result.error === "DETAILS_REQUIRED" ?
            "Details are required for Other"
          : "Report failed, please try again",
        );
        return;
      }
      toast.success("Thanks, report submitted");
      setReportOpen(false);
      setDetails("");
      router.refresh();
    } catch {
      toast.error("Report failed, please try again");
    } finally {
      setReporting(false);
    }
  };

  return (
    <div className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{item.title}</DialogTitle>
        <DialogDescription>
          {item.category ? `${item.category.name} wallpaper` : "Wallpaper"}
        </DialogDescription>
      </DialogHeader>
      <div className="bg-muted relative aspect-video w-full overflow-hidden rounded-2xl">
        {largeImage ?
          <Image
            src={largeImage}
            alt={item.title}
            fill={true}
            sizes="(max-width: 768px) 90vw, 720px"
            placeholder={item.blurDataUrl ? "blur" : "empty"}
            blurDataURL={item.blurDataUrl ?? undefined}
            className="object-cover"
          />
        : <div className="flex h-full w-full items-center justify-center">
            <ImagesIcon className="text-muted-foreground size-8" />
          </div>
        }
      </div>
      {item.description ?
        <p className="text-muted-foreground text-sm">{item.description}</p>
      : null}
      <div className="flex flex-wrap gap-1.5">
        {item.category ?
          <Badge variant="secondary">{item.category.name}</Badge>
        : null}
        {item.featured ?
          <Badge>Featured</Badge>
        : null}
        {item.editorsPick ?
          <Badge variant="outline">Editor pick</Badge>
        : null}
        {item.aspectRatio ?
          <Badge variant="outline">{item.aspectRatio}</Badge>
        : null}
        {item.format ?
          <Badge variant="outline">{item.format.toUpperCase()}</Badge>
        : null}
      </div>
      {item.tags.length > 0 ?
        <div className="flex flex-wrap gap-1.5">
          {item.tags.map((entry) => (
            <Badge
              key={entry.tag.id}
              variant="ghost">
              {entry.tag.name}
            </Badge>
          ))}
        </div>
      : null}
      <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div className="grid gap-0.5">
          <dt className="text-muted-foreground">Dimensions</dt>
          <dd>
            {item.width && item.height ?
              `${item.width} x ${item.height}`
            : "Unknown"}
          </dd>
        </div>
        <div className="grid gap-0.5">
          <dt className="text-muted-foreground">File size</dt>
          <dd>{formatBytes(item.fileSize)}</dd>
        </div>
        <div className="grid gap-0.5">
          <dt className="text-muted-foreground">Uploaded</dt>
          <dd>
            {new Date(item.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </dd>
        </div>
        <div className="grid gap-0.5">
          <dt className="text-muted-foreground">Colors</dt>
          <dd>
            {item.dominantColors.length > 0 ?
              item.dominantColors.slice(0, 3).join(", ")
            : "Unknown"}
          </dd>
        </div>
      </dl>
      {item.dominantColors.length > 0 ?
        <div className="flex gap-1.5">
          {item.dominantColors.slice(0, 6).map((color) => (
            <span
              key={color}
              title={color}
              className="size-5 rounded-full border"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <Avatar size="sm">
            {item.uploader.image ?
              <AvatarImage
                src={item.uploader.image}
                alt={item.uploader.name}
              />
            : null}
            <AvatarFallback>{initials(item.uploader.name)}</AvatarFallback>
          </Avatar>
          <span className="text-sm">{item.uploader.name}</span>
        </span>
        <span className="text-muted-foreground flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <EyeIcon className="size-3.5" />
            {item.viewCount.toLocaleString()} views
          </span>
          <span className="flex items-center gap-1">
            <DownloadIcon className="size-3.5" />
            {downloadCount.toLocaleString()} downloads
          </span>
        </span>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          disabled={reported}
          onClick={() => setReportOpen(true)}>
          <FlagIcon className="size-4" />
          {reported ? "Reported" : "Flag"}
        </Button>
        {downloadUrl ?
          <a
            href={downloadUrl}
            download={true}
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              void handleDownload();
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/80 inline-flex h-9 items-center justify-center gap-1.5 rounded-4xl px-3 text-sm font-medium transition">
            {downloading ?
              <Loader2Icon className="size-4 animate-spin" />
            : <DownloadIcon className="size-4" />}
            Download original
          </a>
        : <Button
            type="button"
            disabled={true}>
            No file available
          </Button>
        }
      </div>
      <Dialog
        open={reportOpen}
        onOpenChange={(next) => {
          if (!next) {
            setReportOpen(false);
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag wallpaper</DialogTitle>
            <DialogDescription>
              {`Report ${item.title} for review`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Field>
              <FieldLabel htmlFor="flag-reason">Reason</FieldLabel>
              <Select
                value={reason}
                items={[
                  { value: "SPAM", label: "Spam" },
                  { value: "NUDITY", label: "Nudity" },
                  { value: "COPYRIGHT", label: "Copyright" },
                  { value: "VIOLENCE", label: "Violence" },
                  { value: "OTHER", label: "Other" },
                ]}
                onValueChange={(value) => setReason(value)}>
                <SelectTrigger id="flag-reason">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SPAM">Spam</SelectItem>
                  <SelectItem value="NUDITY">Nudity</SelectItem>
                  <SelectItem value="COPYRIGHT">Copyright</SelectItem>
                  <SelectItem value="VIOLENCE">Violence</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="flag-details">Details</FieldLabel>
              <Textarea
                id="flag-details"
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                placeholder={
                  reason === "OTHER" ? "Required for Other" : "Optional details"
                }
              />
            </Field>
            <Button
              onClick={() => void handleReport()}
              disabled={reporting}>
              {reporting ?
                <Loader2Icon className="size-4 animate-spin" />
              : "Submit report"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const WallpaperPreview = ({
  wallpapers,
  previewWallpaper,
  reportedIds = [],
}: WallpaperPreviewProps) => {
  const [preview, setPreview] = useQueryState("preview", browseParsers.preview);
  const selected =
    previewWallpaper ??
    wallpapers.find((item) => item.slug === preview) ??
    null;
  const open = preview !== "";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          void setPreview("");
        }
      }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        {!selected ?
          <DialogHeader>
            <DialogTitle>Preview not available</DialogTitle>
            <DialogDescription>
              This wallpaper is not available, it may be pending review or
              removed.
            </DialogDescription>
          </DialogHeader>
        : <PreviewDetails
            key={selected.id}
            item={selected}
            reported={reportedIds.includes(selected.id)}
          />
        }
      </DialogContent>
    </Dialog>
  );
};

export default WallpaperPreview;
