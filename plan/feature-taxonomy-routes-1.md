---
goal: Split the combined Taxonomy admin page into independent Categories and Tags routes
version: 1.0
date_created: 2026-11-19
last_updated: 2026-11-19
owner: Lumiwalls admin
status: "Planned"
tags: [feature, refactor, admin, routing]
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

Replace the single `/admin/taxonomy` page, which uses local tab state to switch between two tables, with two independent admin routes: `/admin/categories` and `/admin/tags`. Each route gets its own page, data loader, client component, server actions, loading skeleton, and error boundary. The two feature areas share no module, so no taxonomy-named file remains. A permanent 308 redirect keeps old `/admin/taxonomy` links working by sending them to `/admin/categories`.

This is a structural move. Category fields (name, slug, icon, color), tag fields (lowercase name, slug), tables, dialogs, validation, and behavior stay exactly as they are. Navigation, route metadata, and required copy are the only user-visible changes beyond the page split.

## 1. Requirements & Constraints

- **REQ-001**: Create `/admin/categories` as an independent route that lists, creates, edits, and deletes categories with the same fields and dialogs as today.
- **REQ-002**: Create `/admin/tags` as an independent route that lists, creates, edits, and deletes tags with the same fields and dialogs as today.
- **REQ-003**: Delete the `/admin/taxonomy` route, its content loader, its combined client component, and its combined action file.
- **REQ-004**: Permanently redirect `/admin/taxonomy` to `/admin/categories` with status 308 using `redirects()` in `next.config.ts`.
- **REQ-005**: Categories and tags must be fully independent copies. Do not create a shared helper module, shared client component, or shared action file. `requireAdmin`, `mapUniqueViolation`, and category icon validation are duplicated where needed.
- **REQ-006**: Replace the single Taxonomy sidebar item with two flat entries, Categories and Tags. Categories uses `LayoutGridIcon`, Tags uses `TagsIcon`.
- **REQ-007**: Point the existing Categories and Tags cards in `dashboard-links.tsx` at the new routes.
- **REQ-008**: Rename the dashboard stat tile from "Taxonomy" to "Categories and tags" while keeping the combined count and the description `${categoryCount} categories, ${tagCount} tags`.
- **REQ-009**: Add `loading.tsx` and `error.tsx` to both new routes with route-specific copy and paths.
- **REQ-010**: Keep the pure move scope. Do not add search, sorting, bulk actions, cross-links, new fields, or new validation rules.
- **REQ-011**: Update remaining taxonomy copy in the upload form and the schema comment so "Taxonomy" disappears from the app. The only permitted match after the change is the redirect `source` in `next.config.ts`.
- **REQ-012**: Preserve each action's existing revalidation behavior, changing only the admin path: category create and update revalidate `/admin/categories`, `/upload`, and `/upload/new`; category delete revalidates `/admin/categories` and `/upload`; every tag action revalidates `/admin/tags` and `/upload`.
- **SEC-001**: Both routes stay admin-only through the existing admin layout session check. No auth logic, role logic, or proxy rule changes.
- **CON-001**: No new npm packages.
- **CON-002**: No changes to `prisma/schema.prisma`, migrations, API routes, or environment variables.
- **CON-003**: No em dashes in code, comments, metadata, error copy, or documentation.
- **CON-004**: Do not modify `package.json` scripts.
- **GUD-001**: Copy the existing category and tag behavior verbatim rather than rewriting it. Preserve toast messages, dialog copy, disabled states, and empty states.
- **GUD-002**: Use the existing `BoundaryErrorCard` and `createMetadata` helpers.
- **PAT-001**: Route files follow the existing admin pattern: `page.tsx` with metadata and a Suspense fallback, plus colocated `loading.tsx` and `error.tsx`.
- **PAT-002**: New client components live in `src/components/Admin/`, matching the current `TaxonomyClient.tsx` location.
- **PAT-003**: New data loaders live under each route's `_components` folder and use the Prisma singleton from `@/lib/database/dbClient`.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Build the independent Categories route, its actions, data loader, client component, and route boundaries.

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Completed | Date |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-001 | Create `src/server/actions/categories.ts` with `"use server"`. Copy `requireAdmin`, `mapUniqueViolation`, `getValidIconNames`, `validateIcon`, `createCategory`, `updateCategory`, and `deleteCategory` from `src/server/actions/taxonomy.ts` without behavior changes. Remove every tag import and tag action. Imports are `revalidatePath`, `headers`, `Prisma`, `auth`, the Prisma singleton, `slugify`, and `categoryCreateSchema` / `categoryUpdateSchema`. Replace every `revalidatePath("/admin/taxonomy")` with `revalidatePath("/admin/categories")`. Preserve the existing pattern where create and update also revalidate `/upload` and `/upload/new`, and delete revalidates `/upload`.                                                |           |      |
| TASK-002 | Create `src/app/(private)/admin/categories/_components/categories-content.tsx`. It must be an async server component that queries only `prisma.category.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { wallpapers: true } } } })` and renders `CategoryClient` with a `categories` prop. Do not query tags.                                                                                                                                                                                                                                                                                                                                                                                                                   |           |      |
| TASK-003 | Create `src/components/Admin/CategoryClient.tsx` as a `"use client"` component whose only prop is `categories: CategoryRow[]`. Copy the category half of `TaxonomyClient.tsx` verbatim: the local `CategoryRow` type, category form, slug derivation effect, icon preview logic, create and edit handlers, delete handler, category table, category dialog, and category delete confirmation. Remove all tag state, tag form, tag handlers, tag table, tag dialog, tag delete confirmation, tab state, and tab buttons. Imports only the category actions from `@/server/actions/categories` and only category schemas from `@/lib/zodSchema`. Keep `icons`, `FolderIcon`, `Loader2Icon`, `PencilIcon`, `PlusIcon`, `TrashIcon`, and `LucideIcon`. |           |      |
| TASK-004 | In `CategoryClient.tsx`, replace the combined page header. Use `h1` text "Categories" and paragraph text "Manage categories for wallpapers. Changes reflect in the upload page." Keep the category card title "Categories", description "Organize wallpapers into browsable categories", the Add Category button, the empty state, the table columns Name, Slug, Wallpapers, Actions, and every dialog string unchanged.                                                                                                                                                                                                                                                                                                                           |           |      |
| TASK-005 | Create `src/app/(private)/admin/categories/page.tsx`. Use `createMetadata({ title: "Categories", description: "Manage wallpaper categories on Lumiwalls" })`. Render a `div` with `grid gap-6`, a local `CategoriesFallback` card skeleton with six rows, and a `Suspense` boundary around `<CategoriesContent />`. Match the structure of the deleted taxonomy page minus the tab controls.                                                                                                                                                                                                                                                                                                                                                       |           |      |
| TASK-006 | Create `src/app/(private)/admin/categories/loading.tsx`. Reuse the taxonomy skeleton layout but drop the two tab-button skeletons. Keep the page header skeleton (title and description) and the card with a short title, description, and six `h-12` row skeletons.                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |           |      |
| TASK-007 | Create `src/app/(private)/admin/categories/error.tsx` as a client component using `BoundaryErrorCard`. Use title "Could not load categories", description "Something went wrong while loading categories. Please try again.", `route="/admin/categories"`, `backHref="/admin"`, and `backLabel="Back to dashboard"`. Accept `error`, optional `reset`, and optional `unstable_retry`.                                                                                                                                                                                                                                                                                                                                                              |           |      |

