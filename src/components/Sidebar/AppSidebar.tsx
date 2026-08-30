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
  LayoutDashboardIcon,
  SettingsIcon,
  ShieldIcon,
  SparklesIcon,
  TagsIcon,
  UploadIcon,
  UsersIcon,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { title: "Browse", url: "/browse", icon: CompassIcon },
  { title: "Upload", url: "/upload", icon: UploadIcon },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboardIcon },
];

const adminItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboardIcon },
  { title: "Taxonomy", url: "/admin/taxonomy", icon: TagsIcon },
  { title: "Moderation", url: "/admin/moderation", icon: ShieldIcon },
  { title: "Users", url: "/admin/users", icon: UsersIcon },
  { title: "Reports", url: "/admin/reports", icon: FlagIcon },
  { title: "Collections", url: "/admin/collections", icon: FolderOpenIcon },
  { title: "Featured", url: "/admin/featured", icon: SparklesIcon },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3Icon },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const pathname = usePathname();
  const { data: session } = authClient.useSession();

  const isAdmin = session?.user.role === "admin";
  const path = pathname ?? "";

  function isActivePath(url: string) {
    return path === url || path.startsWith(url + "/");
  }

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      className="z-40">
      <SidebarHeader>
        <div className="flex h-12 items-center px-0.5">
          <Brand showText={state === "expanded"} />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>General</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={isActivePath(item.url)}
                    render={
                      <Link href={item.url as Route}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    }
                    tooltip={item.title}
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => {
                  const isAdminDashboard = item.url === "/admin";
                  const isActive =
                    isAdminDashboard ?
                      path === "/admin"
                    : isActivePath(item.url);
                  const isAncestor =
                    isAdminDashboard && !isActive && path.startsWith("/admin/");

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        isActive={isActive}
                        className={isAncestor ? "opacity-60" : undefined}
                        data-ancestor={isAncestor || undefined}
                        render={
                          <Link href={item.url as Route}>
                            <item.icon />
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
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isActivePath("/settings")}
              render={
                <Link href={"/settings" as Route}>
                  <SettingsIcon />
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
