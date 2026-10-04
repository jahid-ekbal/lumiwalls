import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

import { serverEnv } from "./env/serverEnv";
import { s3Client } from "./storage/b2Client";

/**
 * Sanitize a file name by stripping path, replacing unsafe characters, and truncating.
 */
export const sanitizeFileName = (name: string): string => {
  const withoutPath = name.split(/[\\/]/).pop() ?? name;
  const sanitized = withoutPath.replace(/[^a-zA-Z0-9._-]/g, "_");
  const truncated = sanitized.slice(0, 100);
  return truncated || "file";
};

/**
 * Build an S3 object key following the bucket key convention.
 *
 * Convention:
 *   wallpapers/{userId}/{uuid}-{name}              (original file)
 *   wallpapers/{userId}/thumb-{size}-{uuid}.webp   (thumbnail)
 */
export const buildKey = (
  userId: string,
  fileName: string,
): {
  original: string;
  thumb400: string;
  thumb800: string;
  thumb1920: string;
} => {
  const uuid = crypto.randomUUID();
  const base = `wallpapers/${userId}`;

  return {
    original: `${base}/${uuid}-${fileName}`,
    thumb400: `${base}/thumb-400-${uuid}.webp`,
    thumb800: `${base}/thumb-800-${uuid}.webp`,
    thumb1920: `${base}/thumb-1920-${uuid}.webp`,
  };
};

/**
 * Upload a buffer to S3 with the given key and content type.
 */
export const uploadToS3 = async (
  key: string,
  body: Buffer | Uint8Array | Blob,
  contentType: string,
): Promise<void> => {
  const command = new PutObjectCommand({
    Bucket: serverEnv.S3_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await s3Client.send(command);
};

/**
 * Upload a buffer to S3 as a WebP image.
 */
export const uploadWebpToS3 = async (
  key: string,
  body: Buffer,
): Promise<void> => {
  await uploadToS3(key, body, "image/webp");
};

/**
 * Delete a single object from S3. Never throws, missing keys are ignored.
 */
export const deleteFromS3 = async (key: string): Promise<void> => {
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: serverEnv.S3_BUCKET_NAME,
        Key: key,
      }),
    );
  } catch {
    return;
  }
};

/**
 * Delete many objects from S3 in parallel. Never throws.
 */
export const deleteManyFromS3 = async (keys: string[]): Promise<void> => {
  await Promise.all(keys.map((key) => deleteFromS3(key)));
};
