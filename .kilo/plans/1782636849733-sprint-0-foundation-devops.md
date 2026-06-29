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
- ✅ Prisma 7 configured (SQLite adapter - needs migration to Postgres)
- ✅ shadcn/ui with base-rhea preset configured
- ✅ Button component installed
- ❌ Input, Dialog, Sheet, Dropdown components missing
- ❌ BetterAuth not configured
- ❌ Backblaze B2 not configured
- ❌ Footer component missing

## Tasks

### 1. Database Migration: SQLite to Neon Postgres

Update Prisma configuration:
- [ ] Install `@prisma/adapter-neon` package (includes bundled dependencies, no separate `@neondatabase/serverless` or `ws` needed)
- [ ] Update `prisma.config.ts` to use `DIRECT_URL` for migrations and add seed configuration (`bun prisma/seed.ts`)
- [ ] Update `prisma/schema.prisma` - change datasource provider to `postgresql`, remove `url` property (Prisma 7 uses `prisma.config.ts` for connection)
- [ ] Update `src/lib/env/serverEnv.ts` - add `DIRECT_URL` validation, change `DATABASE_URL` validation to accept `postgres://` URLs (remove `file:./` constraint)
- [ ] Update `src/lib/database/dbClient.ts` to use `PrismaNeon` adapter with pooled `DATABASE_URL`
- [ ] Configure connection pooling via Neon pooler URL (hostname contains `-pooler`)

**Prisma 7 Configuration Notes:**
- Generator: `provider = "prisma-client"`, `output = "../generated/prisma"` (not `prisma-client-js`)
- Import `PrismaClient` from `@generated/prisma/client` — never from `@prisma/client`
- `prisma.config.ts` uses `env("DIRECT_URL")` for CLI commands (migrations, studio)
- `dbClient.ts` uses pooled `DATABASE_URL` for runtime queries via `PrismaNeon` adapter
- Both connection strings required: pooled (`DATABASE_URL`) for app, direct (`DIRECT_URL`) for CLI

### 2. shadcn Components Installation

Install missing UI components:
- [ ] Input
- [ ] Dialog
- [ ] Sheet
- [ ] Dropdown Menu

Command: `bunx shadcn add <component>` for each

**Note:** `components.json` sets `style: "base-rhea"`, `ui` → `@/components/shadcnui`. Primitives come from `@base-ui/react` (not Radix).

### 3. BetterAuth Configuration

Create `src/lib/auth.ts` with:
- [ ] Email/password authentication with auto sign-in after registration
- [ ] Admin plugin for role-based access control
- [ ] Prisma adapter integration (`prismaAdapter(prisma, { provider: "sqlite" })` - intentional quirk, do not "correct" this)
- [ ] Session configuration with secure cookies (cookie prefix `cit`)
- [ ] `nextCookies()` plugin for Next.js integration
- [ ] Custom password hashing with `@node-rs/argon2`
- [ ] Create `src/app/api/auth/[...all]/route.ts` catch-all handler

Create `src/lib/auth-client.ts`:
- [ ] Client instance with `inferAdditionalFields<typeof auth>` + `adminClient`

Create `src/lib/argon2.ts`:
- [ ] Password hashing functions using `@node-rs/argon2` with `BETTER_AUTH_SECRET` as pepper
- [ ] Do not call `argon2` directly elsewhere — go through `hashPasswordFunction` / `verifyPasswordFunction`

Update `src/lib/env/serverEnv.ts`:
- [ ] Add `BETTER_AUTH_SECRET` (≥32 chars)
- [ ] Add `BETTER_AUTH_URL` (production URL)
- [ ] Add `BETTER_AUTH_ALLOWED_ORIGINS` (comma-separated, optional)
- [ ] Add `BETTER_AUTH_TELEMETRY` (optional)

Update `.env.example`:
- [ ] Add `DATABASE_URL` (pooled Neon URL with `-pooler` in hostname)
- [ ] Add `DIRECT_URL` (direct Neon URL for migrations)
- [ ] Add `BETTER_AUTH_SECRET`
- [ ] Add `BETTER_AUTH_URL`
- [ ] Add `BETTER_AUTH_ALLOWED_ORIGINS`
- [ ] Add `BETTER_AUTH_TELEMETRY`
- [ ] Add `CHECKPOINT_DISABLE=1` (silence Prisma telemetry)
- [ ] Add S3 environment variables (endpoint, region, access key, secret, bucket name)
- [ ] Add optional `S3_PUBLIC_URL` and `NEXT_PUBLIC_S3_PUBLIC_URL`

