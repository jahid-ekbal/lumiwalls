import sharp from "sharp";

import { deleteManyFromS3, uploadWebpToS3 } from "../fileStorage";
import { detectImageFormat } from "./fileValidation";

export const MAX_IMAGE_INPUT_PIXELS = 100_000_000;

export const SAFE_SHARP_OPTIONS: sharp.SharpOptions = {
  limitInputPixels: MAX_IMAGE_INPUT_PIXELS,
  animated: false,
  pages: 1,
  failOn: "error",
};

export type ProcessedImage = {
  metadata: {
    width: number;
    height: number;
    format: string;
    fileSize: number;
  };
  blurDataUrl: string;
  aspectRatio: string;
  dominantColors: string[];
  pHash: string;
};

export const calculateAspectRatio = (width: number, height: number): string => {
  if (width <= 0 || height <= 0) return "other";
  const ratio = width / height;

  if (Math.abs(ratio - 16 / 9) < 0.05) return "16:9";
  if (Math.abs(ratio - 21 / 9) < 0.05) return "21:9";
  if (Math.abs(ratio - 9 / 16) < 0.05) return "9:16";
  if (Math.abs(ratio - 1) < 0.05) return "1:1";

  return "other";
};

function toHex(r: number, g: number, b: number): string {
  const clamp = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value)))
      .toString(16)
      .padStart(2, "0");
  return `#${clamp(r)}${clamp(g)}${clamp(b)}`;
}

function rgbDistance(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Extract up to 5 distinct quantized hex colors from a small RGB sample.
 */
async function extractDominantColors(buffer: Buffer): Promise<string[]> {
  const { data } = await sharp(buffer, SAFE_SHARP_OPTIONS)
    .rotate()
    .resize(48, 48, { fit: "inside", withoutEnlargement: true })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  type Bucket = {
    count: number;
    weight: number;
    rSum: number;
    gSum: number;
    bSum: number;
  };

  const buckets = new Map<number, Bucket>();

  for (let i = 0; i + 2 < data.length; i += 3) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const spread = (max - min) / 255;

    // Slight preference for chromatic colors so filter swatches highlight color families cleanly.
    const weight = 1 + spread * 1.4;
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);

    const existing = buckets.get(key);
    if (existing) {
      existing.count += 1;
      existing.weight += weight;
      existing.rSum += r;
      existing.gSum += g;
      existing.bSum += b;
    } else {
      buckets.set(key, {
        count: 1,
        weight,
        rSum: r,
        gSum: g,
        bSum: b,
      });
    }
  }

  const sorted = [...buckets.values()]
    .map((bucket) => ({
      weight: bucket.weight,
      r: bucket.rSum / bucket.count,
      g: bucket.gSum / bucket.count,
      b: bucket.bSum / bucket.count,
    }))
    .sort((a, b) => b.weight - a.weight);

  const selected: { r: number; g: number; b: number; hex: string }[] = [];
  for (const candidate of sorted) {
    if (selected.length >= 5) {
      break;
    }
    if (selected.every((picked) => rgbDistance(picked, candidate) >= 34)) {
      selected.push({
        r: candidate.r,
        g: candidate.g,
        b: candidate.b,
        hex: toHex(candidate.r, candidate.g, candidate.b),
      });
    }
  }

  return selected.map((item) => item.hex);
}

/**
 * Compute a 64-bit difference hash (dHash) encoded as a 16-char lowercase hex string.
 */
async function computeDifferenceHash(buffer: Buffer): Promise<string> {
  const pixels = await sharp(buffer, SAFE_SHARP_OPTIONS)
    .rotate()
    .resize(9, 8, { fit: "fill" })
    .greyscale()
    .raw()
    .toBuffer();

  let bits = 0n;
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const left = pixels[row * 9 + col] ?? 0;
      const right = pixels[row * 9 + col + 1] ?? 0;
      bits = (bits << 1n) | (left > right ? 1n : 0n);
    }
  }
  return bits.toString(16).padStart(16, "0");
}

function assertValidRasterBuffer(
  buffer: Buffer,
  metadata: sharp.Metadata,
): { width: number; height: number; format: string } {
  const detected = detectImageFormat(buffer);
  const format = metadata.format ?? "unknown";
  if (!detected || detected !== format) {
    throw new Error("UNSUPPORTED_OR_CORRUPT_IMAGE_FORMAT");
  }

  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (width < 1 || height < 1) {
    throw new Error("INVALID_IMAGE_DIMENSIONS");
  }
  if (width * height > MAX_IMAGE_INPUT_PIXELS) {
    throw new Error("IMAGE_EXCEEDS_PIXEL_LIMIT");
  }

  return { width, height, format };
}

