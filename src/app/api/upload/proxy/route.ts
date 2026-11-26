import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { getActiveSession } from "@/lib/auth/session";
import prisma from "@/lib/database/dbClient";
import { serverEnv } from "@/lib/env/serverEnv";
import { consumeRateLimit } from "@/lib/security/rateLimit";
import { s3Client } from "@/lib/storage/b2Client";
import {
  MIME_FOR_FORMAT,
  detectImageFormat,
} from "@/lib/storage/fileValidation";
import { MAX_UPLOAD_SIZE, finalizeUploadSchema } from "@/lib/zodSchema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getActiveSession();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED" },
      { status: 401 },
    );
  }
  if (session.user.mustChangePassword) {
    return NextResponse.json(
      { success: false, error: "PASSWORD_CHANGE_REQUIRED" },
      { status: 403 },
    );
  }

  const limitCheck = await consumeRateLimit({
    key: `upload-proxy:${session.user.id}`,
    limit: 12,
    windowMs: 60 * 60 * 1000,
  });
  if (!limitCheck.allowed) {
    return NextResponse.json(
      { success: false, error: "RATE_LIMITED" },
      { status: 429 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  const parsed = finalizeUploadSchema.safeParse({
    wallpaperId: form.get("wallpaperId"),
    key: form.get("key"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { success: false, error: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }
  if (file.size < 1 || file.size > MAX_UPLOAD_SIZE) {
    return NextResponse.json(
      { success: false, error: "FILE_TOO_LARGE" },
      { status: 400 },
    );
  }

  const { wallpaperId, key } = parsed.data;
  const wallpaper = await prisma.wallpaper.findUnique({
    where: { id: wallpaperId },
    select: { uploaderId: true, originalUrl: true, thumb400Url: true },
  });
  if (!wallpaper) {
    return NextResponse.json(
      { success: false, error: "NOT_FOUND" },
      { status: 404 },
    );
  }
  if (wallpaper.uploaderId !== session.user.id) {
    return NextResponse.json(
      { success: false, error: "FORBIDDEN" },
      { status: 403 },
    );
  }
  if (wallpaper.originalUrl !== key || wallpaper.thumb400Url !== null) {
    return NextResponse.json(
      { success: false, error: "KEY_MISMATCH" },
      { status: 400 },
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const detected = detectImageFormat(bytes);
  if (!detected) {
    return NextResponse.json(
      { success: false, error: "UNSUPPORTED_FILE_TYPE" },
      { status: 400 },
    );
  }

  const canonicalMime = MIME_FOR_FORMAT[detected];

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: serverEnv.S3_BUCKET_NAME,
        Key: key,
        Body: bytes,
        ContentType: canonicalMime,
        ContentLength: bytes.byteLength,
      }),
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "STORAGE_ERROR" },
      { status: 502 },
    );
  }
}
