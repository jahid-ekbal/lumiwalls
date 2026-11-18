---
goal: Move the Storage section from the Admin Dashboard to Analytics, expand its metrics, and add CSV export
version: 1.0
date_created: 2026-11-18
last_updated: 2026-11-18
owner: Lumiwalls admin
status: "Planned"
tags: [feature, refactor, analytics, admin]
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

Move the Storage card off the Admin Dashboard and make it the final full-width section of the Analytics page. While moving, expand it with file counts, average file size, approval counts, visibility counts, and a per-format breakdown, and add a CSV export that contains both summary metrics and per-format rows. The Storage numbers remain all-time and must not react to the Analytics 7/30/90 day range selector.

## 1. Requirements & Constraints

- **REQ-001**: Remove the Storage card from `/admin` completely. After the change, `/admin` must not render a Storage heading or Storage card, and must not import `DashboardStorage` or `StorageSkeleton` from the admin `_components` folder.
- **REQ-002**: Add a Storage card as the final, full-width section of `/admin/analytics`, after the Moderation health and Curation snapshot grid.
- **REQ-003**: Storage values are all-time totals and must be labeled as all-time. The `range` query parameter (7, 30, 90) must not change any storage number.
- **REQ-004**: Expand the card beyond the four existing chips. It must show total storage bytes, total files, average file size, approved count, not approved count, not public count, distinct format count, and a per-format table with format, wallpaper count, and bytes.
- **REQ-005**: Add an Export CSV button that downloads one `storage.csv` file containing both summary metric rows and per-format rows under a single header: `section,metric,format,files,bytes`.
- **REQ-006**: Preserve all existing Analytics behavior: the range selector, trend chart, Top by views, Top by downloads, Top categories, Top tags, Top uploaders, Moderation health, Curation snapshot, and their existing CSV exports.
- **REQ-007**: Use the existing Prisma singleton from `@/lib/database/dbClient`. Do not add dependencies, API routes, or database migrations.
- **REQ-008**: Keep the user-facing dashboard storage card at `src/app/(private)/dashboard/_components/dashboard-storage.tsx` unchanged.
- **SEC-001**: The page remains protected by the existing private route guard in `proxy.ts`. No new public endpoint or server action is created.
- **CON-001**: No new npm packages.
- **CON-002**: No changes to `prisma/schema.prisma`.
- **CON-003**: Reuse integer byte formatting logic. Do not introduce a date or unit formatting library.
- **CON-004**: No em dashes in code, comments, metadata, or documentation.
- **GUD-001**: Reuse the existing `downloadCSV` helper in `src/components/Admin/AnalyticsClient.tsx` instead of creating a second CSV implementation.
- **GUD-002**: Fetch storage data inside the existing `Promise.all` in `AnalyticsContent` and render it in `AnalyticsClient`, matching the current Analytics data flow.
- **PAT-001**: Follow the existing Analytics card pattern: `Card` with `CardHeader`, `CardTitle`, `CardDescription`, and an outline `Button size="sm"` carrying a lucide icon for export.
- **PAT-002**: Follow the Platform overview tile styling: `bg-muted rounded-2xl p-3` with a `text-muted-foreground text-xs` label and a `text-xl font-semibold` value.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Extend the Analytics server data layer with storage aggregates and expose them to the client component.

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Completed | Date |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-001 | In `src/app/(private)/admin/analytics/_components/analytics-content.tsx`, append three queries to the existing `Promise.all` array after `flaggedPick`: (1) `prisma.wallpaper.groupBy({ by: ["isApproved"], _count: { _all: true, fileSize: true }, _sum: { fileSize: true } })`; (2) `prisma.wallpaper.count({ where: { isPublic: false } })`; (3) `prisma.wallpaper.groupBy({ by: ["format"], _count: { _all: true }, _sum: { fileSize: true } })`. Destructure them as `storageApprovalGroups`, `hiddenWallpaperCount`, and `storageFormatGroups`. |           |      |
| TASK-002 | Below the existing destructuring, derive storage values. Find the approved and not approved rows from `storageApprovalGroups` by `isApproved`. Compute `approvedCount`, `approvedBytes`, `notApprovedCount`, `notApprovedBytes`, `totalFiles = approvedCount + notApprovedCount`, `totalBytes = approvedBytes + notApprovedBytes`, `sizedFiles = approved _count.fileSize + notApproved _count.fileSize`, and `averageBytes = sizedFiles === 0 ? 0 : Math.round(totalBytes / sizedFiles)`. Treat every `_sum.fileSize` null as 0.                     |           |      |
| TASK-003 | Build `storageFormatRows` from `storageFormatGroups`. Normalize `row.format ?? "unknown"` and merge duplicate normalized keys into a `Map` of `{ format, files, bytes }`. Sort by `bytes` descending, then `files` descending, then `format.localeCompare` ascending. Set `formatCount = storageFormatRows.length`.                                                                                                                                                                                                                                   |           |      |
| TASK-004 | Add a `storage` prop to the `AnalyticsClient` JSX return with shape `{ totalFiles, totalBytes, sizedFiles, averageBytes, approvedCount, approvedBytes, notApprovedCount, notApprovedBytes, hiddenCount: hiddenWallpaperCount, formatCount, formats: storageFormatRows }`.                                                                                                                                                                                                                                                                             |           |      |
| TASK-005 | In `src/components/Admin/AnalyticsClient.tsx`, add `DownloadIcon` to a new `lucide-react` import. Add types `StorageFormat = { format: string; files: number; bytes: number }` and `StorageSummary` containing every field from TASK-004. Add `storage: StorageSummary` to `Props`.                                                                                                                                                                                                                                                                   |           |      |

