import prisma from "@/lib/database/dbClient";
import { slugify } from "@/lib/slugify";

const HANDLE_SUFFIX_LENGTH = 6;
const HANDLE_MAX_ATTEMPTS = 4;

/**
 * Lazily generate a unique public handle for a user on first need.
 *
 * Handles are derived from the display name (slugified); on a unique
 * constraint collision a short random suffix is appended. Existing
 * handles are returned untouched: a handle is a stable public identity.
 *
 * Returns the user's handle, or null when the user does not exist or
 * generation keeps failing.
 */
export const ensureHandle = async (userId: string): Promise<string | null> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { handle: true, name: true },
  });
  if (!user) {
    return null;
  }
  if (user.handle) {
    return user.handle;
  }

  const base = slugify(user.name) || "user";

  for (let attempt = 0; attempt < HANDLE_MAX_ATTEMPTS; attempt++) {
    const candidate =
      attempt === 0 ? base : (
        `${base.slice(0, 40 - HANDLE_SUFFIX_LENGTH - 1)}-${crypto
          .randomUUID()
          .replace(/-/g, "")
          .slice(0, HANDLE_SUFFIX_LENGTH)}`
      );

    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { handle: candidate },
        select: { handle: true },
      });
      return updated.handle;
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code !== "P2002") {
        return null;
      }
      // Another request may have set our handle while we raced; reuse it.
      const raced = await prisma.user.findUnique({
        where: { id: userId },
        select: { handle: true },
      });
      if (raced?.handle) {
        return raced.handle;
      }
    }
  }

  return null;
};
