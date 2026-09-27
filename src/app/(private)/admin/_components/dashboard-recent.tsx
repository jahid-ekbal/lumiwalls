import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcnui/avatar";
import { Badge } from "@/components/shadcnui/badge";
import { buttonVariants } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcnui/table";
import prisma from "@/lib/database/dbClient";
import { ArrowRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { formatDate, initials, PREVIEW_TAKE } from "./dashboard-utils";

const DashboardRecent = async () => {
  const [recentWallpapers, recentUsers] = await Promise.all([
    prisma.wallpaper.findMany({
      orderBy: { createdAt: "desc" },
      take: PREVIEW_TAKE,
      include: {
        uploader: { select: { name: true, email: true } },
        category: { select: { name: true } },
        moderationQueue: { select: { status: true } },
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: PREVIEW_TAKE,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        banned: true,
        createdAt: true,
      },
    }),
  ]);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Recent wallpapers</CardTitle>
              <CardDescription>Latest {PREVIEW_TAKE} uploads</CardDescription>
            </div>
            <Link
              href={"/browse" as Route}
              className={buttonVariants({
                variant: "ghost",
                size: "sm",
              })}>
              <span>Browse all</span>
              <ArrowRightIcon />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentWallpapers.length === 0 ?
            <p className="text-muted-foreground py-8 text-center text-sm">
              No wallpapers yet.
            </p>
          : <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wallpaper</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentWallpapers.map((wallpaper) => (
                  <TableRow key={wallpaper.id}>
                    <TableCell>
                      <p className="font-medium">{wallpaper.title}</p>
                      <p className="text-muted-foreground text-xs">
                        {wallpaper.uploader.email} on{" "}
                        {formatDate(wallpaper.createdAt)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge
                          variant={
                            wallpaper.isApproved ? "secondary" : "outline"
                          }>
                          {wallpaper.isApproved ? "Approved" : "Unapproved"}
                        </Badge>
                        {wallpaper.moderationQueue ?
                          <Badge variant="outline">
                            {wallpaper.moderationQueue.status}
                          </Badge>
                        : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          }
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Recent users</CardTitle>
              <CardDescription>Latest {PREVIEW_TAKE} accounts</CardDescription>
            </div>
            <Link
              href={"/admin/users" as Route}
              className={buttonVariants({
                variant: "ghost",
                size: "sm",
              })}>
              <span>Manage users</span>
              <ArrowRightIcon />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentUsers.length === 0 ?
            <p className="text-muted-foreground py-8 text-center text-sm">
              No users yet.
            </p>
          : <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar size="sm">
                          {user.image ?
                            <AvatarImage
                              src={user.image}
                              alt={user.name}
                            />
                          : null}
                          <AvatarFallback>
                            {initials(user.name, user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-muted-foreground text-xs">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge
                          variant={
                            user.role === "admin" ? "default" : "secondary"
                          }>
                          {user.role ?? "user"}
                        </Badge>
                        {user.banned ?
                          <Badge variant="destructive">Banned</Badge>
                        : null}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          }
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardRecent;
