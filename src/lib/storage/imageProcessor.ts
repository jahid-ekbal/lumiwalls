import sharp from "sharp";

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

const calculateAspectRatio = (width: number, height: number): string => {
  const ratio = width / height;

  if (Math.abs(ratio - 16 / 9) < 0.05) return "16:9";
  if (Math.abs(ratio - 21 / 9) < 0.05) return "21:9";
  if (Math.abs(ratio - 9 / 16) < 0.05) return "9:16";
  if (Math.abs(ratio - 1) < 0.05) return "1:1";

  return "other";
};

export const processImage = async (file: File): Promise<ProcessedImage> => {
  const arrayBuffer = await file.arrayBuffer();
  const image = sharp(arrayBuffer);

  // 1. Strip EXIF
  image.withMetadata({ exif: undefined });

  // 2. Extract metadata
  const sharpMetadata = await image.metadata();
  const width = sharpMetadata.width ?? 0;
  const height = sharpMetadata.height ?? 0;
  const format = sharpMetadata.format ?? "unknown";
  const fileSize = sharpMetadata.size ?? 0;

  // 3. Generate blur placeholder (10px wide, base64 JPEG data URL)
  const blurBuffer = await sharp(arrayBuffer)
    .resize(10, undefined, { fit: "inside" })
    .jpeg({ quality: 30 })
    .toBuffer();

  const blurDataUrl = `data:image/jpeg;base64,${blurBuffer.toString("base64")}`;

  // 4. Calculate aspect ratio
  const aspectRatio = calculateAspectRatio(width, height);

  return {
    metadata: { width, height, format, fileSize },
    blurDataUrl,
    aspectRatio,
  };
};