### Implementation Phase 2

- GOAL-002: Build the independent Tags route, its actions, data loader, client component, and route boundaries.

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Completed | Date |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-008 | Create `src/server/actions/tags.ts` with `"use server"`. Copy `requireAdmin`, `mapUniqueViolation`, `createTag`, `updateTag`, and `deleteTag` from `src/server/actions/taxonomy.ts` without behavior changes. Remove every category import and category action, and do not copy `getValidIconNames` or `validateIcon` because tags do not use icons. Copy the lowercase normalization exactly. Replace every `revalidatePath("/admin/taxonomy")` with `revalidatePath("/admin/tags")` and keep `/upload` revalidation on every tag action.                                                                                                                                                                                         |           |      |
| TASK-009 | Create `src/app/(private)/admin/tags/_components/tags-content.tsx`. It must be an async server component that queries only `prisma.tag.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { wallpapers: true } } } })` and renders `TagClient` with a `tags` prop. Do not query categories.                                                                                                                                                                                                                                                                                                                                                                                                                         |           |      |
| TASK-010 | Create `src/components/Admin/TagClient.tsx` as a `"use client"` component whose only prop is `tags: TagRow[]`. Copy the tag half of `TaxonomyClient.tsx` verbatim: the local `TagRow` type, tag form, slug derivation effect, create and edit handlers, delete handler, tag table, tag dialog, and tag delete confirmation. Remove all category state, category form, icon and color state, category handlers, category table, category dialog, category delete confirmation, tab state, and tab buttons. Imports only the tag actions from `@/server/actions/tags` and only tag schemas from `@/lib/zodSchema`. Keep `TagsIcon`, `Loader2Icon`, `PencilIcon`, `PlusIcon`, and `TrashIcon`. Do not import `icons` or `LucideIcon`. |           |      |
| TASK-011 | In `TagClient.tsx`, replace the combined page header. Use `h1` text "Tags" and paragraph text "Manage tags for wallpapers. Changes reflect in the upload page." Keep the tag card title "Tags", description "Tags users can select during upload (max 10 per wallpaper)", the Add Tag button, the empty state, the table columns Name, Slug, Wallpapers, Actions, and every dialog string unchanged.                                                                                                                                                                                                                                                                                                                               |           |      |
| TASK-012 | Create `src/app/(private)/admin/tags/page.tsx`. Use `createMetadata({ title: "Tags", description: "Manage wallpaper tags on Lumiwalls" })`. Render a `div` with `grid gap-6`, a local `TagsFallback` card skeleton with six rows, and a `Suspense` boundary around `<TagsContent />`.                                                                                                                                                                                                                                                                                                                                                                                                                                              |           |      |
| TASK-013 | Create `src/app/(private)/admin/tags/loading.tsx`. Use the same standalone skeleton structure as the categories loading file: header skeleton plus one card with six row skeletons. No tab controls.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |           |      |
| TASK-014 | Create `src/app/(private)/admin/tags/error.tsx` as a client component using `BoundaryErrorCard`. Use title "Could not load tags", description "Something went wrong while loading tags. Please try again.", `route="/admin/tags"`, `backHref="/admin"`, and `backLabel="Back to dashboard"`. Accept `error`, optional `reset`, and optional `unstable_retry`.                                                                                                                                                                                                                                                                                                                                                                      |           |      |

