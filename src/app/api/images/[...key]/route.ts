import { GetObjectCommand } from "@aws-sdk/client-s3";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { serverEnv } from "@/lib/env/serverEnv";
import { s3Client } from "@/lib/storage/b2Client";

export const runtime = "nodejs";

const isUuidKey = (key: string): boolean =>
  key.startsWith("wallpapers/") && !key.includes("..") && key.length < 500;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key: segments } = await params;
  const key = segments.join("/");
  if (!isUuidKey(key)) {
    return new Response("Not found", { status: 404 });
  }

  const wallpaper = await prisma.wallpaper.findFirst({
    where: {
      OR: [
        { originalUrl: { endsWith: key } },
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
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const role = session?.user && (session.user as { role?: string }).role;
    const allowed =
      session?.user &&
      (session.user.id === wallpaper.uploaderId || role === "admin");
    if (!allowed) {
      return new Response("Forbidden", { status: 403 });
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
    const bytes = await response.Body.transformToByteArray();
    const contentType =
      response.ContentType && response.ContentType.includes("/") ?
        response.ContentType
      : key.endsWith(".webp") ? "image/webp"
      : "application/octet-stream";
    return new Response(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(bytes.byteLength),
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
