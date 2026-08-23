import pLimit from "p-limit";
import sharp from "sharp";

import { uploadWebpToS3 } from "../fileStorage";

export type ProcessedImage = {
  metadata: {
    width: number;
    height: number;
    format: string;
    fileSize: number;
  };
  blurDataUrl: string;
  aspectRatio: string;
};

export const calculateAspectRatio = (width: number, height: number): string => {
  const ratio = width / height;

  if (Math.abs(ratio - 16 / 9) < 0.05) return "16:9";
  if (Math.abs(ratio - 21 / 9) < 0.05) return "21:9";
  if (Math.abs(ratio - 9 / 16) < 0.05) return "9:16";
  if (Math.abs(ratio - 1) < 0.05) return "1:1";

  return "other";
};

export async function processImage(buffer: Buffer): Promise<ProcessedImage>;
export async function processImage(file: File): Promise<ProcessedImage>;
export async function processImage(
  input: Buffer | File,
): Promise<ProcessedImage> {
  const buffer =
    Buffer.isBuffer(input) ? input : (
      Buffer.from(await (input as File).arrayBuffer())
    );

  const sharpMetadata = await sharp(buffer).rotate().metadata();
  const width = sharpMetadata.width ?? 0;
  const height = sharpMetadata.height ?? 0;
  const format = sharpMetadata.format ?? "unknown";
  const fileSize = buffer.byteLength;

  const blurBuffer = await sharp(buffer)
    .rotate()
    .resize(10, undefined, { fit: "inside" })
    .jpeg({ quality: 30 })
    .toBuffer();

  const blurDataUrl = `data:image/jpeg;base64,${blurBuffer.toString("base64")}`;

  const aspectRatio = calculateAspectRatio(width, height);

  return {
    metadata: { width, height, format, fileSize },
    blurDataUrl,
    aspectRatio,
  };
}

export type ThumbnailResult = {
  blurDataUrl: string;
  thumb400: Buffer;
  thumb800: Buffer;
  thumb1920: Buffer;
  metadata: ProcessedImage["metadata"];
  aspectRatio: string;
};

export const generateThumbnails = async (
  buffer: Buffer,
): Promise<ThumbnailResult> => {
  const sharpMetadata = await sharp(buffer).rotate().metadata();
  const width = sharpMetadata.width ?? 0;
  const height = sharpMetadata.height ?? 0;
  const format = sharpMetadata.format ?? "unknown";
  const fileSize = buffer.byteLength;
  const metadata = { width, height, format, fileSize };
  const aspectRatio = calculateAspectRatio(width, height);

  const limit = pLimit(3);

  const blurDataUrlPromise = sharp(buffer)
    .rotate()
    .resize(10, undefined, { fit: "inside" })
    .jpeg({ quality: 30 })
    .toBuffer()
    .then(
      (blurBuffer) => `data:image/jpeg;base64,${blurBuffer.toString("base64")}`,
    );

  const thumb400Promise = limit(() =>
    sharp(buffer)
      .rotate()
      .resize({ width: 400 })
      .webp({ quality: 80 })
      .toBuffer(),
  );

  const thumb800Promise = limit(() =>
    sharp(buffer)
      .rotate()
      .resize({ width: 800 })
      .webp({ quality: 80 })
      .toBuffer(),
  );

  const thumb1920Promise = limit(() =>
    sharp(buffer)
      .rotate()
      .resize({ width: 1920 })
      .webp({ quality: 82 })
      .toBuffer(),
  );

  const [blurDataUrl, thumb400, thumb800, thumb1920] = await Promise.all([
    blurDataUrlPromise,
    thumb400Promise,
    thumb800Promise,
    thumb1920Promise,
  ]);

  return {
    blurDataUrl,
    thumb400,
    thumb800,
    thumb1920,
    metadata,
    aspectRatio,
  };
};

export const generateThumbsAndUpload = async (
  buffer: Buffer,
  keys: { thumb400: string; thumb800: string; thumb1920: string },
): Promise<{
  blurDataUrl: string;
  metadata: ProcessedImage["metadata"];
  aspectRatio: string;
}> => {
  const { blurDataUrl, thumb400, thumb800, thumb1920, metadata, aspectRatio } =
    await generateThumbnails(buffer);

  await Promise.all([
    uploadWebpToS3(keys.thumb400, thumb400),
    uploadWebpToS3(keys.thumb800, thumb800),
    uploadWebpToS3(keys.thumb1920, thumb1920),
  ]);

  return { blurDataUrl, metadata, aspectRatio };
};
