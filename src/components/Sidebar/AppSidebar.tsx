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
  LogOutIcon,
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

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = "/";
  };

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
                    isActive={pathname.startsWith(item.url)}
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
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={pathname.startsWith(item.url)}
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
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname.startsWith("/settings")}
              render={
                <Link href={"/settings" as Route}>
                  <SettingsIcon />
                  <span>Settings</span>
                </Link>
              }
              tooltip="Settings"
            />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              tooltip="Sign Out">
              <LogOutIcon />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
