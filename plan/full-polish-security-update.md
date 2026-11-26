# Lumiwalls Full Polish, Feature Completion & Security Plan

Generated from a full three-track audit of the repository (completeness, server/API security, UI/UX & installed skills) and locked-in architectural decisions.

---

## 1. Locked Product & Architectural Decisions

1. **Visual Identity & Skills**: Preserve Lumiwalls' achromatic dark-first cinematic gallery (`PRODUCT.md`) with full **Light Mode parity**; adopt Pinterest layout DNA from `docs/pinterest-design.md` (natural-aspect masonry, borderless imagery tiles, pill filter strip, 44px touch targets) and execute with `.agents/skills/`: `impeccable`, `design-taste-frontend`, `vercel-react-best-practices`, `vercel-composition-patterns`, `vercel-react-view-transitions`, and `web-design-guidelines`. Author root `DESIGN.md` documenting the hybrid token and masonry system.
2. **Strict Private Boundary**: Zero public gallery pages. `/`, `/sign-up`, and `/forgot-password` are the sole unauthenticated pages; `/browse`, `/collections`, `/collections/[slug]`, `/u/[handle]`, `/dashboard`, `/upload`, `/profile`, `/settings`, `/admin/*`, `/api/images/*`, and `/api/upload/*` strictly require an active unbanned session. Remove uploaded wallpaper thumbnails from `/` and `/sign-up` so `/` and `/sign-up` expose zero uploaded user images (ambient/typographic brand showcase only). Preserve safe relative `callbackUrl` across sign-in so shared `?preview=<slug>` links resolve seamlessly after authentication.
3. **Pinterest-Style Collections & Boards**: Surface both admin-curated Collections (`/collections`, `/collections/[slug]`, Browse featured shelf, searchable wallpaper picker in `/admin/collections/[id]`) and user-created Personal Boards (`Save to board` menu on masonry cards and Lightbox, plus Boards management on `/profile` and `/collections`).
4. **Complete Schema Capabilities**: Wire `dominantColors` extraction, 64-bit `pHash` (dHash + Hamming distance) duplicate detection, active `FeaturedPlacement` date windows + `priority` + `HERO`/`TRENDING`/`SEASONAL` slots, `Tag` (`description`, `color`), daily `ViewLog` & `DownloadLog` history, and drop unused `Wallpaper.avgRating`.
5. **Auth & Account Lifecycle**: Implement the real Admin one-time password-reset workflow in `/admin/users/[id]` (matching `/forgot-password` guidance) with `mustChangePassword` enforcement and session revocation; set `revokeOtherSessions: true` on password change; add `@handle` editing, avatar/banner preview + removal + live session image sync, and safe self-account deletion.
6. **Creator, Upload & Social Flows**: Multi-file batch upload queue in `/upload/new` (up to remaining hourly quota, byte-level XHR progress on direct PUT with hardened proxy fallback, `object-contain` preview), rejection `reviewNotes` surfaced in `/upload` and `/upload/[id]/edit`, owner `isPublic` visibility toggle, clickable uploader/tag/color links, Following feed filter on `/browse`, clickable Followers/Following dialogs on `/profile` and `/u/[handle]`, and fixed Dashboard links.
7. **Defense-in-Depth Security & Persistence**: Postgres-backed `RateLimit` and immutable `AdminAuditLog` (`/admin/audit`), full SVG/HTML stored-XSS elimination, `next.config.ts` CSP and security headers, Sharp pixel/memory/multi-frame DoS limits, `HeadObject` byte caps and streaming `/api/images/[...key]`, `proxy.ts` stale-session loop and `/api/health` fixes, per-page RSC admin authorization, banned-user enforcement inside `getActiveSession()`, hidden-wallpaper query fixes, hardened `logBoundaryError`, and S3 orphan cleanup.
8. **Codebase Cleanup**: Prune unused `S3_PUBLIC_URL` / `NEXT_PUBLIC_S3_PUBLIC_URL` env vars and `next.config.ts` unused `remotePatterns`; prune unused dependencies (`use-file-picker`, `@tanstack/react-table`, `@prisma/client`, `@prisma/adapter-libsql`); convert `BETTER_AUTH_URL` to Zod v4 `z.url()`; ensure `react-toastify` stylesheet is properly loaded with readable `autoClose`; standardize Admin forms onto `react-hook-form` + `zodResolver`.