### Implementation Phase 3

- GOAL-003: Update navigation, dashboard entry points, the dashboard stat tile, and remaining taxonomy copy to point at the new routes.

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                           | Completed | Date |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-015 | In `src/components/Sidebar/AppSidebar.tsx`, add `LayoutGridIcon` to the `lucide-react` import. Replace the single `{ title: "Taxonomy", url: "/admin/taxonomy", icon: TagsIcon }` entry with `{ title: "Categories", url: "/admin/categories", icon: LayoutGridIcon }` followed by `{ title: "Tags", url: "/admin/tags", icon: TagsIcon }`. Keep the order Dashboard, Categories, Tags, Moderation, Users, Reports, Collections, Featured, Analytics. |           |      |
| TASK-016 | In `src/app/(private)/admin/_components/dashboard-links.tsx`, change the Categories card `href` from `/admin/taxonomy` to `/admin/categories` and the Tags card `href` from `/admin/taxonomy` to `/admin/tags`. Keep both `as Route` casts and all descriptions unchanged.                                                                                                                                                                            |           |      |
| TASK-017 | In `src/app/(private)/admin/_components/dashboard-stats.tsx`, change the stat title from "Taxonomy" to "Categories and tags". Keep the value `(categoryCount + tagCount).toLocaleString()`, the description `${categoryCount} categories, ${tagCount} tags`, and the `TagsIcon`.                                                                                                                                                                      |           |      |
| TASK-018 | In `src/components/Upload/UploadForm.tsx`, change the empty-tags alert copy from "An admin needs to create tags in Taxonomy before you can tag wallpapers." to "An admin needs to create tags in Tags before you can tag wallpapers." Keep the line wrapping style and do not change any other copy.                                                                                                                                                  |           |      |
| TASK-019 | In `src/lib/zodSchema.ts`, change the section comment `// ── Taxonomy (admin) ─────────────────────────────────` to `// ── Categories and tags (admin) ─────────────────────`. Do not change either schema.                                                                                                                                                                                                                                           |           |      |

### Implementation Phase 4

