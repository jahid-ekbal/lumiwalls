# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: people looking for high-quality desktop and mobile wallpapers. They arrive to browse, preview at full size, and download something that fits their screen. They may never upload.

Secondary: photographers and digital artists who upload work, maintain a profile, and get discovered. Admins and moderators review every submission before it reaches the public gallery.

## Product Purpose

Lumiwalls is a curated wallpaper gallery. It exists so people can find a screen background worth keeping without scrolling through an endless dump of low-effort images. Success means a visitor opens the gallery, finds a wallpaper they want, and downloads it, and the gallery stays worth returning to because the collection is small and deliberate.

Tagline: Light up your screen.

## Positioning

Curated quality. Every upload passes through a moderation queue, and editors picks and featured placements decide what gets promoted. The collection is reviewed rather than open-flood, so the value is trust in what is shown, not volume.

## Operating Context

- Browse by category, aspect ratio, and search, with a full-size preview before download.
- Download is the main conversion. Favorites, collections, follows, and profiles support return visits.
- Upload is a two-phase flow: metadata first, direct-to-storage file transfer, then server-side processing and moderation.
- Admins work from a separate admin area for moderation, categories, reports, and analytics.
- The app deploys on Render with Neon Postgres and Backblaze B2 object storage.

## Capabilities and Constraints

- Next.js 16 App Router, React 19, Prisma 7, Tailwind CSS v4, shadcn primitives on Base UI.
- Email and password authentication through Better Auth, with an admin role.
- Wallpapers carry thumbnails at 400, 800, and 1920 pixels, a blur placeholder, dimensions, format, file size, aspect ratio, and dominant colors.
- Moderation statuses: pending, approved, rejected. Reports cover spam, nudity, copyright, violence, and other.
- Upload limit is five per hour per user. Downloads are proxied through the app for tracking.
- All application routes (`/browse`, `/collections`, `/u/[handle]`, `/dashboard`, `/upload`, `/profile`, `/settings`, `/admin`, `/api/images/*`, and `/api/upload/*`) are private and require an authenticated session. Only `/`, `/sign-up`, `/forgot-password`, and `/api/health` are accessible before sign-in, and unauthenticated entry pages display zero user-uploaded wallpaper thumbnails.
- Password reset is admin-assisted via temporary password generation with mandatory password rotation and session revocation. Settings pages are limited to real backed user actions.

## Brand Commitments

- Name: Lumiwalls. Tagline: Light up your screen.
- The incumbent visual world is an achromatic cinematic dark gallery: near-black surfaces, ambient gradient washes, oversized imagery, restrained type, and photography as the primary content.
- Existing fonts, palette, Base UI primitives, and route structure stay unless the user explicitly changes them.

## Evidence on Hand

- Working application with seeded content, real wallpaper records, and real upload and moderation flows.
- `docs/features-list.md` records the architecture, data model, and roadmap.
- `prisma/schema.prisma` is the source of truth for content and moderation capabilities.
- No marketing site, testimonials, customer logos, or press assets exist. Future work must not fabricate them.

## Product Principles

1. The wallpaper is the interface. Chrome recedes so the image leads.
2. Curation is the product. Never imply volume or openness the moderation queue does not deliver.
3. One gallery, one system. Browse, profiles, admin, and auth should read as the same product.
4. Download is the job. Every browse surface keeps the path to a download short.
5. Finish the states. Empty, loading, error, and first-run states are part of the product, not leftovers.