---

## 2. Phase-by-Phase Implementation Plan

### Phase 0: Foundations, Cleanup & Skill Alignment

- **Dependencies & Env Cleanup**
  - `package.json`: Remove unused `use-file-picker`, `@tanstack/react-table`, `@prisma/client`, and `@prisma/adapter-libsql` (verify via `rg` before removing). Keep Prisma 7 `@generated/prisma/client`.
  - `src/lib/env/serverEnv.ts`, `src/lib/env/clientEnv.ts`, `.env.example`, `render.yaml`: Remove unused `S3_PUBLIC_URL` and `NEXT_PUBLIC_S3_PUBLIC_URL`. Update `BETTER_AUTH_URL` in `src/lib/env/serverEnv.ts` from `z.string().url(...)` to Zod v4 `z.url(...)`.
- **Design System & Token Consolidation**
  - Create root `DESIGN.md` fusing Lumiwalls' achromatic dark/light palette (`src/app/globals.css`) with Pinterest masonry geometry (16px/32px/pill radii, borderless `pin-card`, pill filter chips, 44x44px touch targets) and React View Transition rules. Update `PRODUCT.md` line 40 to reflect the strict private-app boundary.
  - Fix toast notifications (`src/app/globals.css` / `src/components/Providers/ToastProvider.tsx`): Ensure `react-toastify/dist/ReactToastify.css` is imported (styled with Base Luma tokens), switch `ThemeProvider` inspection from `theme` to `resolvedTheme`, and increase `autoClose` from `1500` ms to `3500` ms so error and recovery guidance is readable.
  - Ensure all `Button` and `buttonVariants` `<Link>` elements missing lucide icons (`BrowseFilters.tsx`, `CollectionsClient.tsx`, `CollectionDetailClient.tsx`, `FeaturedClient.tsx`, `ModerationClient.tsx`) include icons with `data-icon="inline-start"` or `data-icon="inline-end"` per `AGENTS.md`.

### Phase 1: Prisma Schema Migration & Core Utilities

Update `prisma/schema.prisma`, create a named migration (`bunx prisma migrate dev --name polish_security_collections_telemetry`), and run `bunx prisma generate`:

- **Remove dead field**: Drop `Wallpaper.avgRating`.
- **Extend `User`**: Add `mustChangePassword Boolean @default(false)` for admin-issued temporary password flows.
- **Extend `Collection`**: Add `ownerId String?` (`User` relation with `onDelete: SetNull` or `Cascade` for personal boards), `isPublicToMembers Boolean @default(true)` (controls whether a personal board appears on `/u/[handle]`), and `isCurated Boolean @default(false)` (distinguishes Admin-curated collections from member personal boards; migrate existing admin collections cleanly via SQL backfill).
- **Daily Analytics & History Tables**:
  - `ViewLog`: `id`, `wallpaperId`, `userId`, `viewedAt` (default `now()`), indexed on `[wallpaperId, viewedAt]` and `[userId, viewedAt]`.
  - `DownloadLog`: `id`, `wallpaperId`, `userId`, `variant` (`400`, `800`, `1920`, `original`), `downloadedAt` (default `now()`), indexed on `[userId, downloadedAt]` and `[wallpaperId, downloadedAt]`.
- **Security & Persistence Tables**:
  - `RateLimit`: `key String @id`, `count Int`, `resetAt DateTime` (supports atomic sliding/fixed-window increments in Postgres via transaction or upsert).
  - `AdminAuditLog`: `id`, `actorId String?` (`User` relation `onDelete: SetNull`), `action String`, `targetType String`, `targetId String`, `summary String`, `metadata Json?`, `ipAddress String?`, `createdAt DateTime @default(now())`, indexed on `[createdAt]` and `[actorId, createdAt]`.

### Phase 2: Full Security Hardening & Image Pipeline Upgrades

