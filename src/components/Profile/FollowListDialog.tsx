"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcnui/avatar";
import { Button, buttonVariants } from "@/components/shadcnui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcnui/dialog";
import { formatCount, initialsOf } from "@/lib/format";
import { toImagePath } from "@/lib/imageUrl";
import { ArrowRightIcon, UsersIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";

export type FollowListPerson = {
  id: string;
  name: string;
  handle: string | null;
  image: string | null;
};

type FollowListButtonsProps = {
  followersCount: number;
  followingCount: number;
  followers: FollowListPerson[];
  following: FollowListPerson[];
};

const FollowListButtons = ({
  followersCount,
  followingCount,
  followers,
  following,
}: FollowListButtonsProps) => {
  const [openTab, setOpenTab] = useState<"followers" | "following" | null>(null);
  const people = openTab === "followers" ? followers : following;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="xs"
        className="text-muted-foreground hover:text-foreground h-auto px-1.5 py-0.5 text-sm font-normal"
        onClick={() => setOpenTab("followers")}>
        <UsersIcon
          data-icon="inline-start"
          className="size-3.5"
        />
        <span className="text-foreground font-semibold tabular-nums">
          {formatCount(followersCount)}
        </span>{" "}
        followers
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="xs"
        className="text-muted-foreground hover:text-foreground h-auto px-1.5 py-0.5 text-sm font-normal"
        onClick={() => setOpenTab("following")}>
        <UsersIcon
          data-icon="inline-start"
          className="size-3.5"
        />
        <span className="text-foreground font-semibold tabular-nums">
          {formatCount(followingCount)}
        </span>{" "}
        following
      </Button>

      <Dialog
        open={openTab !== null}
        onOpenChange={(next) => {
          if (!next) setOpenTab(null);
        }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {openTab === "followers" ? "Followers" : "Following"}
            </DialogTitle>
            <DialogDescription>
              {openTab === "followers" ?
                "Members following this creator profile."
              : "Creators followed by this profile."}
            </DialogDescription>
          </DialogHeader>
          {people.length === 0 ?
            <p className="text-muted-foreground py-6 text-center text-sm">
              No profiles in this list yet.
            </p>
          : <ul className="grid max-h-80 gap-2 overflow-y-auto pr-1">
              {people.map((person) => {
                const avatarSrc = toImagePath(person.image);
                return (
                  <li
                    key={person.id}
                    className="border-border/60 flex items-center justify-between gap-3 rounded-inset border px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar className="size-8 shrink-0">
                        {avatarSrc ?
                          <AvatarImage
                            src={avatarSrc}
                            alt={person.name}
                          />
                        : null}
                        <AvatarFallback>
                          {initialsOf(person.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid min-w-0">
                        <span className="truncate text-sm font-medium">
                          {person.name}
                        </span>
                        {person.handle ?
                          <span className="text-caption text-muted-foreground truncate">
                            @{person.handle}
                          </span>
                        : null}
                      </div>
                    </div>
                    {person.handle ?
                      <Link
                        href={`/u/${person.handle}` as Route}
                        onClick={() => setOpenTab(null)}
                        className={buttonVariants({
                          variant: "outline",
                          size: "xs",
                        })}>
                        View
                        <ArrowRightIcon data-icon="inline-end" />
                      </Link>
                    : null}
                  </li>
                );
              })}
            </ul>
          }
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FollowListButtons;
