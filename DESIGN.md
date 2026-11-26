# Lumiwalls Design System (`DESIGN.md`)

Hybrid specification combining Lumiwalls' achromatic cinematic gallery palette (`PRODUCT.md`) with Pinterest discovery geometry (`docs/pinterest-design.md`) and `base-luma` `@base-ui/react` primitives (`src/app/globals.css`).

---

## 1. Visual World & Theme Parity

- **Mode split**: Experience (Browse, Collections, Lightbox, Creator Profiles) and Operate (Dashboard, Upload, Settings, Admin).
- **Dark-first + full Light parity**: Near-black base canvas (`oklch(0.105 0 0)`) and elevated neutral dark surfaces (`oklch(0.165 0 0)`), paired with full high-contrast light mode surfaces (`oklch(1 0 0)` canvas, `oklch(0.97 0 0)` cards).
- **Single-elevation rule**: Choose either a hairline border (`border-border/70`) or scrim/backdrop elevation, never double heavy drop shadows over bordered cards.
- **Immersive image-over-scrim contrast**: Any overlay controls sitting atop photography use explicit high-contrast dark scrims (`bg-neutral-950/75 text-white ring-white/15`) so icons and actions remain readable in both Light and Dark themes.
- **Strict privacy showcase**: Unauthenticated entry surfaces (`/`, `/sign-up`, `/forgot-password`) use pure typographic and `.ambient-wash` presentation with zero uploaded wallpaper previews.

## 2. Layout & Full-Width Fluid Canvas

- **Full-width workspace**: All private pages (`Browse`, `Collections`, `Dashboard`, `Upload`, `Profile`, `Settings`, `Creators`, `Admin`) and their `loading.tsx` skeletons expand edge-to-edge across the viewport (`w-full px-4 py-6 sm:px-6 lg:px-8`) beside `AppSidebar` (`SidebarInset`), never artificially bottlenecked to narrow centered columns.
- **Discovery rhythm**: Tight `gap-3` / `gap-4` masonry gutters across responsive breakpoints (`1` col mobile, `2` col `sm`, `3` col `lg`, `4` col `xl`, `5` col `2xl`).
- **Reading measure**: Paragraph copy and form descriptions stay readable (`max-w-2xl` on copy blocks), while card grids, tables, analytics charts, and galleries claim full horizontal width.

## 3. Card Proportions, Masonry & Image Geometry

- **Discovery cards (`BrowseGrid`, `CollectionDetail`, `Profile`, `Public Profile`)**: Natural-aspect masonry preserving each wallpaper's true ratio (`width / height`, clamped safely between `0.5` and `2.5` to prevent extreme slivers) with `thumb800Url` primary thumbnails, `blurDataUrl` placeholder blur, rounded `16px` (`--radius-inset`) edges, zero internal border padding around the artwork, and subtle `1.02` hover zoom inside `overflow-hidden`.
- **Uniform grid cards (`Dashboard`, `Collections` directory, `UploadManager`, `Stats`)**: Equal-height grid tracks using flex column (`h-full flex flex-col`) and consistent `aspect-16/10` media headers so adjacent cards never stagger unevenly within non-masonry rows.
- **Touch targets**: Primary circular/pill action buttons meet WCAG 44x44px minimum hit areas on touch viewports (`min-h-11 min-w-11` in Lightbox navigation and mobile action pills).

## 4. Typography & Radii

- **Fonts**: `Noto Sans` headings (`--font-heading`) and `Nunito Sans` body (`--font-sans`), loaded via `src/lib/fonts.ts`, with `tabular-nums` on counts, analytics tables, and dimensions.
- **No em dashes**: Use commas, colons, semicolons, or parentheses across all UI copy and code comments.
- **Radius ladder**: `16px` (`--radius-inset`) for cards, thumbnails, and inputs; `22px` (`--radius-surface`) for large surfaces and dialogs; `9999px` (`--radius-badge`) for filter pills, tags, avatars, and floating overlay controls.

## 5. Motion & View Transitions

- Honor `prefers-reduced-motion: reduce` everywhere (disabling `.ambient-wash`, `.gallery-stagger`, card hover scales, and smooth transitions).
- Use React `<ViewTransition>` and `addTransitionType` strictly where continuity adds clarity (hero/gallery preview transitions and ordered Next/Previous frame slides), never as scattershot decorative loops.