### 4. Database Schema

Create initial migration with BetterAuth models:
- [ ] Run `bun migrate` to generate BetterAuth tables
- [ ] Verify Neon Postgres connection

Create `prisma/seed.ts`:
- [ ] Seed script that creates its own adapter+client (runs outside Next.js runtime)
- [ ] Configure in `prisma.config.ts` as `seed: "bun prisma/seed.ts"`
- [ ] Run with `bun seed` (which runs `prisma db seed`)

### 5. Backblaze B2 Configuration (S3-compatible)

Create `src/lib/storage/b2Client.ts`:
- [ ] Configure S3 SDK v3 client for B2 compatibility
- [ ] Set path-style URLs for B2
- [ ] Configure endpoint, region, and credentials from env vars

Update `src/lib/env/serverEnv.ts`:
- [ ] Add `S3_ENDPOINT` (e.g., `https://s3.us-west-002.backblazeb2.com` or `https://s3.eu-central-003.backblazeb2.com`)
- [ ] Add `S3_REGION` (e.g., `us-west-002` or `us-eu-central-003`)
- [ ] Add `S3_ACCESS_KEY_ID`
- [ ] Add `S3_SECRET_ACCESS_KEY`
- [ ] Add `S3_BUCKET_NAME`
- [ ] Add `S3_PUBLIC_URL` (optional, for serving images)
- [ ] Add `NEXT_PUBLIC_S3_PUBLIC_URL` (optional, client-side)

Update `.env.example`:
- [ ] Add S3 environment variables

Create `src/lib/storage/presignedUrl.ts`:
- [ ] Generate presigned upload URLs with 5-minute expiry
- [ ] Return object key for B2 path structure

Create `src/lib/fileStorage.ts`:
- [ ] S3 helpers for file uploads
- [ ] Keys follow `wallpapers/{userId}/{uuid}-{name}` pattern with `thumb-` prefix for thumbnails

Create `src/lib/imageProcessor.ts`:
- [ ] Image processing with `sharp`
- [ ] Used for thumbnail generation

### 6. Footer Component

Create `src/components/Footer/Footer.tsx`:
- [ ] Basic footer with links
- [ ] Mobile-responsive navigation
- [ ] Dark mode support (default `dark`, `enableSystem={false}`)

Update `src/app/layout.tsx`:
- [ ] Add Footer component
- [ ] Add padding-top to account for fixed header

Update `src/components/Header/Header.tsx`:
- [ ] Change "NSF App" to "Lumiwalls" (project name)
- [ ] Add auth navigation links (Sign In, Sign Up)

Update `src/app/(public)/page.tsx`:
- [ ] Update metadata title/description for Lumiwalls
- [ ] Replace placeholder content with Lumiwalls landing page

### 7. Auth UI Pages

Create auth pages under `src/app/(public)/`:
- [ ] `src/app/(public)/sign-in/page.tsx` - Sign-in form with react-hook-form
- [ ] `src/app/(public)/sign-up/page.tsx` - Sign-up form with react-hook-form
- [ ] Use shadcn Input and Button components
- [ ] Follow AGENTS.md form patterns with Controller wrapper

Create `src/components/Auth/SignInForm.tsx`:
- [ ] Client component with "use client"
- [ ] useForm with zodResolver
- [ ] Controller for each field
- [ ] Submit handler calling auth client

Create `src/components/Auth/SignUpForm.tsx`:
- [ ] Client component with "use client"
- [ ] useForm with zodResolver
- [ ] Controller for each field
- [ ] Submit handler calling auth client

**Route Groups:**
- `src/app/(public)/` - unauthenticated pages (landing, login/register)
- `src/app/(private)/` - authenticated pages with session check in layout

### 8. Zod Schemas

Create `src/lib/zodSchema.ts`:
- [ ] Define auth schemas (signInSchema, signUpSchema)
- [ ] Export both schema and inferred types per AGENTS.md pattern: `type X = z.infer<typeof xSchema>`
- [ ] Use Zod v4 throughout (`zod`), compatible with `z.infer`, `.min()`, `.refine()`, etc.

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