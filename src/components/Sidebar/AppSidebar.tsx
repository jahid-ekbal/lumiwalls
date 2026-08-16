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
  CompassIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  SettingsIcon,
  UploadIcon,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { title: "Browse", url: "/browse", icon: CompassIcon },
  { title: "Upload", url: "/upload", icon: UploadIcon },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboardIcon },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const pathname = usePathname();

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
