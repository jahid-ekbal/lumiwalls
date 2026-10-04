import { PutObjectCommand } from "@aws-sdk/client-s3";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { serverEnv } from "@/lib/env/serverEnv";
import { s3Client } from "@/lib/storage/b2Client";
import { MAX_UPLOAD_SIZE, finalizeUploadSchema } from "@/lib/zodSchema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED" },
      { status: 401 },
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
    select: { uploaderId: true, originalUrl: true },
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
  if (wallpaper.originalUrl !== key) {
    return NextResponse.json(
      { success: false, error: "KEY_MISMATCH" },
      { status: 400 },
    );
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    await s3Client.send(
      new PutObjectCommand({
        Bucket: serverEnv.S3_BUCKET_NAME,
        Key: key,
        Body: bytes,
        ContentType: file.type || "application/octet-stream",
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
