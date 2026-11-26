"use client";

import Brand from "@/components/Brand/Brand";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/shadcnui/sidebar";
import { authClient } from "@/lib/auth-client";
import {
  BarChart3Icon,
  CompassIcon,
  FlagIcon,
  FolderOpenIcon,
  ImagesIcon,
  LayoutDashboardIcon,
  LayoutGridIcon,
  SettingsIcon,
  ShieldIcon,
  SparklesIcon,
  TagsIcon,
  UploadIcon,
  UserRoundIcon,
  UsersIcon,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const items = [
  { title: "Browse", url: "/browse", icon: CompassIcon },
  { title: "My uploads", url: "/upload", icon: ImagesIcon },
  { title: "New upload", url: "/upload/new", icon: UploadIcon },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboardIcon },
];

const adminItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboardIcon },
  { title: "Categories", url: "/admin/categories", icon: LayoutGridIcon },
  { title: "Tags", url: "/admin/tags", icon: TagsIcon },
  { title: "Moderation", url: "/admin/moderation", icon: ShieldIcon },
  { title: "Users", url: "/admin/users", icon: UsersIcon },
  { title: "Reports", url: "/admin/reports", icon: FlagIcon },
  { title: "Collections", url: "/admin/collections", icon: FolderOpenIcon },
  { title: "Featured", url: "/admin/featured", icon: SparklesIcon },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3Icon },
];

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const { data: session } = authClient.useSession();

  const isAdmin = session?.user.role === "admin";
  const path = pathname ?? "";

  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [path, isMobile, setOpenMobile]);

  const closeMobile = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  function isActivePath(url: string) {
    return path === url || path.startsWith(url + "/");
  }

  function isActiveItem(url: string) {
    if (url === "/upload") {
      return (
        path === "/upload" ||
        (path.startsWith("/upload/") && !path.startsWith("/upload/new"))
      );
    }
    return isActivePath(url);
  }

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      className="z-40">
      <SidebarHeader>
        <div className="flex h-12 items-center px-1">
          <Brand showText={state === "expanded" || isMobile} />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Gallery</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = isActiveItem(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={active}
                      render={
                        <Link
                          href={item.url as Route}
                          aria-current={active ? "page" : undefined}
                          onClick={closeMobile}>
                          <item.icon aria-hidden="true" />
                          <span>{item.title}</span>
                        </Link>
                      }
                      tooltip={item.title}
                    />
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin ?
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => {
                  const isAdminDashboard = item.url === "/admin";
                  const active =
                    isAdminDashboard ?
                      path === "/admin"
                    : isActivePath(item.url);

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        isActive={active}
                        render={
                          <Link
                            href={item.url as Route}
                            aria-current={active ? "page" : undefined}
                            onClick={closeMobile}>
                            <item.icon aria-hidden="true" />
                            <span>{item.title}</span>
                          </Link>
                        }
                        tooltip={item.title}
                      />
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        : null}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isActivePath("/profile")}
              render={
                <Link
                  href={"/profile" as Route}
                  aria-current={isActivePath("/profile") ? "page" : undefined}
                  onClick={closeMobile}>
                  <UserRoundIcon aria-hidden="true" />
                  <span>Profile</span>
                </Link>
              }
              tooltip="Profile"
            />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isActivePath("/settings")}
              render={
                <Link
                  href={"/settings" as Route}
                  aria-current={isActivePath("/settings") ? "page" : undefined}
                  onClick={closeMobile}>
                  <SettingsIcon aria-hidden="true" />
                  <span>Settings</span>
                </Link>
              }
              tooltip="Settings"
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