- GOAL-004: Remove the taxonomy route and all taxonomy-named code, then add the permanent redirect.

| Task     | Description                                                                                                                                                                                                                                                                                    | Completed | Date |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-020 | In `next.config.ts`, add an `async redirects()` method to `nextConfig` returning one entry: `{ source: "/admin/taxonomy", destination: "/admin/categories", permanent: true }`. Place it beside the existing `reactCompiler` and `typedRoutes` keys. Do not add a `basePath` or locale option. |           |      |
| TASK-021 | Delete the taxonomy route files: `src/app/(private)/admin/taxonomy/page.tsx`, `src/app/(private)/admin/taxonomy/loading.tsx`, `src/app/(private)/admin/taxonomy/error.tsx`, and `src/app/(private)/admin/taxonomy/_components/taxonomy-content.tsx`. Remove the now-empty `taxonomy` folders.  |           |      |
| TASK-022 | Delete `src/components/Admin/TaxonomyClient.tsx` and `src/server/actions/taxonomy.ts`. Confirm no remaining import references either file.                                                                                                                                                     |           |      |
| TASK-023 | Run `rg "admin/taxonomy\|Taxonomy\|taxonomy" src next.config.ts`. The only application match may be the `source: "/admin/taxonomy"` line in `next.config.ts`. Any other match is a missed reference and must be fixed. Plan files and git history are out of scope.                            |           |      |
| TASK-024 | Restart the dev server so the new `next.config.ts` redirect is loaded. If the server is user-managed, ask the user to restart it instead of killing the process. Do not start a second server on port 3000.                                                                                    |           |      |

### Implementation Phase 5

- GOAL-005: Verify the split, the redirect, CRUD behavior on both routes, navigation, and cleanup using the repository verification rules.

| Task     | Description                                                                                                                                                                                                                                                                                                                                               | Completed | Date |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-025 | Check port 3000 with `Get-NetTCPConnection -LocalPort 3000`. If the dev server is listening, run `bun lint` only. If the port is free, run `bun lint:check`. Run `bun run build` only when the port is free. Do not run `next typegen` while the dev server is listening.                                                                                 |           |      |
| TASK-026 | Use `playwright-cli open http://localhost:3000 --headed` and sign in with `admin@example.com` / `admin@example.com`. Confirm the sidebar shows separate Categories and Tags entries and no Taxonomy entry. Confirm the active state follows `/admin/categories` and `/admin/tags` independently.                                                          |           |      |
| TASK-027 | Verify the redirect. With `curl.exe -sI http://localhost:3000/admin/taxonomy`, or an authenticated Playwright navigation, confirm the response is a 308 with `location: /admin/categories` and that the browser ends on `/admin/categories`. If raw curl is intercepted by the auth proxy, verify through the signed-in browser and record the final URL. |           |      |
| TASK-028 | On `/admin/categories`, create a temporary category with a unique name and an icon such as `Leaf`, then edit its name, then delete it. Confirm the table updates after each action, no tag controls appear, and the dialogs match the old copy.                                                                                                           |           |      |
| TASK-029 | On `/admin/tags`, create a temporary lowercase tag, then edit its name, then delete it. Confirm the table updates after each action, no category controls appear, and the dialogs match the old copy.                                                                                                                                                     |           |      |
| TASK-030 | On `/admin`, confirm the stat tile reads "Categories and tags" with the combined count, and that the Categories and Tags module cards navigate to `/admin/categories` and `/admin/tags`.                                                                                                                                                                  |           |      |
| TASK-031 | Confirm upload integration still works. Open `/upload` and check that a category or tag created during verification appears in the form after the action, then delete the temporary rows and confirm they disappear after refresh.                                                                                                                        |           |      |
| TASK-032 | Confirm there are no application-origin console errors on `/admin/categories`, `/admin/tags`, and `/admin`. Ignore extension-injected warnings and the pre-existing avatar request on port 3001.                                                                                                                                                          |           |      |
| TASK-033 | Clean up. Delete any temporary category or tag rows through the UI, close the Playwright browser, and remove `.playwright-cli/` snapshot and console artifacts. Do not leave test data in the database.                                                                                                                                                   |           |      |

## 3. Alternatives

