# Lumiwalls Implementation Plan

**Tagline:** Light up your screen

---

## 1. Architecture Overview

The application follows a Next.js 16 App Router pattern using Server Components for data fetching and Server Actions for mutations. Route Handlers are reserved for file proxying, OG image generation, and webhook endpoints.

**State Management Strategy:**

- Jotai handles global client UI state for modals, upload queues, and toast triggers.
- nuqs manages URL-as-state for filters, search queries, and pagination.
- React Server Components handle data fetching where possible to minimize client-side JavaScript.

**File Upload Flow:**

The client selects files using use-file-picker, then requests a presigned URL via a Server Action. The file uploads directly to Backblaze B2. After upload completes, the client notifies the server, which triggers sharp for thumbnail generation and metadata extraction. The processed data is then written to the Prisma database, placing the wallpaper into the Moderation Queue.

---

## 2. Database Schema (Prisma)

BetterAuth 1.6 manages its core authentication tables via the Prisma adapter. The application extends the generated User model with app-specific relations.

**Core Models (remaining):**

- **User:** Extended from BetterAuth with fields for name, email, avatar, role, and relations to favorites, collections, ratings, follows, reports, downloads, and views.
- **Session:** Managed by BetterAuth for authentication state.
- **Favorite:** One-click heart system linking users to wallpapers, with uniqueness constraint per user-wallpaper pair.
- **Collection (Board):** User-created named collections with public/private toggle, containing ordered wallpaper references.
- **Rating:** 1–5 star scoring per wallpaper per user, with aggregate average stored on the wallpaper for fast reads.
- **Follow:** Bidirectional relationship allowing users to follow uploaders and curators for a personalized feed.
- **Report:** User-submitted reports for copyright, NSFW, or quality issues, with pending, resolved, and dismissed statuses.
- **EditorialCollection:** Admin-curated themed collections (seasonal, event-based, artist spotlights) with active status and sort ordering.
- **FeaturedWallpaper:** Scheduled hero, trending, and seasonal placements with active date ranges.
- **DownloadLog & ViewLog:** Analytics tracking tables recording IP addresses, user agents, and timestamps for engagement metrics.

**Indexing Strategy:**

Indexes are placed on slug lookups, category and uploader foreign keys, public content filtering by creation date, perceptual hash for duplicate detection, aspect ratio for filtering, featured and editor pick flags, and average rating for sorting.

---

## 3. Backend Architecture

### Authentication (BetterAuth 1.6)

BetterAuth is configured with the Prisma adapter for PostgreSQL. Email and password authentication is enabled with auto sign-in after registration. The admin plugin provides role-based access control. The User model is extended with a role field defaulting to user.

Admin route protection checks the session role and redirects non-admin users to the homepage.

### File Storage (Backblaze B2)

The AWS SDK v3 S3 client is configured for Backblaze B2 compatibility using path-style URLs. The endpoint, region, and credentials are drawn from environment variables.

Presigned upload URLs are generated with a five-minute expiry, allowing the client to upload directly to B2 without routing large files through the application server.

**Bucket Structure:**

- Original files are stored under wallpapers/{userId}/{uuid}-{name}.
- Thumbnails are organized under wallpapers/{userId}/thumb-{size}-{uuid}.webp for 400px, 800px, and 1920px variants.

### Image Processing Pipeline

The pipeline receives a `Buffer` from S3 via `GetObjectCommand`, applies `sharp().rotate()` for EXIF auto-orient and strip, extracts metadata, generates a 10px blur placeholder, buckets aspect ratio, and creates three WebP thumbnails (400, 800, 1920) with `p-limit` concurrency 3, uploading via `uploadWebpToS3`.

Remaining:

- Dominant color extraction using node-vibrant.
- Perceptual hash computation for duplicate detection.

### Server Actions Structure

Plain `"use server"` actions with `auth.api.getSession` guards and `zod` validation (no `next-safe-action`). Admin actions verify `session.user.role === "admin"` and use `revalidatePath` after mutations.

