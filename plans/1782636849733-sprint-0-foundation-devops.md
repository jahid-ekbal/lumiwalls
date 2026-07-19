# Sprint 0: Foundation and DevOps Implementation Plan

## Overview

Establish the foundational infrastructure for Lumiwalls including project setup, authentication, storage configuration, and database migration to Neon Postgres.

## Stack at a Glance

- Next.js 16.2 + React 19.2 (App Router, Turbopack default, React Compiler on, `typedRoutes: true`)
- Prisma 7 on **Neon Postgres** via `@prisma/adapter-neon` (serverless driver)
- Better Auth 1.6 with the `admin` + `nextCookies` plugins; Argon2 password hashing via `@node-rs/argon2`
- S3-compatible object storage (Backblaze B2 by default) via `@aws-sdk/client-s3`; `sharp` for image processing
- Tailwind CSS v4 (CSS-only config in `globals.css`; no `tailwind.config.ts`)
- shadcn/ui (style preset `base-rhea`) with primitives from `@base-ui/react` (not Radix)
- `next-themes` (default `dark`, `enableSystem={false}`), `react-toastify`, `react-hook-form` + `@hookform/resolvers/zod`
- `@t3-oss/env-nextjs` + Zod v4 for env validation

## Current State Analysis

- ✅ Next.js 16.2 + React 19.2 initialized
- ✅ Tailwind CSS v4 configured
- ✅ Prisma 7 configured (Neon Postgres via `@prisma/adapter-neon`)
- ✅ shadcn/ui with base-rhea preset configured
- ✅ Button, Input, Dialog, Sheet, Dropdown Menu components installed
- ✅ BetterAuth configured (auth.ts, auth-client.ts, argon2.ts, API route, env vars)
- ✅ Backblaze B2 configured (b2Client.ts, presignedUrl.ts, imageProcessor.ts, env vars)
- ✅ Footer component created
- ✅ Auth UI pages created (sign-in, sign-up)
- ✅ Zod schemas for auth created (zodSchema.ts)
- ✅ Route group (public)/ created
- ❌ Route group (private)/ not created
- ✅ Header updated — "Lumiwalls" with auth nav links
- ✅ Landing page updated with Lumiwalls branding

## Tasks

### 1. Database Migration: SQLite to Neon Postgres ✅

Update Prisma configuration:

- [x] Install `@prisma/adapter-neon` package (includes bundled dependencies, no separate `@neondatabase/serverless` or `ws` needed)
- [x] Update `prisma.config.ts` to use `DIRECT_URL` for migrations and add seed configuration (`bun prisma/seed.ts`)
- [x] Update `prisma/schema.prisma` - change datasource provider to `postgresql`, remove `url` property (Prisma 7 uses `prisma.config.ts` for connection)
- [x] Update `src/lib/env/serverEnv.ts` - add `DIRECT_URL` validation, change `DATABASE_URL` validation to accept `postgres://` URLs (remove `file:./` constraint)
- [x] Update `src/lib/database/dbClient.ts` to use `PrismaNeon` adapter with pooled `DATABASE_URL`
- [x] Configure connection pooling via Neon pooler URL (hostname contains `-pooler`)

**Prisma 7 Configuration Notes:** ✅ Verified — all 5 points match the actual codebase

- Generator: `provider = "prisma-client"`, `output = "../generated/prisma"` (not `prisma-client-js`)
- Import `PrismaClient` from `@generated/prisma/client` — never from `@prisma/client`
- `prisma.config.ts` uses `env("DIRECT_URL")` for CLI commands (migrations, studio)
- `dbClient.ts` uses pooled `DATABASE_URL` for runtime queries via `PrismaNeon` adapter
- Both connection strings required: pooled (`DATABASE_URL`) for app, direct (`DIRECT_URL`) for CLI

### 2. shadcn Components Installation ✅

Install missing UI components:

- [x] Input
- [x] Dialog
- [x] Sheet
- [x] Dropdown Menu

Command: `bunx shadcn add <component>` for each

**Note:** `components.json` sets `style: "base-rhea"`, `ui` → `@/components/shadcnui`. Primitives come from `@base-ui/react` (not Radix).

### 3. BetterAuth Configuration ✅

Create `src/lib/auth.ts` with:

- [x] Email/password authentication with auto sign-in after registration
- [x] Admin plugin for role-based access control
- [x] Prisma adapter integration (`prismaAdapter(prisma, { provider: "sqlite" })` - intentional quirk, do not "correct" this)
- [x] Session configuration with secure cookies (cookie prefix `cit`)
- [x] `nextCookies()` plugin for Next.js integration
- [x] Custom password hashing with `@node-rs/argon2`
- [x] Create `src/app/api/auth/[...all]/route.ts` catch-all handler

