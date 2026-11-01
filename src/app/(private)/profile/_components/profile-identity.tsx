import { initialsOf } from "@/components/Browse/countFormat";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcnui/avatar";
import { Card } from "@/components/shadcnui/card";
import { auth } from "@/lib/auth";
import prisma from "@/lib/database/dbClient";
import { toImagePath } from "@/lib/imageUrl";
import { format } from "date-fns";
import { CalendarDaysIcon, MailIcon, MapPinIcon } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
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
    },
  });
  if (!user) {
    return null;
  }

  const bannerSrc = toImagePath(user.bannerUrl);
  const avatarSrc = toImagePath(user.image);

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="relative h-44 overflow-hidden sm:h-52">
        {bannerSrc ?
          <Image
            src={bannerSrc}
            alt="Profile banner"
            fill={true}
            priority={true}
            sizes="(max-width: 1100px) 100vw, 1216px"
            className="object-cover"
          />
        : <div className="from-primary/25 via-primary/5 bg-gradient-to-tr to-transparent" />
        }
        <div className="absolute top-3 right-3">
          <ProfileMedia kind="banner" />
        </div>
      </div>

      <div className="-mt-10 grid gap-3 px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="flex items-end justify-between gap-3">
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
          <ProfileEditDialog
            name={user.name}
            bio={user.bio ?? ""}
            location={user.location ?? ""}
          />
        </div>

        <div className="grid gap-1">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
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
            <p className="text-sm whitespace-pre-line">{user.bio}</p>
          : <p className="text-muted-foreground text-sm">No bio yet.</p>}
        </div>

        <div className="text-muted-foreground grid gap-1.5 text-sm sm:flex sm:flex-wrap sm:gap-x-5 sm:gap-y-1">
          <span className="flex items-center gap-1.5">
            <MailIcon className="size-4" />
            {user.email}
          </span>
          {user.location ?
            <span className="flex items-center gap-1.5">
              <MapPinIcon className="size-4" />
              {user.location}
            </span>
          : null}
          <span className="flex items-center gap-1.5">
            <CalendarDaysIcon className="size-4" />
            Member since {format(user.createdAt, "MMMM yyyy")}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default ProfileIdentity;
