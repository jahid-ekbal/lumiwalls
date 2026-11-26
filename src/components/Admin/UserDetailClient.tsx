"use client";

import EmptyState from "@/components/UI/EmptyState";
import PageHeader from "@/components/UI/PageHeader";
import StatusBadge, { deriveWallpaperStatus } from "@/components/UI/StatusBadge";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/shadcnui/alert";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcnui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/shadcnui/field";
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
import { formatCount, initialsOf } from "@/lib/format";
import { toImagePath } from "@/lib/imageUrl";
import { reviewWallpaper, setBan } from "@/server/actions/moderation";
import {
  adminResetUserPassword,
  deleteUser,
  setRole,
  setWallpaperVisibility,
} from "@/server/actions/users";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  BanIcon,
  CheckIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  KeyRoundIcon,
  Loader2Icon,
  ShieldCheckIcon,
  Trash2Icon,
  UserCogIcon,
} from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import z from "zod";
import { adminActionErrorMessage } from "./adminActionErrors";

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
  mustChangePassword: boolean;
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
  reviewNotes: string | null;
};

type Props = {
  user: DetailUser;
  wallpapers: DetailWallpaper[];
  currentUserId: string;
  isProtected: boolean;
};

const banFormSchema = z.object({
  banReason: z.string().trim().max(500),
  banExpiry: z.enum(["permanent", "1", "7", "30"]),
});

const deleteConfirmSchema = z.object({
  emailInput: z.string().trim().min(1, { error: "Type the user email" }),
});