---

## 4. Frontend Architecture

### Project Structure

The codebase is organized into route groups, components, actions, hooks, and libraries.

- The main route group contains the public-facing site with the homepage, browse page, wallpaper detail view, public user profiles, user collections, and private dashboard.
- The admin route group contains the moderation dashboard, user management, analytics, and report center, protected by a dedicated sidebar layout.
- API routes handle the BetterAuth catch-all endpoint, dynamic OG image generation, and tracked download proxying.
- Components are organized by domain: UI primitives from shadcn, layout elements, wallpaper-specific components, upload flows, collection interfaces, and admin tables.
- Server Actions are grouped by domain: wallpaper, upload, collection, user, and admin operations.
- Custom hooks manage wallpaper data fetching, upload queue state, and filter synchronization.

### URL State Management (nuqs)

Wallpaper filters are synchronized with the URL using nuqs parse helpers. The filter state includes search query, category, aspect ratio, color, sort order, and pagination. This enables shareable filtered views and preserves state across browser navigation.

### Masonry Grid

The browse page uses react-masonry-css with responsive breakpoint columns: four columns on large desktops, three on standard desktops and tablets, two on small tablets, and one on mobile. Each column has consistent left padding and background clipping.

---

## 5. Key Implementation Details

### Upload Flow

Because Server Actions have payload size limits, the upload flow uses presigned URLs for direct-to-B2 transfers. The process works in two phases:

1. The client initiates an upload by submitting metadata (title, description, category, tags). The server creates a pending database record and returns a presigned URL along with the target object key.
2. The client uploads the file directly to B2, then calls a finalize action. The server fetches the file from B2, runs the image processing pipeline, uploads the generated thumbnails back to B2, updates the database record with metadata and URLs, and places the wallpaper into the Moderation Queue.

### OG Image Generation

Since the application deploys on Render rather than Vercel, OG images are generated using satori for JSX-to-SVG conversion and resvg for SVG-to-PNG rasterization. The endpoint accepts a wallpaper slug, fetches the relevant data, renders a branded social card, and returns the PNG with a 24-hour cache header.

### Search Implementation

PostgreSQL's pg_trgm extension enables fuzzy text search on wallpaper titles. A GIN index on the title column supports fast similarity queries. The search action returns up to twenty results ordered by title similarity, filtered to only publicly approved wallpapers.

### Duplicate Detection

During upload finalization, the perceptual hash of the new image is compared against existing wallpapers using Hamming distance. If any existing wallpaper has a distance below a threshold of ten bits, the upload is flagged as a potential duplicate for admin review or automatic rejection.

---

## 6. Additional Recommended Libraries

- **satori and resvg:** Required for OG image generation on non-Vercel hosting.
- **use-debounce:** Prevents excessive API calls during live search input.
- **react-intersection-observer:** Powers infinite scroll loading in the masonry grid.
- **rate-limiter-flexible:** Protects download endpoint with PostgreSQL-backed rate limiting (upload limit already implemented via 5/hour count).
- **prisma-kysely or raw queries:** Handles complex analytics aggregations that exceed Prisma's query builder capabilities.
- **upstash-redis:** Offers an alternative caching and rate limiting backend with a generous free tier.

---

## 7. Implementation Roadmap

### Sprint 1: Core Discovery (Days 6–12)

- Build the wallpaper browse page with the masonry grid layout.
- Implement the filter sidebar for category, aspect ratio, color, and resolution.
- Integrate nuqs-based URL state synchronization for all filters.
- Create the wallpaper detail page with metadata panel and related wallpapers.
- Implement the favorites system with optimistic UI updates.
- Generate dynamic OG images for individual wallpaper pages.
- Add structured data markup for search engine indexing.
- Implement fuzzy search using pg_trgm.

**Deliverable:** Users can browse, filter, search, and favorite wallpapers.

### Sprint 2: Upload Pipeline (remaining)

