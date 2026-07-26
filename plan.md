# Layout Restructure Plan

## Goal

Split the app into separate layouts for public (auth) and private (authenticated) routes. Public routes get zero chrome; private routes get a shadcn collapsible sidebar + header + compact footer.

---

## Step 1 — Add missing shadcn components

Add `sidebar`, `tooltip`, and `avatar` via:

```
bunx shadcn@latest add sidebar
bunx shadcn@latest add tooltip
bunx shadcn@latest add avatar
```

---

## Step 2 — Create `src/components/Sidebar/AppSidebar.tsx`

Collapsible sidebar with:

- **SidebarHeader** — Lumiwalls logo
- **SidebarContent** — Nav items (Browse, Upload, Dashboard) with Lucide icons
- **SidebarFooter** — Mini footer: Settings, Sign Out, copyright text

Uses `Sidebar` shadcn primitives.

---

## Step 3 — Create `src/components/Header/PrivateHeader.tsx`

Sticky top bar inside `SidebarInset`:

- **SidebarTrigger** (hamburger button)
- **User avatar + DropdownMenu** (Profile, Dashboard, Sign Out)
- **ThemeToggleButton**

---

## Step 4 — Update `src/app/(private)/layout.tsx`

Wire everything together:

```tsx
<SidebarProvider>
  <AppSidebar />
  <SidebarInset>
    <PrivateHeader />
    <main>{children}</main>
    <Footer /> // compact, inside sidebar footer already
  </SidebarInset>
</SidebarProvider>
```

---

## Step 5 — Tidy public routes

- `(public)/layout.tsx` — just `{children}`, no wrapper
- `(public)/page.tsx` — remove `h-dvh` since there's no header overlap
- `(public)/sign-up/page.tsx` — same

---

## Step 6 — Remove old `Header.tsx` from public layout

The old `Header` component becomes unused and can be deleted (or kept as a backup).

---

## Files Modified/Created

| File                                      | Action          |
| ----------------------------------------- | --------------- |
| `src/components/Sidebar/AppSidebar.tsx`   | Create          |
| `src/components/Header/PrivateHeader.tsx` | Create          |
| `src/app/(private)/layout.tsx`            | Update          |
| `src/app/(public)/layout.tsx`             | Update          |
| `src/app/(public)/page.tsx`               | Update          |
| `src/app/(public)/sign-up/page.tsx`       | Update          |
| `src/components/Header/Header.tsx`        | Delete (unused) |