export async function processImage(buffer: Buffer): Promise<ProcessedImage>;
export async function processImage(file: File): Promise<ProcessedImage>;
export async function processImage(
  input: Buffer | File,
): Promise<ProcessedImage> {
  const buffer =
    Buffer.isBuffer(input) ? input : (
      Buffer.from(await (input as File).arrayBuffer())
    );

  const sharpMetadata = await sharp(buffer, SAFE_SHARP_OPTIONS)
    .rotate()
    .metadata();
  const { width, height, format } = assertValidRasterBuffer(
    buffer,
    sharpMetadata,
  );
  const fileSize = buffer.byteLength;

  const blurBuffer = await sharp(buffer, SAFE_SHARP_OPTIONS)
    .rotate()
    .resize(10, undefined, { fit: "inside" })
    .jpeg({ quality: 30 })
    .toBuffer();

  const blurDataUrl = `data:image/jpeg;base64,${blurBuffer.toString("base64")}`;
  const aspectRatio = calculateAspectRatio(width, height);
  const dominantColors = await extractDominantColors(buffer);
  const pHash = await computeDifferenceHash(buffer);

  return {
    metadata: { width, height, format, fileSize },
    blurDataUrl,
    aspectRatio,
    dominantColors,
    pHash,
  };
}

export type ThumbnailResult = {
  blurDataUrl: string;
  thumb400: Buffer;
  thumb800: Buffer;
  thumb1920: Buffer;
  metadata: ProcessedImage["metadata"];
  aspectRatio: string;
  dominantColors: string[];
  pHash: string;
};

export const generateThumbnails = async (
  buffer: Buffer,
): Promise<ThumbnailResult> => {
  const sharpMetadata = await sharp(buffer, SAFE_SHARP_OPTIONS)
    .rotate()
    .metadata();
  const { width, height, format } = assertValidRasterBuffer(
    buffer,
    sharpMetadata,
  );
  const fileSize = buffer.byteLength;
  const metadata = { width, height, format, fileSize };
  const aspectRatio = calculateAspectRatio(width, height);

  // Decode sequentially so constrained memory instances never peak at 4x libvips buffers.
  const blurBuffer = await sharp(buffer, SAFE_SHARP_OPTIONS)
    .rotate()
    .resize(10, undefined, { fit: "inside" })
    .jpeg({ quality: 30 })
    .toBuffer();
  const blurDataUrl = `data:image/jpeg;base64,${blurBuffer.toString("base64")}`;

  const dominantColors = await extractDominantColors(buffer);
  const pHash = await computeDifferenceHash(buffer);

  const thumb400 = await sharp(buffer, SAFE_SHARP_OPTIONS)
    .rotate()
    .resize({ width: 400, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const thumb800 = await sharp(buffer, SAFE_SHARP_OPTIONS)
    .rotate()
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const thumb1920 = await sharp(buffer, SAFE_SHARP_OPTIONS)
    .rotate()
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  return {
    blurDataUrl,
    thumb400,
    thumb800,
    thumb1920,
    metadata,
    aspectRatio,
    dominantColors,
    pHash,
  };
};

export const generateThumbsAndUpload = async (
  buffer: Buffer,
  keys: { thumb400: string; thumb800: string; thumb1920: string },
): Promise<{
  blurDataUrl: string;
  metadata: ProcessedImage["metadata"];
  aspectRatio: string;
  dominantColors: string[];
  pHash: string;
}> => {
  const {
    blurDataUrl,
    thumb400,
    thumb800,
    thumb1920,
    metadata,
    aspectRatio,
    dominantColors,
    pHash,
  } = await generateThumbnails(buffer);

  try {
    await Promise.all([
      uploadWebpToS3(keys.thumb400, thumb400),
      uploadWebpToS3(keys.thumb800, thumb800),
      uploadWebpToS3(keys.thumb1920, thumb1920),
    ]);
  } catch (error) {
    await deleteManyFromS3([keys.thumb400, keys.thumb800, keys.thumb1920]);
    throw error;
  }

  return { blurDataUrl, metadata, aspectRatio, dominantColors, pHash };
};
