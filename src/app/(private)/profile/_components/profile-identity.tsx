import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcnui/avatar";
import { buttonVariants } from "@/components/shadcnui/button";
import { Card } from "@/components/shadcnui/card";
import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { formatCount, formatDate, initialsOf } from "@/lib/format";
import { toImagePath } from "@/lib/imageUrl";
import {
  CalendarDaysIcon,
  ExternalLinkIcon,
  MailIcon,
  MapPinIcon,
} from "lucide-react";
import type { Route } from "next";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import ProfileEditDialog from "./profile-edit-dialog";
import ProfileMedia from "./profile-media";

const ProfileIdentity = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      image: true,
      bannerUrl: true,
      bio: true,
      location: true,
      handle: true,
      createdAt: true,
      _count: {
        select: {
          wallpapers: true,
          favorites: true,
          followers: true,
          following: true,
        },
      },
    },
  });
  if (!user) {
    return null;
  }

  const bannerSrc = toImagePath(user.bannerUrl);
  const avatarSrc = toImagePath(user.image);

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="bg-muted/40 relative h-44 overflow-hidden sm:h-52">
        {bannerSrc ?
          <Image
            src={bannerSrc}
            alt="Profile banner"
            fill={true}
            priority={true}
            sizes="(max-width: 1100px) 100vw, 1216px"
            className="object-cover"
          />
        : <div
            aria-hidden="true"
            className="relative size-full overflow-hidden bg-gradient-to-br from-neutral-800/80 via-neutral-900/90 to-background">
            <div className="absolute -top-24 -left-16 size-72 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute -right-12 -bottom-20 size-64 rounded-full bg-white/5 blur-3xl" />
            <div className="border-border/30 absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
        }
        <div className="absolute top-3 right-3 z-10">
          <ProfileMedia kind="banner" />
        </div>
      </div>

      <div className="-mt-10 grid gap-4 px-4 pb-5 sm:px-6 sm:pb-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="relative">
            <Avatar className="ring-card size-20 ring-4">
              {avatarSrc ?
                <AvatarImage
                  src={avatarSrc}
                  alt={user.name}
                />
              : null}
              <AvatarFallback className="text-2xl">
                {initialsOf(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4">
              <ProfileMedia kind="avatar" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {user.handle ?
              <Link
                href={`/u/${user.handle}` as Route}
                className={buttonVariants({ variant: "outline", size: "sm" })}>
                <ExternalLinkIcon data-icon="inline-start" />
                Public profile
              </Link>
            : null}
            <ProfileEditDialog
              name={user.name}
              bio={user.bio ?? ""}
              location={user.location ?? ""}
            />
          </div>
        </div>

        <div className="grid gap-1">
          <h2 className="font-heading text-h2 font-semibold tracking-tight">
            {user.name}
          </h2>
          {user.handle ?
            <Link
              href={`/u/${user.handle}` as Route}
              className="text-muted-foreground hover:text-foreground w-fit text-sm transition-colors">
              @{user.handle}
            </Link>
          : null}
          {user.bio ?
            <p className="text-body-sm pt-1 whitespace-pre-line">{user.bio}</p>
          : <p className="text-body-sm text-muted-foreground pt-1">
              Add a short bio so visitors know what you curate and shoot.
            </p>
          }
        </div>

        <div className="text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
          <span>
            <span className="text-foreground font-semibold tabular-nums">
              {formatCount(user._count.wallpapers)}
            </span>{" "}
            uploads
          </span>
          <span>
            <span className="text-foreground font-semibold tabular-nums">
              {formatCount(user._count.favorites)}
            </span>{" "}
            favorites
          </span>
          <span>
            <span className="text-foreground font-semibold tabular-nums">
              {formatCount(user._count.followers)}
            </span>{" "}
            followers
          </span>
          <span>
            <span className="text-foreground font-semibold tabular-nums">
              {formatCount(user._count.following)}
            </span>{" "}
            following
          </span>
        </div>

        <div className="text-caption text-muted-foreground grid gap-1.5 sm:flex sm:flex-wrap sm:gap-x-5 sm:gap-y-1">
          <span className="flex items-center gap-1.5">
            <MailIcon
              aria-hidden="true"
              className="size-3.5"
            />
            {user.email}
          </span>
          {user.location ?
            <span className="flex items-center gap-1.5">
              <MapPinIcon
                aria-hidden="true"
                className="size-3.5"
              />
              {user.location}
            </span>
          : null}
          <span className="flex items-center gap-1.5">
            <CalendarDaysIcon
              aria-hidden="true"
              className="size-3.5"
            />
            Member since {formatDate(user.createdAt, "MMMM yyyy")}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default ProfileIdentity;