Create `src/lib/auth-client.ts`:

- [x] Client instance with `inferAdditionalFields<typeof auth>` + `adminClient`

Create `src/lib/argon2.ts`:

- [x] Password hashing functions using `@node-rs/argon2` with `BETTER_AUTH_SECRET` as pepper
- [x] Do not call `argon2` directly elsewhere — go through `hashPasswordFunction` / `verifyPasswordFunction`

Update `src/lib/env/serverEnv.ts`:

- [x] Add `BETTER_AUTH_SECRET` (≥32 chars)
- [x] Add `BETTER_AUTH_URL` (production URL)
- [x] Add `BETTER_AUTH_ALLOWED_ORIGINS` (comma-separated, optional)
- [x] Add `BETTER_AUTH_TELEMETRY` (optional)

Update `.env.example`:

- [x] Add `DATABASE_URL` (pooled Neon URL with `-pooler` in hostname)
- [x] Add `DIRECT_URL` (direct Neon URL for migrations)
- [x] Add `BETTER_AUTH_SECRET`
- [x] Add `BETTER_AUTH_URL`
- [x] Add `BETTER_AUTH_ALLOWED_ORIGINS`
- [x] Add `BETTER_AUTH_TELEMETRY`
- [x] Add `CHECKPOINT_DISABLE=1` (silence Prisma telemetry)
- [x] Add S3 environment variables (endpoint, region, access key, secret, bucket name)
- [x] Add optional `S3_PUBLIC_URL` and `NEXT_PUBLIC_S3_PUBLIC_URL`

### 4. Database Schema ✅

Create initial migration with BetterAuth models:

- [x] Run `bun migrate` to generate BetterAuth tables
- [x] Verify Neon Postgres connection

Create `prisma/seed.ts`:

- [x] Seed script that creates its own adapter+client (runs outside Next.js runtime)
- [x] Configure in `prisma.config.ts` as `seed: "bun prisma/seed.ts"`
- [x] Run with `bun seed` (which runs `prisma db seed`)

### 5. Backblaze B2 Configuration (S3-compatible) ✅

Create `src/lib/storage/b2Client.ts`:

- [x] Configure S3 SDK v3 client for B2 compatibility
- [x] Set path-style URLs for B2
- [x] Configure endpoint, region, and credentials from env vars

Update `src/lib/env/serverEnv.ts`:

- [x] Add `S3_ENDPOINT` (e.g., `https://s3.us-west-002.backblazeb2.com` or `https://s3.eu-central-003.backblazeb2.com`)
- [x] Add `S3_REGION` (e.g., `us-west-002` or `us-eu-central-003`)
- [x] Add `S3_ACCESS_KEY_ID`
- [x] Add `S3_SECRET_ACCESS_KEY`
- [x] Add `S3_BUCKET_NAME`
- [x] Add `S3_PUBLIC_URL` (optional, for serving images)
- [x] Add `NEXT_PUBLIC_S3_PUBLIC_URL` (optional, client-side)

Update `.env.example`:

- [x] Add S3 environment variables

Create `src/lib/storage/presignedUrl.ts`:

- [x] Generate presigned upload URLs with 5-minute expiry
- [x] Return object key for B2 path structure

Create `src/lib/fileStorage.ts`:

- [x] S3 helpers for file uploads
- [x] Keys follow `wallpapers/{userId}/{uuid}-{name}` pattern with `thumb-` prefix for thumbnails

Create `src/lib/imageProcessor.ts`:

- [x] Image processing with `sharp`
- [x] Used for thumbnail generation

### 6. Footer Component ✅

Create `src/components/Footer/Footer.tsx`:

- [x] Basic footer with links
- [x] Mobile-responsive navigation
- [x] Dark mode support (default `dark`, `enableSystem={false}`)

Update `src/app/layout.tsx`:

- [x] Add Footer component
- [x] Add padding-top to account for fixed header

Update `src/components/Header/Header.tsx`:

- [x] Change "NSF App" to "Lumiwalls" (project name)
- [x] Add auth navigation links (Sign In, Sign Up)

Update `src/app/(public)/page.tsx`:

- [x] Update metadata title/description for Lumiwalls
- [x] Replace placeholder content with Lumiwalls landing page

### 7. Auth UI Pages ✅

Create auth pages under `src/app/(public)/`:

- [x] `src/app/(public)/sign-in/page.tsx` - Sign-in form with react-hook-form
- [x] `src/app/(public)/sign-up/page.tsx` - Sign-up form with react-hook-form
- [x] Use shadcn Input and Button components
- [x] Follow AGENTS.md form patterns with Controller wrapper