- Integrate node-vibrant for dominant color extraction.
- Implement perceptual hash generation for duplicate detection.
- Build the user dashboard showing upload counts, favorite counts, and personal stats.
- Build public profile pages for uploaders.

**Deliverable:** Upload enrichment and user pages.

### Sprint 3: Social Features (Days 20–26)

- Implement collections (boards) with create, read, update, and delete operations.
- Allow adding and removing wallpapers from collections.
- Build the 1–5 star rating system with aggregate score display.
- Implement the follow and unfollow system for users.
- Create a personalized feed page showing wallpapers from followed uploaders.
- Build the report system for copyright, NSFW, and quality issues.
- Integrate toast notifications using sonner.

**Deliverable:** The full social layer is operational.

### Sprint 4: Admin Panel (remaining)

- Build the moderation dashboard with approve, reject, and flag actions.
- Add bulk moderation capabilities.
- Implement editorial collections management.
- Build featured wallpaper scheduling.
- Create user management tools for search, suspension, and banning.
- Build the report center for reviewing and resolving user reports.
- Create an analytics dashboard using recharts for downloads, top wallpapers, and user signups.

**Deliverable:** Administrators can manage all content, users, and platform analytics.

### Sprint 5: Polish and Performance (remaining)

- Add infinite scroll to the browse page using intersection observers.
- Implement rate limiting on downloads (upload limit 5/hour already done).
- Generate dynamic XML sitemaps.
- Add error boundaries and loading skeletons throughout the application.
- Apply motion.dev animations for page transitions, hover states, and micro-interactions.
- Conduct a full responsive audit for mobile masonry grids and touch targets.

**Deliverable:** A production-ready, performant application.

### Sprint 6: Launch Preparation (Days 41–45)

- Audit all environment variables for correctness and security.
- Configure Backblaze B2 CORS rules to allow only the Render domain.
- Optimize Neon connection pooling with appropriate connection limits.
- Finalize Render auto-deploy configuration.
- Conduct a security audit including CSP headers and CSRF protection.
- Perform load testing on the browse page and download endpoints.
- Write documentation including README, API overview, and admin guide.

**Deliverable:** Public launch of Lumiwalls.

---

## 8. Deployment Configuration

### Render Environment Variables

- Database URL pointing to Neon with SSL and connection pooling enabled.
- BetterAuth secret and public URL for session management.
- Backblaze B2 endpoint, key ID, application key, bucket name, and public URL.

### Render Build Configuration

The build process installs dependencies, generates the Prisma client, and runs the Next.js build. The start process deploys pending migrations before launching the application server. Node version 22 is specified.

### Neon Considerations

Connection pooling is essential for serverless environments. Use the pooler URL or append a connection limit parameter to the database URL. The Prisma client is instantiated as a singleton to prevent connection exhaustion during development hot reloading.

---

## 9. Security and Performance Checklist (remaining)

- **Rate Limiting (downloads):** One hundred downloads per hour per IP address (upload 5/hour already enforced).
- **CORS:** Backblaze B2 bucket CORS is restricted to the production Render domain (pending audit).
- **SQL Injection:** All queries use Prisma ORM with parameterized statements.
- **XSS:** React's default escaping is relied upon; no raw HTML injection from user input is permitted.

---

## 10. Open Questions to Resolve

1. **Image CDN:** Will Cloudflare or another CDN sit in front of Backblaze B2, or will images be served directly from B2? This affects the Next.js image domain configuration.
2. **Background Processing:** For heavy 4K and 8K uploads, should a background job queue like Trigger.dev, Inngest, or BullMQ be introduced, or should processing remain synchronous within the request?
3. **Color Filtering:** Should node-vibrant's exact hex codes be bucketed into named color categories (Red, Blue, Green) for user-friendly filtering, or should filtering use exact hex proximity?
4. **Download Tracking:** Should downloads route through the application API to capture analytics, or should users receive direct links to B2? Direct links reduce server load but sacrifice download analytics.
