import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

import { serverEnv } from "./env/serverEnv";
import { s3Client } from "./storage/b2Client";
import {
  type AllowedRasterFormat,
  EXT_FOR_FORMAT,
} from "./storage/fileValidation";

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
 * Build an S3 object key following the bucket key convention using a canonical format extension.
 */
export const buildKeyForFormat = (
  userId: string,
  format: AllowedRasterFormat,
): {
  original: string;
  thumb400: string;
  thumb800: string;
  thumb1920: string;
} => {
  const uuid = crypto.randomUUID();
  const base = `wallpapers/${userId}`;
  const ext = EXT_FOR_FORMAT[format];

  return {
    original: `${base}/${uuid}.${ext}`,
    thumb400: `${base}/thumb-400-${uuid}.webp`,
    thumb800: `${base}/thumb-800-${uuid}.webp`,
    thumb1920: `${base}/thumb-1920-${uuid}.webp`,
  };
};

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
    original: `${base}/${uuid}-${sanitizeFileName(fileName)}`,
    thumb400: `${base}/thumb-400-${uuid}.webp`,
    thumb800: `${base}/thumb-800-${uuid}.webp`,
    thumb1920: `${base}/thumb-1920-${uuid}.webp`,
  };
};

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

export const uploadWebpToS3 = async (
  key: string,
  body: Buffer,
): Promise<void> => {
  await uploadToS3(key, body, "image/webp");
};

const STORAGE_PREFIXES = ["wallpapers/", "avatars/", "banners/"] as const;

export const extractS3Key = (url: string | null): string | null => {
  if (!url) {
    return null;
  }
  const marker = "/api/images/";
  const index = url.indexOf(marker);
  if (index === -1) {
    return STORAGE_PREFIXES.some((prefix) => url.startsWith(prefix)) ? url : null;
  }
  const raw = url.slice(index + marker.length);
  const queryStart = raw.indexOf("?");
  return queryStart === -1 ? raw : raw.slice(0, queryStart);
};

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

export const deleteManyFromS3 = async (keys: string[]): Promise<void> => {
  await Promise.all(keys.map((key) => deleteFromS3(key)));
};
