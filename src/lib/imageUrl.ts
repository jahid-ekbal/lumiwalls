/**
 * Normalize a stored image URL for `next/image`.
 *
 * Uploads persist absolute URLs built from `BETTER_AUTH_URL`
 * (for example `http://localhost:3000/api/images/...`). Absolute
 * same-origin URLs fail `next/image` remote-pattern validation, so
 * strip the origin and return the relative `/api/images/...` path.
 * External URLs are returned unchanged.
 */
export const toImagePath = (url: string | null | undefined): string | null => {
  if (!url) {
    return null;
  }
  const marker = "/api/images/";
  const index = url.indexOf(marker);
  if (index !== -1) {
    return url.slice(index);
  }
  return url;
};
