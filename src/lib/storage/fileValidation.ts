export const ALLOWED_RASTER_FORMATS = ["jpeg", "png", "webp", "avif"] as const;
export type AllowedRasterFormat = (typeof ALLOWED_RASTER_FORMATS)[number];

export const MIME_FOR_FORMAT: Record<AllowedRasterFormat, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

export const EXT_FOR_FORMAT: Record<AllowedRasterFormat, string> = {
  jpeg: "jpg",
  png: "png",
  webp: "webp",
  avif: "avif",
};

export function formatForMimeType(mimeType: string): AllowedRasterFormat | null {
  switch (mimeType.toLowerCase()) {
    case "image/jpeg":
      return "jpeg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/avif":
      return "avif";
    default:
      return null;
  }
}

/**
 * Inspect leading file magic bytes to identify safe raster formats.
 * Explicitly rejects SVG, HTML, scripts, XML, PDF, and GIF polyglots.
 */
export function detectImageFormat(
  input: Uint8Array | Buffer,
): AllowedRasterFormat | null {
  if (input.byteLength < 12) {
    return null;
  }

  // JPEG: FF D8 FF
  if (input[0] === 0xff && input[1] === 0xd8 && input[2] === 0xff) {
    return "jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    input[0] === 0x89 &&
    input[1] === 0x50 &&
    input[2] === 0x4e &&
    input[3] === 0x47 &&
    input[4] === 0x0d &&
    input[5] === 0x0a &&
    input[6] === 0x1a &&
    input[7] === 0x0a
  ) {
    return "png";
  }

  // WEBP: "RIFF" .... "WEBP"
  if (
    input[0] === 0x52 &&
    input[1] === 0x49 &&
    input[2] === 0x46 &&
    input[3] === 0x46 &&
    input[8] === 0x57 &&
    input[9] === 0x45 &&
    input[10] === 0x42 &&
    input[11] === 0x50
  ) {
    return "webp";
  }

  // AVIF: ISO BMFF box ("ftyp") with major or compatible brand "avif" or "avis"
  if (
    input[4] === 0x66 &&
    input[5] === 0x74 &&
    input[6] === 0x79 &&
    input[7] === 0x70
  ) {
    const headerSlice = Buffer.from(
      input.subarray(8, Math.min(input.byteLength, 64)),
    ).toString("ascii");
    if (headerSlice.includes("avif") || headerSlice.includes("avis")) {
      return "avif";
    }
  }

  return null;
}

export const SAFE_SERVE_MIME_ALLOWLIST = new Set<string>([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