### Implementation Phase 2

- GOAL-002: Render the expanded Storage card at the bottom of Analytics and implement its CSV export.

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Completed | Date |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-006 | In `src/components/Admin/AnalyticsClient.tsx`, add a `formatBytes` helper above the component, copied from the removed admin implementation. Return `"0 B"` for `0`. Use units `B`, `KB`, `MB`, `GB`, `TB`. Use no decimal for exponent 0 or values of 10 or more, and one decimal for values below 10.                                                                                                                                                                                                                                                                                                                                                                                                                                                         |           |      |
| TASK-007 | In the `AnalyticsClient` return tree, insert a full-width `Card` as the last child of the outer `grid gap-6` container, after the final `xl:grid-cols-2` grid that holds Moderation health and Curation snapshot. Header: `CardTitle` "Storage" and `CardDescription` "All-time library footprint by filesize, approval state, and file format".                                                                                                                                                                                                                                                                                                                                                                                                                |           |      |
| TASK-008 | In the Storage card content, render six tiles using the PAT-002 styling in a `grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6` container: "Total storage" with `formatBytes(storage.totalBytes)`, "Files" with `storage.totalFiles.toLocaleString()`, "Average file size" with `formatBytes(storage.averageBytes)`, "Approved" with `storage.approvedCount.toLocaleString()`, "Not approved" with `storage.notApprovedCount.toLocaleString()`, "Not public" with `storage.hiddenCount.toLocaleString()`.                                                                                                                                                                                                                                                   |           |      |
| TASK-009 | Below the tiles, add a small "By format" label and a `Table` with headers `Format`, `Wallpapers`, `Size`. Render one row per `storage.formats` item using `row.format`, `row.files.toLocaleString()`, and `formatBytes(row.bytes)`. When the array is empty, render one row with a `TableCell colSpan={3}` empty state "No wallpapers yet".                                                                                                                                                                                                                                                                                                                                                                                                                     |           |      |
| TASK-010 | Add an `exportStorageCSV` callback inside `AnalyticsClient` that calls `downloadCSV("storage.csv", ["section", "metric", "format", "files", "bytes"], rows)`. Rows in exact order: `["Summary", "Total storage", "", "", storage.totalBytes]`, `["Summary", "Files", "", storage.totalFiles, ""]`, `["Summary", "Average file size", "", storage.sizedFiles, storage.averageBytes]`, `["Summary", "Approved", "", storage.approvedCount, storage.approvedBytes]`, `["Summary", "Not approved", "", storage.notApprovedCount, storage.notApprovedBytes]`, `["Summary", "Not public", "", storage.hiddenCount, ""]`, `["Summary", "Distinct formats", "", storage.formatCount, ""]`, then `["Format", "", row.format, row.files, row.bytes]` for each format row. |           |      |
| TASK-011 | Add the Export CSV `Button size="sm" variant="outline"` to the Storage card header, calling `exportStorageCSV`, with `<DownloadIcon data-icon="inline-start" />` and the label "Export CSV". Place it inside a `flex flex-wrap items-center justify-between gap-3` wrapper, matching the other Analytics card headers.                                                                                                                                                                                                                                                                                                                                                                                                                                          |           |      |

