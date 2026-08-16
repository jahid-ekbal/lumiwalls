"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcnui/avatar";
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
import { LayoutDashboardIcon, LogOutIcon, UserIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import ThemeToggleButton from "../Buttons/ThemeToggleButton";

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const PrivateHeader = () => {
  const { data: session, isPending } = authClient.useSession();

  const user = session?.user;

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = "/";
  };

  return (
    <header className="bg-background/80 sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b px-4 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded-full p-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user?.image ?? "/placeholder.svg"}
                    alt={user?.name ?? "User avatar"}
                  />
                  <AvatarFallback>
                    {isPending ?
                      ".."
                    : user?.name ?
                      getInitials(user.name)
                    : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            }></DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {isPending ? "Loading..." : (user?.name ?? "Guest")}
                  </span>
                  <span className="text-muted-foreground text-xs">
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
                    <UserIcon className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                }></DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                render={
                  <Link href={"/dashboard" as Route}>
                    <LayoutDashboardIcon className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                }></DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="cursor-pointer"
              onClick={handleSignOut}>
              <LogOutIcon className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ThemeToggleButton />
      </div>
    </header>
  );
};

export default PrivateHeader;
