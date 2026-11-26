import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getActiveSession } from "@/lib/auth/session";
import prisma from "@/lib/database/dbClient";
import { serverEnv } from "@/lib/env/serverEnv";
import { s3Client } from "@/lib/storage/b2Client";
import { SAFE_SERVE_MIME_ALLOWLIST } from "@/lib/storage/fileValidation";

export const runtime = "nodejs";

const SAFE_KEY_PATTERN =
  /^(wallpapers|avatars|banners)\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+$/;

const isServeKey = (key: string): boolean => {
  if (!key || key.length >= 500 || key.includes("..")) {
    return false;
  }
  return SAFE_KEY_PATTERN.test(key);
};

const mimeFromExtension = (key: string): string | null => {
  const lower = key.toLowerCase();
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".avif")) return "image/avif";
  return null;
};

const sanitizeDownloadName = (name: string): string =>
  name
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120) || "lumiwalls-wallpaper";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const session = await getActiveSession();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { key: segments } = await params;
  const key = segments.join("/");
  if (!isServeKey(key)) {
    return new Response("Not found", { status: 404 });
  }

  let isPrivateOrUnapproved = false;

  if (key.startsWith("wallpapers/")) {
    const wallpaper = await prisma.wallpaper.findFirst({
      where: {
        OR: [
          { originalUrl: { endsWith: key } },
          { originalUrl: key },
          { thumb400Url: { endsWith: key } },
          { thumb800Url: { endsWith: key } },
          { thumb1920Url: { endsWith: key } },
        ],
      },
      select: {
        isApproved: true,
        isPublic: true,
        uploaderId: true,
      },
    });
    if (!wallpaper) {
      return new Response("Not found", { status: 404 });
    }

    if (!(wallpaper.isApproved && wallpaper.isPublic)) {
      isPrivateOrUnapproved = true;
      const isOwner = session.user.id === wallpaper.uploaderId;
      const isAdmin = session.user.role === "admin";
      if (!isOwner && !isAdmin) {
        return new Response("Forbidden", { status: 403 });
      }
    }
  }

  try {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: serverEnv.S3_BUCKET_NAME,
        Key: key,
      }),
    );
    if (!response.Body) {
      return new Response("Not found", { status: 404 });
    }

    const upstreamType = response.ContentType?.split(";")[0]?.trim().toLowerCase();
    const contentType =
      upstreamType && SAFE_SERVE_MIME_ALLOWLIST.has(upstreamType) ?
        upstreamType
      : (mimeFromExtension(key) ?? "application/octet-stream");

    const url = new URL(request.url);
    const wantsDownload = url.searchParams.get("download") === "1";
    const requestedName = url.searchParams.get("filename");
    const ext = key.includes(".") ? key.slice(key.lastIndexOf(".")) : "";
    const safeFilename =
      requestedName ?
        sanitizeDownloadName(requestedName).endsWith(ext) ?
          sanitizeDownloadName(requestedName)
        : `${sanitizeDownloadName(requestedName)}${ext}`
      : sanitizeDownloadName(key.split("/").pop() ?? "lumiwalls-wallpaper");

    const responseHeaders = new Headers({
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control":
        isPrivateOrUnapproved ?
          "private, no-store"
        : "private, max-age=3600",
    });

    if (typeof response.ContentLength === "number") {
      responseHeaders.set("Content-Length", String(response.ContentLength));
    }
    if (wantsDownload) {
      responseHeaders.set(
        "Content-Disposition",
        `attachment; filename="${safeFilename}"`,
      );
    }

    const stream = response.Body.transformToWebStream();
    return new Response(stream, {
      status: 200,
      headers: responseHeaders,
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
