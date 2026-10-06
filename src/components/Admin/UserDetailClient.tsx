"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcnui/avatar";
import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcnui/dialog";
import { Field, FieldLabel } from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcnui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcnui/table";
import { reviewWallpaper, setBan } from "@/server/actions/moderation";
import {
  deleteUser,
  setRole,
  setWallpaperVisibility,
} from "@/server/actions/users";
import { Loader2Icon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

type DetailUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  banned: boolean;
  banReason: string | null;
  banExpires: string | null;
  emailVerified: boolean;
  createdAt: string;
  wallpaperCount: number;
  pendingCount: number;
  reportsMade: number;
  reportsAgainst: number;
};

type DetailWallpaper = {
  id: string;
  title: string;
  slug: string;
  thumb400Url: string | null;
  isPublic: boolean;
  isApproved: boolean;
  createdAt: string;
  queueStatus: string | null;
};

type Props = {
  user: DetailUser;
  wallpapers: DetailWallpaper[];
};

const initials = (name: string, email: string) => {
  const source = name.trim() || email.trim();
  if (!source) {
    return "?";
  }
  const parts = source.split(/\s+/);
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
};

const UserDetailClient = ({ user, wallpapers }: Props) => {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [banOpen, setBanOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banExpiry, setBanExpiry] = useState("permanent");
  const [roleOpen, setRoleOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const submitBan = async () => {
    const nextBanned = !user.banned;
    if (nextBanned && !banReason.trim()) {
      toast.error("A ban reason is required");
      return;
    }
    const expires =
      nextBanned && banExpiry !== "permanent" ?
        new Date(Date.now() + Number(banExpiry) * 24 * 60 * 60 * 1000)
      : undefined;
    setBusy("ban");
    const result = await setBan({
      userId: user.id,
      banned: nextBanned,
      banReason,
      banExpires: expires,
    });
    setBusy(null);
    if (!result.success) {
      toast.error("Ban update failed");
      return;
    }
    toast.success(nextBanned ? "User banned and signed out" : "User unbanned");
    setBanOpen(false);
    setBanReason("");
    router.refresh();
  };

  const submitRole = async () => {
    const nextRole = user.role === "admin" ? "user" : "admin";
    setBusy("role");
    const result = await setRole({ userId: user.id, role: nextRole });
    setBusy(null);
    if (!result.success) {
      toast.error(
        result.error === "CANNOT_DEMOTE_SELF" ? "You cannot demote yourself"
        : result.error === "LAST_ADMIN" ? "At least one admin must remain"
        : "Role update failed",
      );
      return;
    }
    toast.success(
      nextRole === "admin" ? "User promoted to admin" : "Admin demoted to user",
    );
    setRoleOpen(false);
    router.refresh();
  };

  const submitDelete = async () => {
    if (deleteConfirm.trim().toLowerCase() !== user.email.toLowerCase()) {
      toast.error("Type the user email to confirm deletion");
      return;
    }
    setBusy("delete");
    const result = await deleteUser({ userId: user.id });
    setBusy(null);
    if (!result.success) {
      toast.error("Delete failed");
      return;
    }
    toast.success("User permanently deleted");
    router.replace("/admin/users" as Route);
    router.refresh();
  };

  const approveWallpaper = async (wallpaperId: string) => {
    setBusy(wallpaperId);
    const result = await reviewWallpaper({
      wallpaperId,
      decision: "APPROVED",
      reviewNotes: "",
    });
    setBusy(null);
    if (!result.success) {
      toast.error("Approve failed");
      return;
    }
    toast.success("Wallpaper approved");
    router.refresh();
  };

  const toggleVisibility = async (wallpaperId: string, isPublic: boolean) => {
    setBusy(wallpaperId);
    const result = await setWallpaperVisibility({ wallpaperId, isPublic });
    setBusy(null);
    if (!result.success) {
      toast.error("Visibility update failed");
      return;
    }
    toast.success(isPublic ? "Wallpaper visible" : "Wallpaper hidden");
    router.refresh();
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <Link
          href={"/admin/users" as Route}
          className="text-muted-foreground text-sm">
          Back to users
        </Link>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {user.name}
        </h1>
        <p className="text-muted-foreground text-sm">{user.email}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            {`Joined ${new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center gap-3">
            <Avatar size="sm">
              {user.image ?
                <AvatarImage
                  src={user.image}
                  alt={user.name}
                />
              : null}
              <AvatarFallback>{initials(user.name, user.email)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-wrap gap-1">
              <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                {user.role}
              </Badge>
              {user.banned ?
                <Badge variant="destructive">Banned</Badge>
              : <Badge variant="outline">Active</Badge>}
              {user.emailVerified ?
                <Badge variant="outline">Verified</Badge>
              : <Badge variant="outline">Unverified</Badge>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <div>
              <p className="text-muted-foreground text-xs">Uploads</p>
              <p className="font-medium">{user.wallpaperCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Pending</p>
              <p className="font-medium">{user.pendingCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Reports made</p>
              <p className="font-medium">{user.reportsMade}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Reports against</p>
              <p className="font-medium">{user.reportsAgainst}</p>
            </div>
          </div>
          {user.banReason ?
            <p className="text-muted-foreground text-sm">
              {`Ban reason: ${user.banReason}`}
            </p>
          : null}
          <div className="flex flex-wrap gap-1">
            <Button
              size="sm"
              variant={user.banned ? "outline" : "destructive"}
              onClick={() => {
                setBanReason("");
                setBanExpiry("permanent");
                setBanOpen(true);
              }}>
              {user.banned ? "Unban" : "Ban"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRoleOpen(true)}>
              {user.role === "admin" ? "Demote" : "Promote"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setDeleteConfirm("");
                setDeleteOpen(true);
              }}>
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Recent uploads</CardTitle>
          <CardDescription>
            Latest 10 wallpapers with moderation shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {wallpapers.length === 0 ?
            <p className="text-muted-foreground py-8 text-center text-sm">
              No uploads yet.
            </p>
          : <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wallpaper</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wallpapers.map((item) => {
                  const itemBusy = busy === item.id;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {item.thumb400Url ?
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.thumb400Url}
                              alt={item.title}
                              className="size-10 shrink-0 rounded-xl object-cover"
                              loading="lazy"
                            />
                          : <div className="bg-muted size-10 shrink-0 rounded-xl" />
                          }
                          <div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-muted-foreground text-xs">
                              {item.slug}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Badge
                            variant={item.isApproved ? "default" : "secondary"}>
                            {item.isApproved ? "Approved" : "Unapproved"}
                          </Badge>
                          <Badge
                            variant={item.isPublic ? "outline" : "destructive"}>
                            {item.isPublic ? "Public" : "Hidden"}
                          </Badge>
                          {item.queueStatus ?
                            <Badge variant="outline">{item.queueStatus}</Badge>
                          : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {!item.isApproved ?
                            <Button
                              size="sm"
                              disabled={itemBusy}
                              onClick={() => void approveWallpaper(item.id)}>
                              {itemBusy ?
                                <Loader2Icon className="animate-spin" />
                              : "Approve"}
                            </Button>
                          : null}
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={itemBusy}
                            onClick={() =>
                              void toggleVisibility(item.id, !item.isPublic)
                            }>
                            {item.isPublic ? "Hide" : "Unhide"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          }
        </CardContent>
      </Card>
      <Dialog
        open={banOpen}
        onOpenChange={(open) => {
          if (!open) {
            setBanOpen(false);
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{user.banned ? "Unban user" : "Ban user"}</DialogTitle>
            <DialogDescription>
              {`${user.name} (${user.email}). Banning signs the user out immediately.`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Field>
              <FieldLabel htmlFor="detail-ban-reason">Ban reason</FieldLabel>
              <Input
                id="detail-ban-reason"
                value={banReason}
                onChange={(event) => setBanReason(event.target.value)}
                placeholder="Required when banning"
                autoComplete="off"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="detail-ban-expiry">Expiry</FieldLabel>
              <Select
                value={banExpiry}
                items={[
                  { value: "permanent", label: "Permanent" },
                  { value: "1", label: "1 day" },
                  { value: "7", label: "7 days" },
                  { value: "30", label: "30 days" },
                ]}
                onValueChange={(value) => setBanExpiry(value)}>
                <SelectTrigger id="detail-ban-expiry">
                  <SelectValue placeholder="Select expiry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Button
              onClick={() => void submitBan()}
              variant={user.banned ? "outline" : "destructive"}>
              {user.banned ? "Unban" : "Ban"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={roleOpen}
        onOpenChange={(open) => {
          if (!open) {
            setRoleOpen(false);
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {user.role === "admin" ? "Demote to user" : "Promote to admin"}
            </DialogTitle>
            <DialogDescription>
              {`${user.name} (${user.email})`}
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => void submitRole()}>Confirm</Button>
        </DialogContent>
      </Dialog>
      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteOpen(false);
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permanently delete user</DialogTitle>
            <DialogDescription>
              {`Deletes ${user.name} plus ${user.wallpaperCount} wallpapers and S3 files. Type the email to confirm.`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Field>
              <FieldLabel htmlFor="detail-delete-confirm">
                User email
              </FieldLabel>
              <Input
                id="detail-delete-confirm"
                value={deleteConfirm}
                onChange={(event) => setDeleteConfirm(event.target.value)}
                placeholder={user.email}
                autoComplete="off"
              />
            </Field>
            <Button
              variant="destructive"
              onClick={() => void submitDelete()}>
              Delete permanently
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserDetailClient;
