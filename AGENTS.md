<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes: APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:form-patterns -->

# Form Patterns

Schemas in `src/lib/zodSchema.ts`: export both schema and `type X = z.infer<typeof xSchema>`.

Components use `"use client"`, `react-hook-form` + `@hookform/resolvers/zod`, and shadcn primitives:

```typescript
const { handleSubmit, control, formState: { isSubmitting } } = useForm({
  resolver: zodResolver(mySchema),
  defaultValues: { ... },
  mode: "all",
});
```

Each field goes through `Controller`:

```typescript
<Controller
  name="fieldName"
  control={control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor={field.name}>Label</FieldLabel>
      <Input {...field} id={field.name} aria-invalid={fieldState.invalid} autoComplete="..." />
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

Submit: `<form onSubmit={handleSubmit(handler)} noValidate>`. Button disabled while submitting with icon toggle.

See existing examples under `src/components/Auth/`.

<!-- END:form-patterns -->

## Agent behavior

- **Ask questions.** When the request is ambiguous, when there are real implementation choices with tradeoffs, or before any non-obvious / destructive action, use the `question` tool to confirm. Always ask one question at a time, because one question's answer can affect the next questions and their answers.
- **Remember new learning.** When you discover something non-obvious about this repo: a gotcha, a convention, a fix, a command that wasn't documented, add it back to this file (or a clearly-scoped section) so future sessions benefit. Keep entries concise and high-signal; delete stale ones.
- **Use available skills and MCPs.** Before writing code for a task that matches a listed skill (e.g. `shadcn`, `prisma-*`, `next-*`, `better-auth-*`, `vercel-react-*`, `zod`, etc.), load it with the `skill` tool. And MCPs that are directly relevant to this stack e.g. **`shadcn`** (local; component registry / audit) and **`better-auth`** (remote; auth setup). Use them when the task fits instead of guessing from training data.

## Stack at a glance

- Next.js 16.2 + React 19.2 (App Router, Turbopack default, React Compiler on, `typedRoutes` on)
- Prisma 7 with `@prisma/adapter-neon` (PostgreSQL, Neon serverless)
- Tailwind CSS v4 (CSS-only config in `globals.css`; no `tailwind.config.ts`)
- shadcn/ui with the `base-luma` style preset; primitives from `@base-ui/react` (not Radix)
- `next-themes` (default `dark`, `enableSystem={false}`), `react-toastify`, `lucide-react`
- `@t3-oss/env-nextjs` + Zod for env validation

## Verification

- **Primary check**: `bun lint`: runs `eslint` with `eslint-config-next` core-web-vitals + typescript.
- **Type check**: `bun typecheck`: runs `next typegen && tsc --noEmit` for standalone type checking without a full build.
- **Secondary / type gate**: `bun run build`. TypeScript errors also surface during the build. Never run it while a dev server is listening (check `Get-NetTCPConnection -LocalPort 3000` first); the two conflict, so use `bun lint` alone until the port is free.
- **Full prod check**: `bun prod`: `prisma generate && eslint && next typegen && tsc --noEmit && next build && next start`. Use before schema or env changes.
- **UI verification**: Use `playwright-cli` in `--headed` mode for all browser checks. Run `playwright-cli --help` to see commands. Always pass `--headed` (e.g., `playwright-cli open --headed`). Do not use headless for verifications. Never run blocking foreground commands (`bun dev` in the foreground, `next start`, watch mode); they hang the session and the user has to unstick it. Do not start a dev server with `Start-Process` or background jobs; those hang the session too. The working method is a fully detached launch via `Invoke-CimMethod -ClassName Win32_Process -MethodName Create` (returns a PID immediately), then poll readiness with short commands (`Get-Content` on a redirected log, `Get-NetTCPConnection -LocalPort 3000`), and kill the tree with `taskkill /pid <pid> /t /f` when done. If no working launch method exists, ask the user to start the server and give you the URL. When no browser check is needed, default to `bun lint` plus `bun run build` instead.
  - Invoke as `playwright-cli ...` directly, not `bunx playwright-cli ...`.
  - Do not pipe output with `2>&1 | Select-Object -First 50`; run commands bare.
  - Core commands from `--help`: `open [url] --headed`, `snapshot [target]`, `eval <func> [target]`, `click <target>`, `fill <target> <text>`, `goto <url>`, `screenshot`, `close`, plus `attach`, `dblclick`, `drag`, `drop`, `hover`, `select`, `upload`, `check/uncheck`, `find`, `dialog-accept/dismiss`, `resize`, `delete-data`. Snapshots return YAML with `ref` handles and console log paths under `.playwright-cli/`.
  - Authenticated flows: dev seed is `prisma/seed.ts` (`ADMIN_EMAIL`/`ADMIN_PASSWORD` default `admin@example.com` / `admin@example.com`, override via `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`, hashed via `src/lib/argon2.ts` `hashPasswordFunction`, `accountId = userId` for `credential` provider). Sign in at `/` by filling `Email`/`Password` textboxes and clicking `Sign In` (`replace("/browse")`) before verifying private routes (`/browse`, `/dashboard`, `/admin/*`, `/settings`, `/upload` redirect to `/` when unauthenticated via `proxy.ts`).
  - Active-state checks use `eval` on `[data-active]` / `[data-ancestor]` (e.g. `document.querySelectorAll('[data-active]')`, `getComputedStyle(e).opacity` for breadcrumb `opacity-60`).
  - **Clean up after every test run.** Delete any test users/rows created during verification (deleting the `user` cascades its `account` and `session` rows) and remove the `.playwright-cli/` snapshot/console artifacts. Never leave test data behind.

## Prisma (Prisma 7, custom output)

- Generator: `provider = "prisma-client"`, `output = "../generated/prisma"`. This is the Prisma 7 generator, **not** `prisma-client-js`.
- Import the client as `import { PrismaClient } from "@generated/prisma/client"`. There is no `@prisma/client` import surface in this repo.
- `prisma/schema.prisma` has **no** `datasource.url` line. The URL comes from `prisma.config.ts` via `env("DIRECT_URL")` (loaded with `dotenv/config`). Do not add it back inline.
- `src/lib/database/dbClient.ts` is a `globalThis` singleton (HMR-safe) wired to `PrismaNeon` (takes `{ connectionString }`). Do not instantiate `PrismaClient` elsewhere; import from this file.
- `serverEnv.DATABASE_URL` is Zod-validated to start with `postgresql://` (`src/lib/env/serverEnv.ts`). A non-`postgresql://` URL throws at boot.
- Migrations exist under `prisma/migrations/`: apply with `bunx prisma migrate dev --name <migration-name>` then `bun prisma generate` (or `bunx prisma generate`). Do not use `bun migrate` (it runs `prisma migrate dev` in interactive mode) and do not use `prisma db push`.
- `bun studio` runs headless (`--browser none`); open the printed URL in a browser manually.
- `generated/**` is gitignored and excluded from ESLint. Do not hand-edit generated files.
- `build` and `prod` scripts prepend `prisma generate`; running raw `next build` will fail with missing types if the client is stale.

## Env validation (T3 env)

- `src/lib/env/clientEnv.ts` and `src/lib/env/serverEnv.ts` define Zod schemas via `@t3-oss/env-nextjs`.
- `serverEnv.ts` uses `experimental__runtimeEnv: process.env`. The `experimental__` prefix is required for non-Next-runtime access; keep it verbatim.
- `next.config.ts` imports both env files **as side effects** at the top of the module to trigger validation at load time. Do not remove those imports; the rest of the app reads `serverEnv` / `clientEnv` from those modules.
- New vars: add to `serverEnv.ts` (server) or `clientEnv.ts` (must be `NEXT_PUBLIC_*`) and mirror in `.env.example`.

## Styling

- Tailwind v4: all config lives in `src/app/globals.css` via `@theme` and `@custom-variant`. PostCSS plugin is `@tailwindcss/postcss`. There is no `tailwind.config.ts`; do not create one.
- `globals.css` imports `shadcn/tailwind.css`; removing it breaks the Base Luma design tokens.
- Prettier: `singleAttributePerLine: true`, `bracketSameLine: true`, `experimentalTernaries: true`, and `prettier-plugin-tailwindcss` is enabled. New code matches (one prop per line; JSX closing bracket on the same line as the tag).
- **No em dashes anywhere.** Use colons, semicolons, commas, or parentheses instead. This applies to code, comments, docs, metadata titles, and this file.

## shadcn / Base UI

- `components.json` sets `ui` → `@/components/shadcnui` (not the default `@/components/ui`). Add components with `bunx shadcn add ...`; they land in `src/components/shadcnui/`.
- The shipped `Button` wraps `Button as ButtonPrimitive` from `@base-ui/react/button`. Do not introduce Radix or `react-aria` primitives; they don't share the Base Luma styling.
- For a link that looks like a button, use `Link` with `buttonVariants` directly, not `Button` wrapping `Link`. Example: `<Link href="#" className={buttonVariants({ variant: "secondary", size: "sm" })}>Login</Link>` with `buttonVariants` imported from `@/components/shadcnui/button`.

## Path aliases (`tsconfig.json`)

- `@/*` → `./src/*`
- `@generated/*` → `./generated/*` (Prisma client only)

## Reserved directories

- `src/server/`: server-only modules (server actions, anything importing `server-only`). Currently a `.gitkeep`.
- `src/hooks/`: custom React hooks. Currently a `.gitkeep`.

## Package manager

- `bun.lock` is committed; Bun is the primary workflow (`bun install`, `bun <script>`). npm works (engines pin `node >=24`, `npm >=11`) but the scripts and README are written around `bun`.

## Zod v4 quirks

- URL validation uses the top-level `z.url()` (not `z.string().url()`). The `.string()` chain method `.url()` does not exist in v4; use `z.url()` or `z.url().optional()` directly.
- `z.string().url()` will fail silently at runtime (returns a type error or unexpected coercion). Always use `z.url()` for WHATWG-compatible URL validation.

## Proxy (was Middleware)

- The `middleware` file convention is **deprecated** in Next.js 16. The file must be named `proxy.ts` and export a function named `proxy` (not `middleware`).
- Proxy defaults to the Node.js runtime (Edge runtime not supported in v16 proxy).
- `@better-fetch/fetch` is not a dependency; use native `fetch` to call `/api/auth/get-session` instead.
- See `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` for full docs.

## typedRoutes with Next.js 16

- `typedRoutes` is enabled; `Link` hrefs must be valid route strings. For routes that don't exist yet (e.g. `/privacy`, `/terms`, `/forgot-password`), cast with `as Route` (import `type { Route } from "next"`). Do **not** use `as any` or `as never`.
- The root `/` is the sign-in page (not a marketing landing page). Sign-up is at `/sign-up`.

## Better Auth

- For `providerId: "credential"` accounts, Better Auth sets `accountId = userId` (the user's own ID), **not** the email. Verified in `node_modules/better-auth/dist/api/routes/sign-up.mjs` (`accountId: createdUser.id`). Sign-in matches on `providerId === "credential"` only, so an email-based `accountId` still logs in, but it breaks any code expecting `accountId === userId`. Seed scripts must mirror this.
- Password hashing lives in `src/lib/argon2.ts` (`hashPasswordFunction` / `verifyPasswordFunction`), wired into `auth.ts` via `emailAndPassword.password.{hash,verify}`. Always reuse these; never call `@node-rs/argon2` directly, or the hash may not verify (the secret is encoded with `TextEncoder`, not `Buffer.from`).
- The `admin()` plugin's default roles are `"admin"` and `"user"` (`adminRoles: ["admin"]`, `defaultRole: "user"`). `role` is a plain nullable `String?` in the schema, not an enum.

## PrismaNeon adapter

- `PrismaNeon` constructor takes `{ connectionString: string }`, not a raw string. Example: `new PrismaNeon({ connectionString: url })`.

## Misc

- ESLint ignores: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`, `generated/**`.
- `.env` is gitignored; `.env.example` is the committed template. Do not commit secrets.
- `CHECKPOINT_DISABLE=1` is set to silence Prisma telemetry.
- No CI workflows or pre-commit hooks exist. Pre-PR verification is `bun lint` then `bun run build` (see Verification above).
