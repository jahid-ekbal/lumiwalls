"use client";

import PasswordInput from "@/components/Auth/PasswordInput";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/shadcnui/alert";
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
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/shadcnui/field";
import { authClient } from "@/lib/auth-client";
import { profilePasswordSchema } from "@/lib/zodSchema";
import { completePasswordRotation } from "@/server/actions/profile";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  KeyRoundIcon,
  Loader2Icon,
  ShieldAlertIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";

type ListSessionsResult = Awaited<ReturnType<typeof authClient.listSessions>>;
type AuthSession = NonNullable<ListSessionsResult["data"]>[number];

const deviceLabel = (userAgent: string | null | undefined): string => {
  if (!userAgent) {
    return "Unknown device";
  }
  const browser =
    userAgent.includes("Edg/") ? "Edge"
    : userAgent.includes("Firefox/") ? "Firefox"
    : userAgent.includes("Chrome/") ? "Chrome"
    : userAgent.includes("Safari/") ? "Safari"
    : "Browser";
  const os =
    userAgent.includes("Windows") ? "Windows"
    : userAgent.includes("Mac OS") ? "macOS"
    : userAgent.includes("Android") ? "Android"
    : userAgent.includes("iPhone") || userAgent.includes("iPad") ? "iOS"
    : userAgent.includes("Linux") ? "Linux"
    : "Unknown OS";
  return `${browser} on ${os}`;
};

const mapAuthError = (message: string | null | undefined): string => {
  if (!message) {
    return "Something went wrong. Try again.";
  }
  const normalized = message.toLowerCase();
  if (
    normalized.includes("invalid password") ||
    normalized.includes("incorrect password") ||
    normalized.includes("wrong password")
  ) {
    return "That is not your current password. Try again.";
  }
  return message;
};

type ProfileSecurityProps = {
  forceReset?: boolean;
};

const ProfileSecurity = ({ forceReset = false }: ProfileSecurityProps) => {
  const router = useRouter();
  const {
    handleSubmit,
    control,
    formState: { isSubmitting, isValid },
    reset,
  } = useForm({
    resolver: zodResolver(profilePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "all",
  });

  const [sessions, setSessions] = useState<AuthSession[] | null>(null);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [revokingToken, setRevokingToken] = useState<string | null>(null);
  const [isRevokingOthers, setIsRevokingOthers] = useState(false);

  const loadSessions = useCallback(async () => {
    const [listed, current] = await Promise.all([
      authClient.listSessions(),
      authClient.getSession(),
    ]);
    setSessions(listed.data ?? []);
    setCurrentToken(current.data?.session?.token ?? null);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadSessions();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadSessions]);

  const changePasswordHandler = async (values: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    const { error } = await authClient.changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
      revokeOtherSessions: true,
    });
    if (error) {
      toast.error(mapAuthError(error.message));
      return;
    }
    await completePasswordRotation();
    toast.success("Password updated and other sessions signed out");
    reset();
    await loadSessions();
    if (forceReset) {
      router.replace("/browse");
    } else {
      router.refresh();
    }
  };

  const revokeOne = async (session: AuthSession) => {
    setRevokingToken(session.token);
    const { error } = await authClient.revokeSession({
      token: session.token,
    });
    if (error) {
      toast.error(mapAuthError(error.message));
    } else {
      toast.success("Signed out of that session");
      await loadSessions();
    }
    setRevokingToken(null);
  };

  const revokeOthers = async () => {
    setIsRevokingOthers(true);
    const { error } = await authClient.revokeOtherSessions();
    if (error) {
      toast.error(mapAuthError(error.message));
    } else {
      toast.success("Signed out everywhere else");
      await loadSessions();
    }
    setIsRevokingOthers(false);
  };

  return (
    <div className="grid gap-6">
      {forceReset ?
        <Alert variant="destructive">
          <ShieldAlertIcon aria-hidden="true" />
          <AlertTitle>Temporary password rotation required</AlertTitle>
          <AlertDescription>
            An administrator issued a temporary password for your account. Enter
            your temporary password below and set a new private password to
            unlock the gallery.
          </AlertDescription>
        </Alert>
      : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Change password</CardTitle>
            <CardDescription>
              Confirm your current password and choose a new one. All other
              signed-in devices will be signed out automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit(changePasswordHandler)}
              className="grid gap-4"
              noValidate>
              <FieldGroup>
                <Controller
                  name="currentPassword"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>
                        Current password
                      </FieldLabel>
                      <PasswordInput
                        {...field}
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        autoComplete="current-password"
                        placeholder="Enter your current password"
                      />
                      {fieldState.invalid ?
                        <FieldError errors={[fieldState.error]} />
                      : null}
                    </Field>
                  )}
                />

                <Controller
                  name="newPassword"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>New password</FieldLabel>
                      <PasswordInput
                        {...field}
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
                      />
                      {fieldState.invalid ?
                        <FieldError errors={[fieldState.error]} />
                      : null}
                    </Field>
                  )}
                />

                <Controller
                  name="confirmPassword"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>
                        Confirm password
                      </FieldLabel>
                      <PasswordInput
                        {...field}
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        autoComplete="new-password"
                        placeholder="Repeat the new password"
                      />
                      {fieldState.invalid ?
                        <FieldError errors={[fieldState.error]} />
                      : null}
                    </Field>
                  )}
                />
              </FieldGroup>

              <div>
                <Button
                  type="submit"
                  disabled={isSubmitting || !isValid}>
                  {isSubmitting ?
                    <>
                      <Loader2Icon
                        data-icon="inline-start"
                        className="animate-spin"
                      />
                      <span>Updating</span>
                    </>
                  : <>
                      <KeyRoundIcon data-icon="inline-start" />
                      <span>Update password</span>
                    </>
                  }
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Active sessions</CardTitle>
            <CardDescription>
              Devices and browsers signed in to your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-3">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isRevokingOthers || (sessions ?? []).length <= 1}
                onClick={() => void revokeOthers()}>
                {isRevokingOthers ?
                  <>
                    <Loader2Icon className="animate-spin" />
                    <span>Signing out</span>
                  </>
                : <>
                    <UsersIcon
                      data-icon="inline-start"
                      className="size-4"
                    />
                    <span>Sign out all others</span>
                  </>
                }
              </Button>
            </div>
            {sessions === null ?
              <p className="text-muted-foreground text-sm">Loading sessions.</p>
            : <ul className="grid gap-2">
                {sessions.map((entry) => {
                  const isCurrent =
                    currentToken !== null && entry.token === currentToken;
                  const isBusy = revokingToken === entry.token;
                  return (
                    <li
                      key={entry.token}
                      className="border-border/60 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2.5">
                      <div className="grid min-w-0 gap-0.5">
                        <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                          {deviceLabel(entry.userAgent)}
                          {isCurrent ?
                            <Badge variant="secondary">This device</Badge>
                          : null}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {entry.ipAddress ?? "Unknown location"}
                          {" · Signed in "}
                          {format(new Date(entry.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="xs"
                        disabled={isBusy}
                        onClick={() => void revokeOne(entry)}>
                        {isBusy ?
                          <Loader2Icon className="size-3 animate-spin" />
                        : <XIcon
                            data-icon="inline-start"
                            className="size-3"
                          />
                        }
                        <span>Sign out</span>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            }
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSecurity;