- **ALT-001**: Keep `/admin/taxonomy` as a hub page with nested `/admin/taxonomy/categories` and `/admin/taxonomy/tags`. Rejected by the user in favor of two sibling routes.
- **ALT-002**: Keep `/admin/taxonomy` as a small landing page linking to the new routes. Rejected because the user chose deletion plus a permanent redirect.
- **ALT-003**: Let `/admin/taxonomy` return a 404. Rejected because old bookmarks would break.
- **ALT-004**: Redirect `/admin/taxonomy` to `/admin` instead of `/admin/categories`. Rejected because Categories is the closest surviving section.
- **ALT-005**: Split the UI but keep all six actions in `taxonomy.ts`. Rejected because the user chose fully independent feature areas.
- **ALT-006**: Share one helper module for `requireAdmin` and `mapUniqueViolation`. Rejected because the user chose independent copies with no shared module.
- **ALT-007**: Build one parameterized table and dialog component for both routes. Rejected as unnecessary indirection and risk of changing behavior during a move.
- **ALT-008**: Keep one "Taxonomy" sidebar entry pointing at Categories. Rejected because Tags would have no direct entry and the label would not match the route.
- **ALT-009**: Split the dashboard stat into separate Categories and Tags tiles. Rejected because it produces seven tiles and an uneven grid.
- **ALT-010**: Implement the redirect with `permanentRedirect()` in a leftover taxonomy page. Rejected because the route is being deleted and `next.config.ts` redirects keep the behavior at the routing layer.
- **ALT-011**: Add search, sorting, or bulk actions while splitting. Rejected because this plan is a pure move.

## 4. Dependencies

- **DEP-001**: `next.config.ts` redirect support is verified in the installed Next 16 docs at `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/redirects.md`. `permanent: true` produces a 308.
- **DEP-002**: The Prisma singleton is imported from `@/lib/database/dbClient`.
- **DEP-003**: Category and tag models, relations, and wallpaper counts already exist in `prisma/schema.prisma`.
- **DEP-004**: `BoundaryErrorCard` and `createMetadata` exist and are used by every other admin route.
- **DEP-005**: `lucide-react` exports `LayoutGridIcon` and `TagsIcon`, both already used elsewhere in the dashboard.
- **DEP-006**: Manual verification uses the seeded admin account from `prisma/seed.ts` and the dev server on port 3000.
- **DEP-007**: The empty `src/app/(private)/admin/categories/_components` and `src/app/(private)/admin/tags/_components` folders already exist and are safe to fill.

## 5. Files

- **FILE-001**: `src/app/(private)/admin/categories/page.tsx`, new route page.
- **FILE-002**: `src/app/(private)/admin/categories/loading.tsx`, new route skeleton.
- **FILE-003**: `src/app/(private)/admin/categories/error.tsx`, new route error boundary.
- **FILE-004**: `src/app/(private)/admin/categories/_components/categories-content.tsx`, new category loader.
- **FILE-005**: `src/app/(private)/admin/tags/page.tsx`, new route page.
- **FILE-006**: `src/app/(private)/admin/tags/loading.tsx`, new route skeleton.
- **FILE-007**: `src/app/(private)/admin/tags/error.tsx`, new route error boundary.
- **FILE-008**: `src/app/(private)/admin/tags/_components/tags-content.tsx`, new tag loader.
- **FILE-009**: `src/components/Admin/CategoryClient.tsx`, new independent category client.
- **FILE-010**: `src/components/Admin/TagClient.tsx`, new independent tag client.
- **FILE-011**: `src/server/actions/categories.ts`, new independent category actions.
- **FILE-012**: `src/server/actions/tags.ts`, new independent tag actions.
- **FILE-013**: `next.config.ts`, modified to add the permanent taxonomy redirect.
- **FILE-014**: `src/components/Sidebar/AppSidebar.tsx`, modified to replace Taxonomy with Categories and Tags.
- **FILE-015**: `src/app/(private)/admin/_components/dashboard-links.tsx`, modified to point the two cards at the new routes.
- **FILE-016**: `src/app/(private)/admin/_components/dashboard-stats.tsx`, modified to rename the stat tile.
- **FILE-017**: `src/components/Upload/UploadForm.tsx`, modified to replace the taxonomy empty-state copy.
- **FILE-018**: `src/lib/zodSchema.ts`, modified only in the section comment.
- **FILE-019**: `src/app/(private)/admin/taxonomy/page.tsx`, deleted.
- **FILE-020**: `src/app/(private)/admin/taxonomy/loading.tsx`, deleted.
- **FILE-021**: `src/app/(private)/admin/taxonomy/error.tsx`, deleted.
- **FILE-022**: `src/app/(private)/admin/taxonomy/_components/taxonomy-content.tsx`, deleted.
- **FILE-023**: `src/components/Admin/TaxonomyClient.tsx`, deleted.
- **FILE-024**: `src/server/actions/taxonomy.ts`, deleted.
- **FILE-025**: `plan/feature-taxonomy-routes-1.md`, this plan.