const UserDetailClient = ({
  user,
  wallpapers,
  currentUserId,
  isProtected,
}: Props) => {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [banOpen, setBanOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [issuedTempPassword, setIssuedTempPassword] = useState<string | null>(
    null,
  );

  const isSelf = user.id === currentUserId;
  const canChangeRole = !isSelf && !isProtected;
  const canBan = !isSelf && !isProtected && user.role !== "admin";
  const canDelete = !isSelf && !isProtected;
  const canResetPassword = !isSelf && !isProtected;
  const hasActions =
    canChangeRole || canBan || canDelete || canResetPassword;

  const banForm = useForm({
    resolver: zodResolver(banFormSchema),
    defaultValues: { banReason: "", banExpiry: "permanent" as const },
  });

  const deleteForm = useForm({
    resolver: zodResolver(deleteConfirmSchema),
    defaultValues: { emailInput: "" },
  });

  const submitBan = async (values: z.infer<typeof banFormSchema>) => {
    const nextBanned = !user.banned;
    if (nextBanned && !values.banReason.trim()) {
      banForm.setError("banReason", { message: "A ban reason is required" });
      return;
    }
    const expires =
      nextBanned && values.banExpiry !== "permanent" ?
        new Date(Date.now() + Number(values.banExpiry) * 24 * 60 * 60 * 1000)
      : undefined;
    setBusy("ban");
    const result = await setBan({
      userId: user.id,
      banned: nextBanned,
      banReason: values.banReason,
      banExpires: expires,
    });
    setBusy(null);
    if (!result.success) {
      toast.error(adminActionErrorMessage(result.error));
      return;
    }
    toast.success(nextBanned ? "User banned and signed out" : "User unbanned");
    setBanOpen(false);
    banForm.reset();
    router.refresh();
  };

  const submitRole = async () => {
    const nextRole = user.role === "admin" ? "user" : "admin";
    setBusy("role");
    const result = await setRole({ userId: user.id, role: nextRole });
    setBusy(null);
    if (!result.success) {
      toast.error(adminActionErrorMessage(result.error));
      return;
    }
    toast.success(
      nextRole === "admin" ? "User promoted to admin" : "Admin demoted to user",
    );
    setRoleOpen(false);
    router.refresh();
  };

  const submitDelete = async (values: z.infer<typeof deleteConfirmSchema>) => {
    if (
      values.emailInput.trim().toLowerCase() !== user.email.toLowerCase()
    ) {
      deleteForm.setError("emailInput", {
        message: "Type the exact user email to confirm deletion",
      });
      return;
    }
    setBusy("delete");
    const result = await deleteUser({ userId: user.id });
    setBusy(null);
    if (!result.success) {
      toast.error(adminActionErrorMessage(result.error));
      return;
    }
    toast.success("User permanently deleted");
    router.replace("/admin/users" as Route);
    router.refresh();
  };

  const submitPasswordReset = async () => {
    setBusy("reset-password");
    const result = await adminResetUserPassword({ userId: user.id });
    setBusy(null);
    if (!result.success) {
      toast.error(adminActionErrorMessage(result.error));
      return;
    }
    setIssuedTempPassword(result.tempPassword);
    toast.success("Temporary password generated and active sessions revoked");
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

  const avatarSrc = toImagePath(user.image);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Account"
        title={user.name}
        description={user.email}
        backHref={"/admin/users" as Route}
        backLabel="Back to users"
      />
      <Card>
        <CardHeader>
          <CardTitle>Account overview</CardTitle>
          <CardDescription>
            {`Joined ${format(new Date(user.createdAt), "MMM d, yyyy")}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center gap-3">
            <Avatar size="sm">
              {avatarSrc ?
                <AvatarImage
                  src={avatarSrc}
                  alt={user.name}
                />
              : null}
              <AvatarFallback>
                {initialsOf(user.name, user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                {user.role}
              </Badge>
              <StatusBadge status={user.banned ? "BANNED" : "ACTIVE"} />
              <Badge variant="outline">
                {user.emailVerified ? "Verified" : "Unverified"}
              </Badge>
              {user.mustChangePassword ?
                <Badge variant="secondary">Password rotation pending</Badge>
              : null}
              {isSelf ?
                <Badge variant="outline">You</Badge>
              : null}
              {isProtected ?
                <Badge variant="outline">Protected</Badge>
              : null}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <p className="text-muted-foreground text-xs">Uploads</p>
              <p className="font-medium tabular-nums">
                {formatCount(user.wallpaperCount)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Pending</p>
              <p className="font-medium tabular-nums">
                {formatCount(user.pendingCount)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Reports made</p>
              <p className="font-medium tabular-nums">
                {formatCount(user.reportsMade)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Reports against</p>
              <p className="font-medium tabular-nums">
                {formatCount(user.reportsAgainst)}
              </p>
            </div>
          </div>
          {user.banReason ?
            <p className="text-muted-foreground text-sm">
              {`Ban reason: ${user.banReason}`}
            </p>
          : null}
          {isSelf ?
            <p className="text-muted-foreground text-sm">
              This is your account. You cannot change your own role, ban
              yourself, reset your password here, or delete yourself.
            </p>
          : null}
          {isProtected ?
            <p className="text-muted-foreground text-sm">
              This is the primary admin account. It cannot be demoted, banned,
              reset, or deleted.
            </p>
          : null}
          <div className="flex flex-wrap gap-2">
            {canBan ?
              <Button
                size="sm"
                variant={user.banned ? "outline" : "destructive"}
                onClick={() => {
                  banForm.reset({ banReason: "", banExpiry: "permanent" });
                  setBanOpen(true);
                }}>
                <BanIcon data-icon="inline-start" />
                {user.banned ? "Unban" : "Ban user"}
              </Button>
            : null}
            {canResetPassword ?
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIssuedTempPassword(null);
                  setResetOpen(true);
                }}>
                <KeyRoundIcon data-icon="inline-start" />
                Reset password
              </Button>
            : null}
            {canChangeRole ?
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRoleOpen(true)}>
                <UserCogIcon data-icon="inline-start" />
                {user.role === "admin" ? "Demote to user" : "Promote to admin"}
              </Button>
            : null}
            {canDelete ?
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  deleteForm.reset({ emailInput: "" });
                  setDeleteOpen(true);
                }}>
                <Trash2Icon data-icon="inline-start" />
                Delete user
              </Button>
            : null}
            {hasActions ? null : (
              <p className="text-muted-foreground text-sm">
                No account actions are available.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Recent uploads</CardTitle>
          <CardDescription>
            Latest 10 wallpapers with moderation notes and visibility controls
          </CardDescription>
        </CardHeader>
        <CardContent>
          {wallpapers.length === 0 ?
            <EmptyState
              compact={true}
              title="No uploads yet"
              description="This account has not uploaded any wallpapers yet."
            />
          : <Table>
              <TableHeader className="bg-card sticky top-0 z-10">
                <TableRow>
                  <TableHead>Wallpaper</TableHead>
                  <TableHead>Status & Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wallpapers.map((item) => {
                  const itemBusy = busy === item.id;
                  const status = deriveWallpaperStatus({
                    isApproved: item.isApproved,
                    moderationStatus: item.queueStatus,
                  });
                  const thumbSrc = toImagePath(item.thumb400Url);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {thumbSrc ?
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={thumbSrc}
                              alt={item.title}
                              className="size-10 shrink-0 rounded-inset object-cover"
                              loading="lazy"
                            />
                          : <div className="bg-muted size-10 shrink-0 rounded-inset" />
                          }
                          <div className="min-w-0">
                            <p className="truncate font-medium">{item.title}</p>
                            <p className="text-muted-foreground truncate text-xs">
                              {item.slug}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="grid gap-1">
                          <div className="flex flex-wrap gap-1">
                            <StatusBadge status={status} />
                            <StatusBadge
                              status={item.isPublic ? "PUBLIC" : "PRIVATE"}
                            />
                          </div>
                          {item.reviewNotes ?
                            <p className="text-caption text-muted-foreground line-clamp-2 max-w-md">
                              {item.reviewNotes}
                            </p>
                          : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {!item.isApproved ?
                            <Button
                              size="sm"
                              disabled={itemBusy}
                              onClick={() => void approveWallpaper(item.id)}>
                              {itemBusy ?
                                <Loader2Icon
                                  data-icon="inline-start"
                                  className="animate-spin"
                                />
                              : <ShieldCheckIcon data-icon="inline-start" />}
                              Approve
                            </Button>
                          : null}
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={itemBusy}
                            onClick={() =>
                              void toggleVisibility(item.id, !item.isPublic)
                            }>
                            {item.isPublic ?
                              <EyeOffIcon data-icon="inline-start" />
                            : <EyeIcon data-icon="inline-start" />}
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
        open={resetOpen}
        onOpenChange={(open) => {
          if (!open) {
            setResetOpen(false);
            setIssuedTempPassword(null);
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue temporary password</DialogTitle>
            <DialogDescription>
              Generates a one-time 20-character password for {user.email}, signs
              out all active sessions, and requires immediate password rotation
              on next sign-in.
            </DialogDescription>
          </DialogHeader>
          {issuedTempPassword ?
            <div className="grid gap-4">
              <Alert>
                <KeyRoundIcon aria-hidden="true" />
                <AlertTitle>Copy this password now</AlertTitle>
                <AlertDescription>
                  It will not be shown again once you close this dialog.
                </AlertDescription>
              </Alert>
              <div className="flex items-center gap-2">
                <Input
                  readOnly={true}
                  value={issuedTempPassword}
                  className="font-mono text-sm"
                  aria-label="Generated temporary password"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(issuedTempPassword);
                      toast.success("Copied temporary password");
                    } catch {
                      toast.error("Copy failed");
                    }
                  }}>
                  <CopyIcon data-icon="inline-start" />
                  Copy
                </Button>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  onClick={() => {
                    setResetOpen(false);
                    setIssuedTempPassword(null);
                  }}>
                  <CheckIcon data-icon="inline-start" />
                  Done
                </Button>
              </DialogFooter>
            </div>
          : <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={busy === "reset-password"}
                onClick={() => void submitPasswordReset()}>
                {busy === "reset-password" ?
                  <Loader2Icon
                    data-icon="inline-start"
                    className="animate-spin"
                  />
                : <KeyRoundIcon data-icon="inline-start" />}
                Generate temporary password
              </Button>
            </DialogFooter>
          }
        </DialogContent>
      </Dialog>

      <Dialog
        open={banOpen}
        onOpenChange={(open) => {
          if (!open) setBanOpen(false);
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{user.banned ? "Unban user" : "Ban user"}</DialogTitle>
            <DialogDescription>
              {`${user.name} (${user.email}). Banning signs the user out immediately.`}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={banForm.handleSubmit(submitBan)}
            className="grid gap-4"
            noValidate>
            <Controller
              name="banReason"
              control={banForm.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="detail-ban-reason">Ban reason</FieldLabel>
                  <Input
                    {...field}
                    id="detail-ban-reason"
                    aria-invalid={fieldState.invalid}
                    placeholder="Required when banning"
                    autoComplete="off"
                  />
                  {fieldState.invalid ?
                    <FieldError errors={[fieldState.error]} />
                  : null}
                </Field>
              )}
            />
            <Controller
              name="banExpiry"
              control={banForm.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="detail-ban-expiry">Expiry</FieldLabel>
                  <Select
                    value={field.value}
                    items={[
                      { value: "permanent", label: "Permanent" },
                      { value: "1", label: "1 day" },
                      { value: "7", label: "7 days" },
                      { value: "30", label: "30 days" },
                    ]}
                    onValueChange={(value) =>
                      field.onChange(value ?? "permanent")
                    }>
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
              )}
            />
            <Button
              type="submit"
              disabled={busy === "ban"}
              variant={user.banned ? "outline" : "destructive"}>
              <BanIcon data-icon="inline-start" />
              {user.banned ? "Unban" : "Ban"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={roleOpen}
        onOpenChange={(open) => {
          if (!open) setRoleOpen(false);
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
          <Button
            type="button"
            disabled={busy === "role"}
            onClick={() => void submitRole()}>
            <CheckIcon data-icon="inline-start" />
            Confirm
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open) setDeleteOpen(false);
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permanently delete user</DialogTitle>
            <DialogDescription>
              {`Deletes ${user.name} plus ${user.wallpaperCount} wallpapers and S3 files. Type the email to confirm.`}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={deleteForm.handleSubmit(submitDelete)}
            className="grid gap-4"
            noValidate>
            <Controller
              name="emailInput"
              control={deleteForm.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="detail-delete-confirm">
                    User email
                  </FieldLabel>
                  <Input
                    {...field}
                    id="detail-delete-confirm"
                    aria-invalid={fieldState.invalid}
                    placeholder={user.email}
                    autoComplete="off"
                  />
                  {fieldState.invalid ?
                    <FieldError errors={[fieldState.error]} />
                  : null}
                </Field>
              )}
            />
            <Button
              type="submit"
              variant="destructive"
              disabled={busy === "delete"}>
              <Trash2Icon data-icon="inline-start" />
              Delete permanently
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserDetailClient;