### Implementation Phase 3

- GOAL-003: Remove the Storage section from the Admin Dashboard and delete code that becomes unused.

| Task     | Description                                                                                                                                                                                                                                                                                                         | Completed         | Date                                                                                            |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------- |
| TASK-012 | In `src/app/(private)/admin/page.tsx`, remove `StorageSkeleton` from the `./_components/dashboard-skeletons` import list, remove the `import DashboardStorage from "./_components/dashboard-storage";` line, and remove the final `<Suspense fallback={<StorageSkeleton />}><DashboardStorage /></Suspense>` block. |                   |                                                                                                 |
| TASK-013 | Delete `src/app/(private)/admin/_components/dashboard-storage.tsx`.                                                                                                                                                                                                                                                 |                   |                                                                                                 |
| TASK-014 | In `src/app/(private)/admin/_components/dashboard-skeletons.tsx`, delete the entire `StorageSkeleton` export. Keep `LinksSkeleton`, `MonitorsSkeleton`, `StatsSkeleton`, `TrendSkeleton`, and `WatchlistSkeleton` intact.                                                                                           |                   |                                                                                                 |
| TASK-015 | Run `rg "StorageSkeleton                                                                                                                                                                                                                                                                                            | dashboard-storage | DashboardStorage" src/app/(private)/admin`and confirm zero matches. Confirm`rg "StorageSkeleton | dashboard-storage" src/app/(private)/dashboard` still returns its own independent matches, which must not be touched. |     |     |

### Implementation Phase 4

- GOAL-004: Verify the change end to end using the repository verification rules.

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                       | Completed | Date |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-016 | Check port 3000 with `Get-NetTCPConnection -LocalPort 3000`. If the dev server is listening, run `bun lint` only. If the port is free, run `bun lint:check`. Run `bun run build` only when the port is free.                                                                                                                                                                      |           |      |
| TASK-017 | With the dev server running, use `playwright-cli open http://localhost:3000 --headed`, sign in with the seeded admin account, and verify `/admin` no longer shows a Storage card. Then navigate to `/admin/analytics` and verify the Storage card is the last section with six tiles and a by-format table.                                                                       |           |      |
| TASK-018 | On `/admin/analytics`, switch the trend range to `Last 7 days` and then `Last 90 days`. Confirm every Storage value is identical across both selections.                                                                                                                                                                                                                          |           |      |
| TASK-019 | Click the Storage Export CSV button using `playwright-cli run-code` with `page.waitForEvent("download")`. Confirm the downloaded filename is `storage.csv` and that the file starts with `section,metric,format,files,bytes`, contains at least one `Summary` row and one `Format` row, and that the total bytes value matches the on-screen Total storage after unit formatting. |           |      |
| TASK-020 | Close the Playwright browser, delete the downloaded CSV, and remove `.playwright-cli` snapshot and console artifacts. Do not delete any database rows unless verification created new ones.                                                                                                                                                                                       |           |      |

## 3. Alternatives

- **ALT-001**: Keep the Storage card on the Admin Dashboard and add a copy to Analytics. Rejected because the user chose a complete move and duplicates queries and maintenance.
- **ALT-002**: Replace the Admin Dashboard card with a link card pointing to Analytics. Rejected because the user chose complete removal.
- **ALT-003**: Keep only the Total storage number on the Admin Dashboard. Rejected for the same reason.
- **ALT-004**: Scope storage numbers to the 7/30/90 day range. Rejected because capacity is all-time and a range-scoped total would be misleading.
- **ALT-005**: Put Storage inside the Platform overview card. Rejected because the expanded content does not fit the existing six-tile row.
- **ALT-006**: Build Storage as a separate Suspense server component under the Analytics route. Rejected because Analytics already batches all server queries in one `Promise.all`, and a separate component would add files and a second data-fetching pattern without user-visible benefit.
- **ALT-007**: Export only summary metrics or only per-format rows. Rejected because the user chose both in one file.
- **ALT-008**: Create a shared `formatBytes` utility for both dashboard variants. Rejected because the user dashboard formatter has different rounding and minimum-unit behavior, and changing it is out of scope.

