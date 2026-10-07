"use client";

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
import type { UsersSearchParamsType } from "@/lib/zodSchema";
import { setBan } from "@/server/actions/moderation";
import { deleteUser, setRole } from "@/server/actions/users";
import { Loader2Icon, SearchIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

type UserRow = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  banned: boolean;
  banReason: string | null;
  banExpires: string | null;
  createdAt: string;
  wallpaperCount: number;
};

type Props = {
  params: UsersSearchParamsType;
  counts: { total: number; totalAdmins: number; totalBanned: number };
  totalPages: number;
  users: UserRow[];
};

const queryOptions = {
  history: "push" as const,
  shallow: false,
  clearOnDefault: true,
  scroll: false,
};

const formatISO = (value: string | null) => {
  if (!value) {
    return "Never";
  }
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

const UsersClient = ({ params, counts, totalPages, users }: Props) => {
  const router = useRouter();
  const [query, setQuery] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions(queryOptions),
  );
  const [role, setRoleFilter] = useQueryState(
    "role",
    parseAsStringLiteral(["all", "admin", "user"] as const)
      .withDefault("all")
      .withOptions(queryOptions),
  );
  const [status, setStatus] = useQueryState(
    "status",
    parseAsStringLiteral(["all", "active", "banned"] as const)
      .withDefault("all")
      .withOptions(queryOptions),
  );
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsStringLiteral(["newest", "oldest"] as const)
      .withDefault("newest")
      .withOptions(queryOptions),
  );
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1).withOptions(queryOptions),
  );
  const [input, setInput] = useState(query ?? "");
  const [prevQuery, setPrevQuery] = useState(query ?? "");
  if ((query ?? "") !== prevQuery) {
    setPrevQuery(query ?? "");
    setInput(query ?? "");
  }

  useEffect(() => {
    if (input === (query ?? "")) {
      return;
    }
    const timer = setTimeout(() => {
      void setQuery(input.trim() === "" ? "" : input);
      void setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [input, query, setQuery, setPage]);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [banTarget, setBanTarget] = useState<UserRow | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banExpiry, setBanExpiry] = useState("permanent");
  const [roleTarget, setRoleTarget] = useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const activeRole = role ?? params.role;
  const activeStatus = status ?? params.status;
  const activeSort = sort ?? params.sort;
  const activePage = page ?? params.page;

  const roleItems = useMemo(
    () => [
      { value: "all", label: "All roles" },
      { value: "admin", label: "Admins" },
      { value: "user", label: "Users" },
    ],
    [],
  );

  const statusItems = useMemo(
    () => [
      { value: "all", label: "All statuses" },
      { value: "active", label: "Active" },
      { value: "banned", label: "Banned" },
    ],
    [],
  );

  const openBan = (row: UserRow) => {
    setBanTarget(row);
    setBanReason("");
    setBanExpiry("permanent");
  };

  const submitBan = async () => {
    if (!banTarget) {
      return;
    }
    const nextBanned = !banTarget.banned;
    if (nextBanned && !banReason.trim()) {
      toast.error("A ban reason is required");
      return;
    }
    const expires =
      nextBanned && banExpiry !== "permanent" ?
        new Date(Date.now() + Number(banExpiry) * 24 * 60 * 60 * 1000)
      : undefined;
    setBusyId(banTarget.id);
    const result = await setBan({
      userId: banTarget.id,
      banned: nextBanned,
      banReason,
      banExpires: expires,
    });
    setBusyId(null);
    if (!result.success) {
      toast.error(
        result.error === "CANNOT_BAN_SELF" ? "You cannot ban yourself"
        : result.error === "CANNOT_BAN_ADMIN" ? "Admins cannot be banned"
        : "Ban update failed",
      );
      return;
    }
    toast.success(nextBanned ? "User banned and signed out" : "User unbanned");
    setBanTarget(null);
    setBanReason("");
    setBanExpiry("permanent");
    router.refresh();
  };

  const submitRole = async () => {
    if (!roleTarget) {
      return;
    }
    const nextRole = roleTarget.role === "admin" ? "user" : "admin";
    setBusyId(roleTarget.id);
    const result = await setRole({ userId: roleTarget.id, role: nextRole });
    setBusyId(null);
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
    setRoleTarget(null);
    router.refresh();
  };

  const submitDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    if (
      deleteConfirm.trim().toLowerCase() !== deleteTarget.email.toLowerCase()
    ) {
      toast.error("Type the user email to confirm deletion");
      return;
    }
    setBusyId(deleteTarget.id);
    const result = await deleteUser({ userId: deleteTarget.id });
    setBusyId(null);
    if (!result.success) {
      toast.error(
        result.error === "CANNOT_DELETE_SELF" ? "You cannot delete yourself"
        : result.error === "LAST_ADMIN" ? "At least one admin must remain"
        : "Delete failed",
      );
      return;
    }
    toast.success("User permanently deleted");
    setDeleteTarget(null);
    setDeleteConfirm("");
    router.refresh();
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            {`${counts.total} total, ${counts.totalAdmins} admins, ${counts.totalBanned} banned`}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Search name or email"
                autoComplete="off"
                aria-label="Search users"
                className="pl-9"
              />
            </div>
            <Select
              value={activeRole}
              items={roleItems}
              onValueChange={(value) => {
                void setRoleFilter(value as "all" | "admin" | "user");
                void setPage(1);
              }}>
              <SelectTrigger
                aria-label="Filter by role"
                className="w-full lg:w-48">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
                <SelectItem value="user">Users</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={activeStatus}
              items={statusItems}
              onValueChange={(value) => {
                void setStatus(value as "all" | "active" | "banned");
                void setPage(1);
              }}>
              <SelectTrigger
                aria-label="Filter by status"
                className="w-full lg:w-48">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={activeSort}
              items={[
                { value: "newest", label: "Newest" },
                { value: "oldest", label: "Oldest" },
              ]}
              onValueChange={(value) => {
                void setSort(value as "newest" | "oldest");
                void setPage(1);
              }}>
              <SelectTrigger
                aria-label="Sort users"
                className="w-full lg:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
          <CardDescription>
            {`Page ${activePage} of ${totalPages}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ?
            <Alert>
              <AlertTitle>No users</AlertTitle>
              <AlertDescription>No users match this filter.</AlertDescription>
            </Alert>
          : <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Uploads</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((row) => {
                  const busy = busyId === row.id;
                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar size="sm">
                            {row.image ?
                              <AvatarImage
                                src={row.image}
                                alt={row.name}
                              />
                            : null}
                            <AvatarFallback>
                              {initials(row.name, row.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{row.name}</p>
                            <p className="text-muted-foreground text-xs">
                              {row.email}
                            </p>
                            {row.banned ?
                              <Badge variant="destructive">Banned</Badge>
                            : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            row.role === "admin" ? "default" : "secondary"
                          }>
                          {row.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{row.wallpaperCount}</TableCell>
                      <TableCell>{formatISO(row.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Link
                            href={`/admin/users/${row.id}` as Route}
                            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-4xl border px-3 text-sm font-medium transition">
                            Detail
                          </Link>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() => openBan(row)}>
                            {row.banned ? "Unban" : "Ban"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => setRoleTarget(row)}>
                            {row.role === "admin" ? "Demote" : "Promote"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() => {
                              setDeleteTarget(row);
                              setDeleteConfirm("");
                            }}>
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          }
          <div className="mt-4 flex items-center justify-between">
            <Button
              size="sm"
              variant="outline"
              disabled={activePage <= 1}
              onClick={() => void setPage(Math.max(1, activePage - 1))}>
              Previous
            </Button>
            <span className="text-muted-foreground text-sm">
              {`Page ${activePage} of ${totalPages}`}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={activePage >= totalPages}
              onClick={() =>
                void setPage(Math.min(totalPages, activePage + 1))
              }>
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
      <Dialog
        open={banTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setBanTarget(null);
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {banTarget?.banned ? "Unban user" : "Ban user"}
            </DialogTitle>
            <DialogDescription>
              {banTarget ?
                `${banTarget.name} (${banTarget.email})`
              : "Update ban"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Field>
              <FieldLabel htmlFor="user-ban-reason">Ban reason</FieldLabel>
              <Input
                id="user-ban-reason"
                value={banReason}
                onChange={(event) => setBanReason(event.target.value)}
                placeholder="Required when banning"
                autoComplete="off"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="user-ban-expiry">Expiry</FieldLabel>
              <Select
                value={banExpiry}
                items={[
                  { value: "permanent", label: "Permanent" },
                  { value: "1", label: "1 day" },
                  { value: "7", label: "7 days" },
                  { value: "30", label: "30 days" },
                ]}
                onValueChange={(value) => setBanExpiry(value ?? "permanent")}>
                <SelectTrigger id="user-ban-expiry">
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
            <p className="text-muted-foreground text-xs">
              Banning signs the user out immediately.
            </p>
            <Button
              onClick={() => void submitBan()}
              variant={banTarget?.banned ? "outline" : "destructive"}>
              {busyId ?
                <Loader2Icon className="animate-spin" />
              : banTarget?.banned ?
                "Unban"
              : "Ban"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={roleTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRoleTarget(null);
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {roleTarget?.role === "admin" ?
                "Demote to user"
              : "Promote to admin"}
            </DialogTitle>
            <DialogDescription>
              {roleTarget ?
                `${roleTarget.name} (${roleTarget.email})`
              : "Update role"}
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => void submitRole()}>Confirm</Button>
        </DialogContent>
      </Dialog>
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permanently delete user</DialogTitle>
            <DialogDescription>
              {deleteTarget ?
                `Deletes ${deleteTarget.name} plus ${deleteTarget.wallpaperCount} wallpapers and S3 files. Type the email to confirm.`
              : "Delete user"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Field>
              <FieldLabel htmlFor="user-delete-confirm">User email</FieldLabel>
              <Input
                id="user-delete-confirm"
                value={deleteConfirm}
                onChange={(event) => setDeleteConfirm(event.target.value)}
                placeholder={deleteTarget?.email ?? "user email"}
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

export default UsersClient;
