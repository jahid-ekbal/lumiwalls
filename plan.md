# Backblaze B2 / S3 Storage — Implementation Plan

## Scope

S3-compatible object storage layer using the AWS SDK v3, targeting Backblaze B2. Includes basic image processing (blur placeholder via sharp). No dominant color extraction, no perceptual hash — those come in Sprint 2.

## Files to Create

```
src/lib/storage/
├── b2Client.ts
├── presignedUrl.ts
└── imageProcessor.ts
```

### `src/lib/storage/b2Client.ts`

- Singleton `S3Client` with `forcePathStyle: true` (required for B2)
- All config from `serverEnv`
- No instantiation elsewhere — import this client

### `src/lib/storage/presignedUrl.ts`

- `generatePresignedUploadUrl(key: string, mimeType: string)` → `{ url, key }`
- Uses `getSignedUrl` with `PutObjectCommand`
- 5-minute expiry

### `src/lib/storage/imageProcessor.ts`

```typescript
export const processImage = async (
  file: File,
): Promise<{
  metadata: { width: number; height: number; format: string; fileSize: number };
  blurDataUrl: string;
  aspectRatio: string;
}> => {
  const arrayBuffer = await file.arrayBuffer();
  const image = sharp(arrayBuffer);

  // 1. Strip EXIF
  // 2. Extract metadata (width, height, format, file size)
  // 3. Generate blur placeholder: resize to 10px wide, output base64 JPEG data URL
  // 4. Calculate aspect ratio (bucketed: 16:9, 21:9, 9:16, 1:1, other)
};
```

- Receives Web API `File` type
- Converts to `ArrayBuffer` via `file.arrayBuffer()`
- Passes `ArrayBuffer` directly to `sharp()` (per reference pattern)
- Returns processed metadata and blur data URL

## Bucket Key Convention

- `wallpapers/{userId}/{uuid}-{name}` — original file
- `wallpapers/{userId}/thumb-400-{uuid}.webp` — 400px thumbnail
- `wallpapers/{userId}/thumb-800-{uuid}.webp` — 800px thumbnail
- `wallpapers/{userId}/thumb-1920-{uuid}.webp` — 1920px thumbnail

Key-building helper lives in `imageProcessor.ts`.

## Files to Modify

### `src/lib/env/serverEnv.ts`

Add to the `server` object:

```typescript
S3_ENDPOINT: z.url(),
S3_REGION: z.string().min(1),
S3_ACCESS_KEY_ID: z.string().min(1),
S3_SECRET_ACCESS_KEY: z.string().min(1),
S3_BUCKET_NAME: z.string().min(1),
S3_PUBLIC_URL: z.url().optional(),
```

### `src/lib/env/clientEnv.ts`

Add to the `client` object and `runtimeEnv`:

```typescript
// client object:
NEXT_PUBLIC_S3_PUBLIC_URL: z.url().optional(),

// runtimeEnv object:
NEXT_PUBLIC_S3_PUBLIC_URL: process.env.NEXT_PUBLIC_S3_PUBLIC_URL,
```

### `.env.example`

Already up-to-date — S3 variables (lines 33–42) are present with placeholder values. No changes needed.

### `.env`

Populate with actual B2 credentials.

## Dependencies

All already in `package.json`: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `sharp`. No new installs needed.

## What imageProcessor.ts DOES NOT do (deferred to Sprint 2)

- ❌ Dominant color extraction (node-vibrant)
- ❌ Perceptual hash computation
- ❌ Thumbnail generation at multiple sizes (only blur placeholder now)
- ❌ Uploading processed files to S3