## 4. Dependencies

- **DEP-001**: `Wallpaper.fileSize`, `Wallpaper.format`, `Wallpaper.isApproved`, and `Wallpaper.isPublic` fields exist in `prisma/schema.prisma`.
- **DEP-002**: The Prisma client singleton is imported from `@/lib/database/dbClient`.
- **DEP-003**: The `downloadCSV` helper already exists in `src/components/Admin/AnalyticsClient.tsx`.
- **DEP-004**: `src/app/(private)/admin/analytics/page.tsx` keeps its existing Suspense boundary around `AnalyticsContent`, so the new card inherits the existing loading state.
- **DEP-005**: Manual verification uses the seeded admin account from `prisma/seed.ts` and a dev server on port 3000.

## 5. Files

- **FILE-001**: `src/app/(private)/admin/page.tsx`, modified to remove the storage imports and Suspense block.
- **FILE-002**: `src/app/(private)/admin/_components/dashboard-storage.tsx`, deleted.
- **FILE-003**: `src/app/(private)/admin/_components/dashboard-skeletons.tsx`, modified to remove the admin `StorageSkeleton` export.
- **FILE-004**: `src/app/(private)/admin/analytics/_components/analytics-content.tsx`, modified to add storage queries, derivations, and the `storage` prop.
- **FILE-005**: `src/components/Admin/AnalyticsClient.tsx`, modified to add storage types, `formatBytes`, the Storage card, and the CSV export.
- **FILE-006**: `plan/feature-storage-analytics-1.md`, this plan.

## 6. Testing

- **TEST-001**: `bun lint` passes with the dev server running, or `bun lint:check` passes when port 3000 is free.
- **TEST-002**: `/admin` renders no Storage heading, no Storage card, and no skeleton for it.
- **TEST-003**: `/admin/analytics` renders the Storage card as the last section with the six expected tiles and a by-format table containing Format, Wallpapers, and Size columns.
- **TEST-004**: Switching the trend range between 7, 30, and 90 days leaves every Storage value unchanged.
- **TEST-005**: Clicking Export CSV downloads `storage.csv` with the header `section,metric,format,files,bytes`, both `Summary` and `Format` rows, and internally consistent counts and bytes.
- **TEST-006**: No application-origin console errors appear on `/admin/analytics`. Extension-injected hydration warnings and the pre-existing avatar request to `localhost:3001` are out of scope.
- **TEST-007**: `.playwright-cli` artifacts and any downloaded CSV files are removed after verification.

## 7. Risks & Assumptions

- **RISK-001**: `Wallpaper.fileSize` is nullable, so total bytes and average size can undercount. Mitigation: sum only non-null values and compute the average over `sizedFiles`, not over all files. Export blank byte fields only where no byte value exists.
- **RISK-002**: The current "awaiting" label actually includes rejected wallpapers because it is derived as `total - approved`. Mitigation: label the new metric "Not approved" instead of "awaiting", so the number is accurate.
- **RISK-003**: Browser extensions can inject DOM attributes and create hydration warnings during manual verification. Mitigation: use the clean Playwright Chromium profile and attribute only application-origin console errors.
- **RISK-004**: Adding queries to the existing `Promise.all` slightly increases Analytics server latency. Mitigation: the three queries are grouped aggregates or counts and run in parallel with the existing work.
- **ASSUMPTION-001**: Analytics remains an admin-only page and no role changes are required.
- **ASSUMPTION-002**: The repository has no automated test framework, so lint and Playwright verification are the accepted quality gate.
- **ASSUMPTION-003**: A null `format` value should display and export as `unknown`.
- **ASSUMPTION-004**: The seeded data set may differ from the current one during verification, so tests compare on-screen values with exported values instead of hard-coded counts.

## 8. Related Specifications / Further Reading

- `AGENTS.md` verification and Playwright sections
- Prisma `groupBy` documentation: https://www.prisma.io/docs/orm/reference/prisma-client-reference#groupby
- shadcn Card documentation: https://ui.shadcn.com/docs/components/card
- shadcn Table documentation: https://ui.shadcn.com/docs/components/table
