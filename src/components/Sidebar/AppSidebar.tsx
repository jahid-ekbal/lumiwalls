"use client";

import { CompassIcon, LayoutDashboardIcon, UploadIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/shadcnui/sidebar";

const items = [
  { title: "Browse", url: "/browse", icon: CompassIcon },
  { title: "Upload", url: "/upload", icon: UploadIcon },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboardIcon },
];

export function AppSidebar() {
  const { state } = useSidebar();

  return (
    <Sidebar
      collapsible="icon"
      variant="inset"
      className="z-40 border-r">
      <SidebarHeader>
        <div className="flex h-12 items-center gap-2 px-3">
          {state === "expanded" ?
            <span className="text-xl font-semibold">Lumiwalls</span>
          : <span className="text-xl font-semibold">L</span>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
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
    </Sidebar>
  );
}
