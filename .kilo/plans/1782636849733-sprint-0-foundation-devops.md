# Sprint 0: Foundation and DevOps Implementation Plan

## Overview

Establish the foundational infrastructure for Lumiwalls including project setup, authentication, storage configuration, and database migration to Neon Postgres.

## Current State Analysis

- ✅ Next.js 16.2 + React 19.2 initialized
- ✅ Tailwind CSS v4 configured
- ✅ Prisma 7 configured (SQLite adapter - needs migration to Postgres)
- ✅ shadcn/ui with base-luma preset configured
- ✅ Button component installed
- ❌ Input, Dialog, Sheet, Dropdown components missing
- ❌ BetterAuth not configured
- ❌ Backblaze B2 not configured
- ❌ Footer component missing

## Tasks

### 1. Database Migration: SQLite to Neon Postgres

Update Prisma configuration:
- [ ] Change datasource provider from `sqlite` to `postgresql` in `prisma/schema.prisma`
- [ ] Add `@neondatabase/serverless` package (Prisma 7 works with Neon via pooled connection URL)
- [ ] Update `prisma.config.ts` - keep dotenv/config for local .env loading
- [ ] Update `src/lib/env/serverEnv.ts` DATABASE_URL validation (remove `file:./` constraint, allow postgres:// URLs)
- [ ] Update `src/lib/database/dbClient.ts` to use standard PrismaClient (no adapter needed for Neon pooled URL)
- [ ] Configure connection pooling with Neon pooler URL (`?sslmode=require&connection_limit=10`)

### 2. shadcn Components Installation

Install missing UI components:
- [ ] Input
- [ ] Dialog
- [ ] Sheet
- [ ] Dropdown Menu

Command: `bunx shadcn add <component>` for each

### 3. BetterAuth Configuration

Create `src/lib/auth.ts` with:
- [ ] Email/password authentication with auto sign-in after registration
- [ ] Admin plugin for role-based access control
- [ ] Prisma adapter integration
- [ ] Session configuration with secure cookies
- [ ] Create `src/app/api/auth/[...all]/route.ts` catch-all handler

Create `src/components/Providers/AuthProvider.tsx`:
- [ ] Client wrapper for BetterAuth client (if needed)
- [ ] Integrate with existing ThemeProvider structure

Create `src/lib/auth/types.ts`:
- [ ] Extend BetterAuth User type with role field (user, moderator, admin)

Update `src/lib/env/serverEnv.ts`:
- [ ] Add `BETTER_AUTH_SECRET` (min 32 chars)
- [ ] Add `BETTER_AUTH_URL` (production URL)

Update `.env.example`:
- [ ] Add `BETTER_AUTH_SECRET`
- [ ] Add `BETTER_AUTH_URL`

### 4. Database Schema

Create initial migration with BetterAuth models:
- [ ] Run `bun migrate` to generate BetterAuth tables
- [ ] Verify Neon Postgres connection

### 5. Backblaze B2 Configuration

Create `src/lib/storage/b2Client.ts`:
- [ ] Configure S3 SDK v3 client for B2 compatibility
- [ ] Set path-style URLs for B2
- [ ] Configure endpoint, region, and credentials from env vars

Update `src/lib/env/serverEnv.ts`:
- [ ] Add `B2_ENDPOINT` (e.g., `https://s3.us-west-002.backblazeb2.com`)
- [ ] Add `B2_KEY_ID`
- [ ] Add `B2_APPLICATION_KEY`
- [ ] Add `B2_BUCKET_NAME`
- [ ] Add `B2_PUBLIC_URL` (for serving images)

Update `.env.example`:
- [ ] Add B2 environment variables

Create `src/lib/storage/presignedUrl.ts`:
- [ ] Generate presigned upload URLs with 5-minute expiry
- [ ] Return object key for B2 path structure

### 6. Footer Component

Create `src/components/Footer/Footer.tsx`:
- [ ] Basic footer with links
- [ ] Mobile-responsive navigation
- [ ] Dark mode support

Update `src/app/layout.tsx`:
- [ ] Add Footer component
- [ ] Add padding-top to account for fixed header

Update `src/components/Header/Header.tsx`:
- [ ] Change "NSF App" to "Lumiwalls" (project name)
- [ ] Add auth navigation links (Sign In, Sign Up)

Update `src/app/page.tsx`:
- [ ] Update metadata title/description for Lumiwalls
- [ ] Replace placeholder content with Lumiwalls landing page

### 7. Auth UI Pages

Create auth pages under `src/app/(auth)/`:
- [ ] `src/app/(auth)/sign-in/page.tsx` - Sign-in form with react-hook-form
- [ ] `src/app/(auth)/sign-up/page.tsx` - Sign-up form with react-hook-form
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

### 8. Zod Schemas

Create `src/lib/zodSchema.ts`:
- [ ] Define auth schemas (signInSchema, signUpSchema)
- [ ] Export both schema and inferred types per AGENTS.md pattern

## Dependencies to Install

```bash
bun add @neondatabase/serverless
bun add @better-auth/better-auth @better-auth/prisma-adapter
bun add react-hook-form @hookform/resolvers/zod
bun add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

Note: Prisma 7 uses native PostgreSQL driver with Neon. The `@prisma/adapter-neon` package may not be required if using Neon's pooled connection URL directly.

## Verification Steps

1. Run `bun lint` - should pass with no errors
2. Run `bun run build` - should compile successfully
3. Run `bun dev` - should start development server
4. Test authentication flow locally
5. Verify Neon Postgres connection

## Risks & Considerations

1. **Neon Postgres migration**: Requires Neon account and connection string. The DATABASE_URL validation in `serverEnv.ts` currently enforces `file:./` prefix - this must be updated to accept `postgresql://` URLs.
2. **Neon connection pooling**: Must use Neon's pooled connection URL (ends with `-pooler` or add `?connection_limit=10`) to prevent connection exhaustion.
3. **B2 credentials**: Requires actual Backblaze B2 account setup for production. CORS rules must be configured to allow the Render domain.
4. **BetterAuth version**: Ensure compatibility with Prisma 7 adapter. The admin plugin requires proper role field on User model.
5. **Auth forms**: Must follow AGENTS.md form patterns with Controller wrapper and zodResolver.
6. **Environment variables**: All secrets must be added to `.env.example` but never committed to `.env`.

## Deliverable

A live site with working authentication, shadcn components installed, B2 storage configured, and Neon Postgres database connected.