"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcnui/avatar";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcnui/dropdown-menu";
import { SidebarTrigger } from "@/components/shadcnui/sidebar";
import { authClient } from "@/lib/auth-client";
import { initialsOf } from "@/lib/format";
import {
  ChevronRightIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  SettingsIcon,
  ShieldIcon,
  UserIcon,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggleButton from "../Buttons/ThemeToggleButton";

type Crumb = {
  label: string;
  href?: Route;
};

const ROUTE_LABELS: Record<string, string> = {
  browse: "Browse",
  dashboard: "Dashboard",
  profile: "Profile",
  settings: "Settings",
  upload: "My uploads",
  new: "New upload",
  edit: "Edit upload",
  admin: "Admin",
  categories: "Categories",
  tags: "Tags",
  moderation: "Moderation",
  users: "Users",
  reports: "Reports",
  collections: "Collections",
  featured: "Featured",
  analytics: "Analytics",
};

const buildBreadcrumbs = (pathname: string): Crumb[] => {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return [{ label: "Browse" }];
  }

  const crumbs: Crumb[] = [];
  let acc = "";
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    acc += `/${segment}`;
    const isLast = i === segments.length - 1;
    const mapped = ROUTE_LABELS[segment];
    const label = mapped ?? (segment.length > 16 ? "Details" : segment);
    crumbs.push({
      label,
      href: !isLast ? (acc as Route) : undefined,
    });
  }
  return crumbs;
};

const PrivateHeader = () => {
  const { data: session, isPending } = authClient.useSession();
  const pathname = usePathname() ?? "/browse";

  const user = session?.user;
  const isAdmin = user?.role === "admin";
  const isAdminRoute = pathname.startsWith("/admin");
  const crumbs = buildBreadcrumbs(pathname);

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = "/";
  };

  return (
    <header className="border-border/60 bg-background/80 sticky top-0 z-30 border-b backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <SidebarTrigger aria-label="Toggle navigation sidebar" />
          <nav
            aria-label="Breadcrumb"
            className="flex min-w-0 items-center gap-1.5 text-sm">
            {crumbs.map((crumb, index) => {
              const isLast = index === crumbs.length - 1;
              return (
                <span
                  key={`${crumb.label}-${index}`}
                  className="flex min-w-0 items-center gap-1.5">
                  {index > 0 ?
                    <ChevronRightIcon
                      aria-hidden="true"
                      className="text-muted-foreground size-3.5 shrink-0 opacity-60"
                    />
                  : null}
                  {crumb.href && !isLast ?
                    <Link
                      href={crumb.href}
                      className="text-foreground/70 hover:text-foreground truncate opacity-60 transition-opacity hover:opacity-100">
                      {crumb.label}
                    </Link>
                  : <span
                      aria-current="page"
                      className="text-foreground truncate font-medium">
                      {crumb.label}
                    </span>
                  }
                </span>
              );
            })}
          </nav>
          {isAdminRoute ?
            <Badge
              variant="secondary"
              className="hidden sm:inline-flex">
              <ShieldIcon data-icon="inline-start" />
              Admin
            </Badge>
          : null}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <ThemeToggleButton />

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Account menu"
                  className="rounded-full">
                  <Avatar className="size-8">
                    {user?.image ?
                      <AvatarImage
                        src={user.image}
                        alt={user?.name ?? "User avatar"}
                      />
                    : null}
                    <AvatarFallback>
                      {isPending ?
                        ".."
                      : user?.name ?
                        initialsOf(user.name, user.email ?? "")
                      : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              }
            />

            <DropdownMenuContent
              align="end"
              className="w-60">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-0.5">
                    <span className="truncate text-sm font-medium text-foreground">
                      {isPending ? "Loading..." : (user?.name ?? "Guest")}
                    </span>
                    <span className="text-muted-foreground truncate text-xs font-normal">
                      {user?.email ?? "Not signed in"}
                    </span>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="cursor-pointer"
                  render={
                    <Link href={"/profile" as Route}>
                      <UserIcon />
                      Profile
                    </Link>
                  }
                />
                <DropdownMenuItem
                  className="cursor-pointer"
                  render={
                    <Link href={"/dashboard" as Route}>
                      <LayoutDashboardIcon />
                      Dashboard
                    </Link>
                  }
                />
                <DropdownMenuItem
                  className="cursor-pointer"
                  render={
                    <Link href={"/settings" as Route}>
                      <SettingsIcon />
                      Settings
                    </Link>
                  }
                />
                {isAdmin ?
                  <DropdownMenuItem
                    className="cursor-pointer"
                    render={
                      <Link href={"/admin" as Route}>
                        <ShieldIcon />
                        Admin console
                      </Link>
                    }
                  />
                : null}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem
                  variant="destructive"
                  className="cursor-pointer"
                  onClick={handleSignOut}>
                  <LogOutIcon />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default PrivateHeader;