Create `src/components/Auth/SignInForm.tsx`:

- [x] Client component with "use client"
- [x] useForm with zodResolver
- [x] Controller for each field
- [x] Submit handler calling auth client

Create `src/components/Auth/SignUpForm.tsx`:

- [x] Client component with "use client"
- [x] useForm with zodResolver
- [x] Controller for each field
- [x] Submit handler calling auth client

**Route Groups:**

- `src/app/(public)/` - unauthenticated pages (landing, login/register)
- `src/app/(private)/` - authenticated pages with session check in layout

### 8. Zod Schemas ✅

Create `src/lib/zodSchema.ts`:

- [x] Define auth schemas (signInSchema, signUpSchema)
- [x] Export both schema and inferred types per AGENTS.md pattern: `type X = z.infer<typeof xSchema>`
- [x] Use Zod v4 throughout (`zod`), compatible with `z.infer`, `.min()`, `.refine()`, etc.

### 9. Route Groups and Server Actions (Future)

Note for subsequent sprints:

- `src/app/(public)/` - unauthenticated pages (landing, categories, wallpapers, login/register/forgot/reset). Layout wraps in `mx-auto max-w-7xl`.
- `src/app/(private)/` - `layout.tsx` redirects to `/login` if no session. **Any page that requires auth must live under `(private)/`**.
- `src/server/` - server actions with `"use server"` directive
- Routes using `sharp`, `@node-rs/argon2`, or AWS SDK must set `runtime = "nodejs"`
- `next.config.ts` sets `serverActions.bodySizeLimit: "10mb"`

## Dependencies to Install

```bash
bun add @prisma/adapter-neon
bun add @better-auth/better-auth @better-auth/prisma-adapter @better-auth/next
bun add @node-rs/argon2
bun add react-hook-form @hookform/resolvers/zod
bun add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
bun add sharp
bun add lucide-react
```

Note: Prisma 7 uses `@prisma/adapter-neon` for Neon Postgres connection. Do NOT install `@neondatabase/serverless` or `ws` separately - they are bundled.

## Verification Steps

1. Run `bun lint` - should pass with no errors
2. Run `bun run build` - should compile successfully (includes `prisma generate`)
3. Run `bun dev` - should start development server
4. Test authentication flow locally
5. Verify Neon Postgres connection

## Risks & Considerations

1. **Neon Postgres migration**: Requires Neon account and both pooled (`DATABASE_URL`) and direct (`DIRECT_URL`) connection strings. The pooled URL has `-pooler` in hostname.
2. **Two connection strings required**: `DATABASE_URL` (pooled) for runtime queries, `DIRECT_URL` (direct) for Prisma CLI migrations. Both must be configured.
3. **Prisma 7 generator**: Uses `provider = "prisma-client"` (not `prisma-client-js`). Import from `@generated/prisma/client`.
4. **Better Auth quirk**: `prismaAdapter(prisma, { provider: "sqlite" })` is intentionally used even with Postgres - do not "correct" this without testing.
5. **B2 credentials**: Requires actual Backblaze B2 account setup for production. CORS rules must be configured to allow the deployment domain.
6. **Auth forms**: Must follow AGENTS.md form patterns with Controller wrapper and zodResolver.
7. **Environment variables**: All secrets must be added to `.env.example` but never committed to `.env`.
8. **Seed script**: `prisma/seed.ts` must create its own adapter+client since it runs outside Next.js runtime.
9. **Node.js runtime**: Routes using `sharp`, `@node-rs/argon2`, or AWS SDK must set `runtime = "nodejs"`.
10. **shadcn style**: Uses `base-rhea` preset (not `base-luma`). Primitives from `@base-ui/react`.
11. **Tailwind v4**: All config in `globals.css` via `@theme inline` and `@custom-variant`. No `tailwind.config.ts`.
12. **Env validation**: `serverEnv.ts` uses `experimental__runtimeEnv: process.env` prefix for non-Next runtime access.

## Deliverable

A live site with working authentication, shadcn components installed, B2 storage configured, and Neon Postgres database connected.

**Additional Notes:**

- `next.config.ts` imports both env modules as side effects at the top for validation at load time
- `globals.css` imports `shadcn/tailwind.css` and `tw-animate-css` (removing either breaks Base Rhea tokens or animations)
- Images from dynamic sources (S3) use `<img>` with eslint-disable comment — not `next/image`
- `bun studio` runs headless (`--browser none`); open the printed URL manually
- `bun prod` runs full production check: `prisma generate && eslint && next build && next start`