1. **Active Session & Per-Page Defense-in-Depth (`src/lib/auth/session.ts`)**
   - Create `getActiveSession()` and `requireAdminSession()` wrapped in React `cache()`:
     - Validates `auth.api.getSession({ headers: await headers() })`.
     - Explicitly enforces `!(user.banned && (!user.banExpires || user.banExpires > new Date()))`; auto-clears or treats expired temp bans accurately and denies banned sessions everywhere (even before cookie deletion catches up).
     - Enforces `mustChangePassword`: when `true`, redirect authenticated page requests (and block non-security mutations) to `/profile?tab=security&forceReset=1` until the user updates their password.
   - Replace direct `auth.api.getSession` calls in `src/app/(private)/layout.tsx`, `src/app/(private)/admin/layout.tsx`, **every** admin `page.tsx` / `_components/*-content.tsx` data loader, `/u/[handle]/page.tsx`, API routes, and Server Actions with `getActiveSession()` / `requireAdminSession()`.

2. **Proxy & Header Hardening (`src/proxy.ts`, `next.config.ts`)**
   - **`src/proxy.ts`**:
     - Strict private routing: `PUBLIC_ROUTES = ["/", "/sign-up", "/forgot-password"]`. Remove `OPEN_PATH_PREFIXES = ["/u/"]` so `/u/[handle]` requires authentication.
     - Bypass `/api/auth` AND `/api/health` cleanly so Render health checks receive `200 { ok: true }` instead of `307`.
     - Include `/api/images/**` and `.avif` in static exclusions or let `/api/images/[...key]/route.ts` enforce its own full session check so unauthenticated image fetches return `401` rather than redirecting to HTML login pages; do **not** blind-redirect `/` -> `/browse` solely on cookie existence when a stale/invalid session cookie is present (avoid infinite redirect loops by validating cookie presence cleanly vs server fallback query param `?signedOut=1` or session probe, or validating session in `/`).
     - Preserve intended destination (`?callbackUrl=<encoded-relative-path>`) when redirecting unauthenticated users from private routes (including `/browse?preview=...`) to `/`, validating strict relative safety (`startsWith("/") && !startsWith("//")`) before redirecting on login.
   - **`next.config.ts`**:
     - Remove unused `images.remotePatterns` if unused or keep cleanly scoped, and add `async headers()` emitting:
       - `Content-Security-Policy` (self script/style/img/connect matching `S3_ENDPOINT` for direct presigned uploads, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`)
       - `X-Frame-Options: DENY`
       - `X-Content-Type-Options: nosniff`
       - `Referrer-Policy: strict-origin-when-cross-origin`
       - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
       - Production `Strict-Transport-Security`.

3. **Zero Stored XSS & Pixel-Flood DoS Protection (`upload.ts`, `imageProcessor.ts`, `/api/upload/proxy`, `/api/images/[...key]`, `presignedUrl.ts`, `profile.ts`)**
   - **Strict File Format Verification**:
     - Create `src/lib/storage/fileValidation.ts` reading leading magic bytes (`JPEG`, `PNG`, `WEBP`, `AVIF`) cleanly without trusting `file.type` or filenames.
     - In `src/lib/storage/imageProcessor.ts`: configure Sharp with `limitInputPixels: 100_000_000` (100 MP ceiling) and `animated: false` / `pages: 1`. Assert `metadata.format` is strictly in `["jpeg", "png", "webp", "avif"]` (explicitly rejecting `svg`, `gif`, `tiff`, `pdf`). Build WebP thumbnails sequentially from a single normalized decoded pipeline to eliminate 4x concurrent libvips memory spikes on Render.
     - Apply the exact same magic-byte + Sharp raster check + `limitInputPixels` bounds to `updateProfileImage()` (`src/server/actions/profile.ts`) and `/api/upload/proxy/route.ts`.
     - Map validated format to a canonical safe extension in `buildKey()` (`src/lib/fileStorage.ts`) rather than trusting user extensions.
   - **Download & Upload Byte Bounds**:
     - Inspect `HeadObjectCommand` `ContentLength` in `finalizeUpload()` (`src/server/actions/upload.ts`) before downloading from S3, rejecting objects exceeding `MAX_UPLOAD_SIZE` cleanly and deleting the oversized S3 object immediately.
     - `generatePresignedUploadUrl()` (`src/lib/storage/presignedUrl.ts`): embed exact `ContentLength` when signing or enforce strict post-PUT verification + cap.
     - Never leak internal error strings (`details: error.message`) from `finalizeUpload()` to the client; log server-side only.
   - **Strict Authenticated Image Serving (`src/app/api/images/[...key]/route.ts`)**:
     - Require `getActiveSession()` for **all** requests (supporting Q3 + Q9 strict private mode).
     - Enforce per-object DB authorization for non-public/unapproved wallpapers (uploader or admin only).
     - Stream S3 response body (`response.Body.transformToWebStream()`) rather than buffering full files into RAM.
     - Serve with explicit safe raster `Content-Type` allowlist, `X-Content-Type-Options: nosniff`, `Content-Security-Policy: default-src 'none'; sandbox`, `Cache-Control: private, no-store` for unapproved/hidden items (and `private, max-age=3600` for approved private-app assets), plus `?download=1&filename=<safe-slug>` triggering `Content-Disposition: attachment; filename="..."`.

4. **Rate Limiting, Audit Logging & Mutation Safety**
   - **Rate Limiting (`src/lib/security/rateLimit.ts`)**: Backed by Postgres `RateLimit` table. Apply sliding/window limits on `initiateUpload` (count ALL recent rows regardless of `thumb400Url`, plus max 5 concurrent unfinalized uploads and atomic transaction guard), `/api/upload/proxy`, `updateProfileImage`, `trackWallpaperView` (per user+wallpaper cooldown), `incrementDownloadCount`, `createReport`, and `logBoundaryError`.
   - **Audit Logging (`src/lib/security/auditLog.ts`)**: Record immutable `AdminAuditLog` entries inside admin actions (`setRole`, `deleteUser`, `setBan`, `resetUserPassword`, `hardDeleteWallpaper`, `setWallpaperVisibility`, `reviewWallpaper`, `bulkReviewWallpapers`, `resolveReport`, `collection` & `featured` & `taxonomy` mutations), and build `/admin/audit` page + sidebar link (`audit` table with actor, action filter, target, summary, timestamp).
   - **Orphan & Race Cleanup**:
     - Include `user.image` and `user.bannerUrl` S3 keys inside `deleteUser()` and new self-delete account action.
     - Clean up newly written S3 keys in catch blocks inside `updateProfileImage()` and `finalizeUpload()`.
     - Catch `P2002`/`P2025` inside `toggleFavorite` and `toggleFollow`; forbid following banned users in `toggleFollow`.
     - Enforce `wallpaper.isApproved && wallpaper.isPublic` and collection existence in `setCollectionCover()`.
     - Fix `DashboardFavorites` and `DashboardActivityFeed` to filter out hidden/rejected wallpapers (`isApproved: true, isPublic: true`), avoiding leaking slugs/blurDataUrls.
     - Harden `src/server/actions/logBoundaryError.ts`: require optional session info without trusting client spoofed identity, strictly validate and cap string lengths with Zod (`message` <= 500 chars, `route` <= 200 chars, drop arbitrary raw stacks on unauthenticated routes or truncate strictly).

### Phase 3: Incomplete Schema Features & Image Intelligence

- **Dominant Color Extraction (`src/lib/storage/imageProcessor.ts` + `src/lib/colorBuckets.ts`)**:
  - Extract 3-5 top quantized dominant hex colors during `generateThumbnails()` via Sharp (`stats()` / downsampled palette histogram), snap/store canonical palette hexes in `Wallpaper.dominantColors`, and backfill/support seed scripts cleanly. Unlocks Browse's 12 color filter swatches and clickable color chips in `WallpaperPreview`.
- **Perceptual Hashing (`pHash`) & Duplicate Detection**:
  - Compute a 64-bit dHash (`9x8` grayscale resize via Sharp) encoded as a 16-char hex `pHash` inside `generateThumbnails()` and persist it on `Wallpaper.pHash`.
  - Upgrade duplicate detection in `finalizeUpload()` (`src/server/actions/upload.ts`) and Moderation (`ModerationClient.tsx`) from exact match to Hamming distance `<= 5` across approved/pending wallpapers, surfacing potential duplicate thumbnails + IDs in Moderation review!
- **Active Featured Placements (`src/app/(private)/browse/page.tsx` & `src/server/actions/featured.ts`)**:
  - Query active `FeaturedPlacement` records (`active: true`, `startAt <= now`, `endAt == null || endAt >= now`, `wallpaper: { isApproved: true, isPublic: true }`) ordered by `priority ASC, createdAt DESC`, segmented cleanly by `HERO`, `TRENDING`, and `SEASONAL` slots. Render dedicated `Featured` hero rail + optional `Trending` / `Collections` strips cleanly without breaking pagination.
- **Daily View & Download Logging**:
  - Persist `ViewLog` inside `trackWallpaperView()` (deduped per user/session window) and `DownloadLog` inside `incrementDownloadCount()` (or unified download handler). Add user `"Download History"` tab/drawer on `/dashboard` or `/profile` and upgrade `/admin/analytics` (`AdminTrendChart.tsx`) to toggle/chart **Views**, **Downloads**, **Uploads**, and **Signups** over time.
- **Tag Metadata**:
  - Expose optional `description` and `color` accent badge cleanly in `src/lib/zodSchema.ts`, `src/server/actions/tags.ts`, and `TagClient.tsx` (updating `TagClient.tsx` forms to use `react-hook-form` + `zodResolver`).

### Phase 4: Auth & Account Lifecycle Completion

- **Strict Brand Auth Showcase (`src/components/Auth/AuthShell.tsx`)**:
  - Remove database wallpaper queries and `WallpaperPreview`/`<img>` thumbnails from `AuthShell`. Render a pure typographic + `.ambient-wash` architectural studio showcase on desktop (`/` and `/sign-up`), guaranteeing zero user content leaks before authentication.
  - Ensure `SignInForm` (`src/components/Auth/SignInForm.tsx`) supports safe relative `callbackUrl` search param so signing in returns users to `/browse?preview=...` or `/u/...`.
- **Working Admin Password Reset (`src/server/actions/users.ts`, `UserDetailClient.tsx`, `/forgot-password`)**:
  - Add `adminResetUserPassword` action (protected against primary `SEED_ADMIN_EMAIL` unless self/explicit policy, revokes all active user sessions in DB, sets `mustChangePassword: true`, generates a cryptographically strong 20-char one-time temporary password hashed via `hashPasswordFunction`, logs an `AdminAuditLog` entry, and shows it once in a copy-once dialog in `UserDetailClient.tsx`).
  - Update `/forgot-password` copy to match exact reality (contact an admin for a temporary password reset; once issued, sign in and update your password).
- **Security & Account Settings (`/profile` & `/settings`)**:
  - Set `revokeOtherSessions: true` in `ProfileSecurity` (`profile-security.tsx`) when changing passwords, and auto-clear `mustChangePassword = false` cleanly via a security post-change hook/action. Show an inline alert banner when `?forceReset=1` is active.
  - Add **Edit `@handle`** control (`updateProfileHandle` server action with strict regex, reserved handles blocklist `admin`/`api`/`browse`/`settings`/`upload`/`collections`/`u`, uniqueness check, `revalidatePath`).
  - Upgrade `ProfileMedia`: add client MIME/size validation, interactive preview/confirmation modal (with framing preview + "Remove avatar" / "Remove banner" delete buttons cleaning up old S3 objects), and trigger Better Auth `session` refetch so `PrivateHeader` avatar updates immediately without hard reload.
  - Add **Delete Account** danger zone in `/settings` (password re-confirmation via AlertDialog, blocked if user is primary admin or last remaining admin, deletes S3 avatars/banners/wallpapers, deletes DB user cascading sessions/accounts, signs out cleanly to `/`).

### Phase 5: Pinterest-Style Browse, Masonry, Collections & Lightbox Overhaul

- **Pinterest-Inspired Masonry + Light/Dark Parity (`BrowseGrid.tsx`, `FavoriteButton.tsx`, `BrowseHero.tsx`, `BrowseFilters.tsx`)**:
  - Replace cropped `aspect-4/3` boxes with a responsive natural-aspect CSS/balanced **masonry layout** (`columns-1 sm:columns-2 lg:columns-3 xl:columns-4` or deterministic shortest-column distribution to avoid column jumping on load) using `16px` (`--radius-surface`) borderless `pin-card` tiles (`aspectRatio: ${w} / ${h}`), `thumb800Url` primary source for crisp 1x/Retina cards, blurred low-res placeholder (`blurDataUrl`), and subtle hover zoom (`scale-[1.02]` within `overflow-hidden`, disabled under `prefers-reduced-motion`).
  - Receding card chrome: desktop hover/focus-within reveals a high-contrast dark scrim overlay (`bg-neutral-950/75 text-white`) so icon contrast stays crisp in **both dark and light themes** (fixing current `variant="ghost"` dark-text-on-dark-scrim Light Mode bug!); fix active Favorite rose tint (`text-rose-500 dark:text-rose-400`); on mobile `< md`, show only the clean image with compact corner quick-action pills (44px hit target) and discreet single-line creator attribution (`toImagePath()` avatar + clickable `/u/[handle]` link).
  - Update `src/app/(private)/browse/loading.tsx` skeletons with varied natural aspect ratios matching masonry rhythm.
  - Upgrade `BrowseFilters.tsx`: horizontal scrollable pill strip for **Quick Categories**, **Sort** (`Latest`, `Trending`, `Most Downloaded`, `Following` feed!), **Orientation**, **Color swatches** (now live!), clear `X` inside search box, keyboard `/` or `Cmd/Ctrl+K` shortcut to focus search, and fix orientation button icon padding (`data-icon` on vertical buttons).
  - Fix fail-open Browse queries (`browse/page.tsx`): when `orientation !== "any"` or `colorHexes.length > 0` matches `0` IDs, return `0` results (`EmptyState` with reset CTA) instead of dropping the filter; clamp out-of-range `page` to `totalPages`; select `uploader.handle` so creator links work everywhere.

- **Collections & Personal Boards UI (`/collections`, `/collections/[slug]`, `SaveToCollectionButton`)**:
  - Create `/collections` (two tabs or sections: **Curated Sets** + **My Boards**, plus `"New Board"` dialog) and `/collections/[slug]` (header banner, owner/curator link, Share link, masonry wallpaper grid, remove/reorder controls for owners & admins).
  - Add `"Save to board"` button/popover on Masonry cards and inside Lightbox (`WallpaperPreview`) allowing 1-click toggle across existing user boards or inline creation of a new board.
  - Add `/collections` to `AppSidebar` navigation, show a horizontal Curated Collections strip above Browse masonry when no active search filters narrow it, and add a "Boards" tab on `/profile` and `/u/[handle]`.
  - Fix `CollectionDetailClient.tsx`: replace manual CUID paste with a debounced searchable approved-wallpaper picker, and remove `"${slug} plus ${email}"` template leftover.

- **Lightbox & Shared State Polish (`WallpaperPreview.tsx`, `ResolutionPickerButton.tsx`, `useDownloadWallpaper.ts`)**:
  - Keep `BrowseGrid` and `WallpaperPreview` favorites/downloads/board-saves synchronized via shared client state / router refresh callback so toggling inside the Lightbox immediately updates the card underneath.
  - Upgrade Lightbox media stage: click image (not dark backdrop) or `z` key to zoom (`1x` <-> `2x` loading `originalUrl` cleanly), stage backdrop click closes or resets zoom safely, add keyboard shortcuts (`ArrowLeft`/`ArrowRight`, `f` Favorite, `d` Download, `z` Zoom, `Escape` close), ensure clickable uploader link (`/u/[handle]`), clickable tags (`/browse?tags=...`), clickable category pill (`/browse?category=...`), and click-to-copy + filter color swatches.
  - Upgrade Download flow: `/api/images/...?download=1&filename=${slug}-${variant}` sets `Content-Disposition: attachment` cleanly; `ResolutionPickerButton` displays exact pixel dimensions + formatted file size (`formatBytes`).

### Phase 6: Creators, Uploads, Dashboard, Profiles & Admin Polish

- **Dashboard Fixes (`src/app/(private)/dashboard/**`)**:
  - Route `PENDING` / `REJECTED` items in `DashboardUploadsList` and `DashboardActivityFeed` to `/upload/${id}/edit` instead of `/browse?preview=${slug}` (`"Preview not available"`).
  - Filter `DashboardFavorites` and `DashboardActivityFeed` to `isApproved: true, isPublic: true`; filter `DashboardReports` safely for deleted/hidden targets.
  - Add creator Download History card/link and clickable Following count breakdown.
- **Upload & Batch Queue (`/upload`, `/upload/new`, `/upload/[id]/edit`)**:
  - Build a multi-file batch upload queue in `UploadForm` (up to remaining hourly quota, shared category/tags batch defaults with per-item title/file preview using `object-contain`, direct presigned PUT with XHR progress % when CORS succeeds and automatic validated `/api/upload/proxy` fallback).
  - Surface moderation `reviewNotes` alert banner on rejected items in `UploadCard` (`/upload`) and `EditWallpaperForm` (`/upload/[id]/edit`).
  - Add owner `isPublic` visibility toggle in `EditWallpaperForm` (for `APPROVED` wallpapers so creators can archive/unpublish cleanly) and `"View in gallery"` / `"Edit submission"` accurate CTAs post-upload.
- **Profile & Public Creator Page (`/profile`, `/u/[handle]`)**:
  - Fix fallback banners (`profile-identity.tsx` & `/u/[handle]/page.tsx`) to adapt cleanly between Light Mode and Dark Mode (no harsh dark-slab gradient in light theme).
  - Pass all `user.image` / `user.bannerUrl` through `toImagePath()`.
  - Add clickable Followers & Following modal lists on `/profile` and `/u/[handle]`, paginate `/u/[handle]` cleanly (instead of unbounded query), and add pagination + Boards tab to `/profile`.
- **Admin Polish (`/admin/**`)**:
  - Migrate manual `useState` forms in `FeaturedClient.tsx`, `CollectionDetailClient.tsx`, `ModerationClient.tsx`, `ReportsClient.tsx`, `UsersClient.tsx`, `UserDetailClient.tsx`, and `TagClient.tsx` to `react-hook-form` + `zodResolver` matching `AGENTS.md`.
  - Fix `ModerationClient.tsx` copy (`"${email} plus metadata"`), preview modal resolution (`thumb1920Url` fallback instead of blurry `thumb400Url`), add Delete button in modal, show potential `pHash` duplicates side-by-side.
  - Clamp out-of-range page params in all paginated admin tables (`users`, `moderation`, `reports`, `collections`, `featured`), show lapsed temp bans accurately in `users-content.tsx`, display `reviewNotes` in `UserDetailClient.tsx`, remove dead `revalidatePath('/admin/featured/' + id)`, and add `/admin/audit` log viewer.

### Phase 7: End-to-End Verification & Cleanup

1. **Automated Gates**: Check port 3000 first; when free run `bun lint:check` (`next typegen && tsc --noEmit && eslint`), `npx @google/design.md lint DESIGN.md` (if available), and `Remove-Item -Recurse -Force .next; bun run build`. Confirm zero TypeScript, ESLint, Prisma, or build issues.
2. **Playwright Headed UI Verification (`playwright-cli --headed`)**:
   - Inspect live desktop (`1440x900`) and mobile (`390x844`) layouts across **both Dark and Light themes** + `prefers-reduced-motion: reduce` on: `/`, `/sign-up`, `/forgot-password`, `/browse` (masonry, filters, color swatches, following toggle, save-to-board, lightbox shortcuts & sync), `/collections`, `/collections/[slug]`, `/dashboard`, `/upload`, `/upload/new` (single + batch validation), `/upload/[id]/edit`, `/profile`, `/settings`, `/u/[handle]`, `/admin/*` (including `/admin/audit` & user temporary password reset), and `/not-found`.
   - Verify security behaviors live: unauthenticated redirect preserving `callbackUrl`, blocked `.svg` / spoofed-MIME upload rejection, `/api/health` returning `200` unauthenticated, `/api/images/*` returning `401` when unauthenticated and `X-Content-Type-Options: nosniff` + `Content-Security-Policy` when authenticated, security headers present in HTTP responses.
3. **Mandatory Cleanup (`AGENTS.md`)**:
   - Stop dev server daemon cleanly and confirm port 3000 is free.
   - Delete all temporary Playwright test users, wallpapers, collections, logs, and S3 objects created during testing.
   - Delete `.playwright-cli/` artifacts.