## 6. Testing

- **TEST-001**: `bun lint` passes with the dev server running, or `bun lint:check` passes when port 3000 is free.
- **TEST-002**: `/admin/taxonomy` responds with a 308 redirect to `/admin/categories`, and the signed-in browser lands on `/admin/categories`.
- **TEST-003**: `/admin/categories` renders only category management: one table with Name, Slug, Wallpapers, Actions, one Add Category button, and no tabs or tag controls.
- **TEST-004**: `/admin/tags` renders only tag management: one table with Name, Slug, Wallpapers, Actions, one Add Tag button, and no tabs or category controls.
- **TEST-005**: Creating, editing, and deleting a category on `/admin/categories` updates the table and shows the existing success and error toasts.
- **TEST-006**: Creating, editing, and deleting a tag on `/admin/tags` updates the table, stores the name in lowercase, and shows the existing success and error toasts.
- **TEST-007**: The sidebar shows Categories and Tags as separate flat entries, highlights the correct one per route, and does not show Taxonomy.
- **TEST-008**: The admin dashboard stat tile reads "Categories and tags" with the combined count, and both module cards navigate to the correct routes.
- **TEST-009**: `/upload` reflects category and tag changes made on the new routes, confirming the new revalidation paths are correct.
- **TEST-010**: No application-origin console errors appear on the new routes, and all temporary rows plus `.playwright-cli/` artifacts are removed after verification.

## 7. Risks & Assumptions

- **RISK-001**: Duplicating `requireAdmin`, `mapUniqueViolation`, and category icon validation means future fixes must be applied twice. Mitigation: this is the explicitly chosen tradeoff for full independence. Copy the helpers verbatim now and keep both files in sync when auth or Prisma error handling changes.
- **RISK-002**: `next.config.ts` changes do not apply until the dev server restarts. Mitigation: restart the server before the redirect test, or ask the user to restart it.
- **RISK-003**: With `typedRoutes` enabled, link edits can fail type checking until the new route files exist. Mitigation: create the route pages before changing sidebar and dashboard hrefs, as ordered in the phases.
- **RISK-004**: A grep for taxonomy may still match the redirect source and this plan file. Mitigation: treat the `next.config.ts` source as the only allowed application match, and exclude `plan/` from the check.
- **RISK-005**: The repository already has two known TypeScript errors in `src/components/Auth/SignInForm.tsx` and `src/components/Sidebar/AppSidebar.tsx` around `Property 'role' does not exist`. Mitigation: do not attribute them to this change. `bun lint` does not type check, and `bun lint:check` may surface them as pre-existing.
- **RISK-006**: Playwright verification creates real rows. Mitigation: use unique temporary names and delete them through the UI, which also verifies the delete flow.
- **ASSUMPTION-001**: The existing empty route folders for categories and tags are uncommitted scaffolding and are safe to use.
- **ASSUMPTION-002**: Category and tag behavior must remain byte-for-byte equivalent, including lowercase tag normalization and the slug-untouched rename rule.
- **ASSUMPTION-003**: The admin layout already enforces the admin role, so no per-route authorization is added.
- **ASSUMPTION-004**: The seeded admin account remains available for manual verification.
- **ASSUMPTION-005**: The repository has no automated test suite, so lint plus Playwright verification is the accepted quality gate.

## 8. Related Specifications / Further Reading

- `AGENTS.md` verification and Playwright sections
- Next.js local docs: `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/redirects.md`
- Next.js local docs: `node_modules/next/dist/docs/01-app/02-guides/redirecting.md`
- Previous plan format: `plan/feature-storage-analytics-1.md`
- shadcn Table documentation: https://ui.shadcn.com/docs/components/table
- shadcn Dialog documentation: https://ui.shadcn.com/docs/components/dialog
