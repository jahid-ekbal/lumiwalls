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
import { LogOutIcon, SettingsIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import ThemeToggleButton from "../Buttons/ThemeToggleButton";

const PrivateHeader = () => {
  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = "/";
  };
  return (
    <header className="bg-background/80 sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <h1 className="text-lg font-semibold">Lumiwalls</h1>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggleButton />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded-full p-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src="/placeholder.svg"
                    alt="User avatar"
                  />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </Button>
            }></DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">John Doe</span>
                  <span className="text-muted-foreground text-xs">
                    john@example.com
                  </span>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem
                render={
                  <Link href={"/profile" as Route}>
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                }></DropdownMenuItem>
              <DropdownMenuItem
                render={
                  <Link href={"/dashboard" as Route}>
                    <SettingsIcon className="mr-2 h-4 w-4" />
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
      </div>
    </header>
  );
};

export default PrivateHeader;
