"use client";

import PasswordInput from "@/components/Auth/PasswordInput";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shadcnui/alert-dialog";
import { Button, buttonVariants } from "@/components/shadcnui/button";
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
import { Input } from "@/components/shadcnui/input";
import { Textarea } from "@/components/shadcnui/textarea";
import { authClient } from "@/lib/auth-client";
import {
  deleteOwnAccountSchema,
  profileHandleSchema,
  profileUpdateSchema,
  type DeleteOwnAccountType,
  type ProfileHandleType,
  type ProfileUpdateType,
} from "@/lib/zodSchema";
import {
  deleteOwnAccount,
  updateProfile,
  updateProfileHandle,
} from "@/server/actions/profile";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRightIcon,
  AtSignIcon,
  CheckIcon,
  Loader2Icon,
  MoonStarIcon,
  ShieldIcon,
  SunIcon,
  Trash2Icon,
} from "lucide-react";
import type { Route } from "next";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";

const emptySubscribe = () => () => {};

type SettingsClientProps = {
  initialName: string;
  initialBio: string;
  initialLocation: string;
  initialHandle: string;
  email: string;
  isProtectedAdmin: boolean;
};

const SettingsClient = ({
  initialName,
  initialBio,
  initialLocation,
  initialHandle,
  email,
  isProtectedAdmin,
}: SettingsClientProps) => {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const currentTheme = mounted ? (resolvedTheme ?? "dark") : "dark";

  const {
    handleSubmit,
    control,
    formState: { isSubmitting, isDirty },
  } = useForm<ProfileUpdateType>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: initialName,
      bio: initialBio,
      location: initialLocation,
    },
    mode: "onTouched",
  });

  const handleForm = useForm<ProfileHandleType>({
    resolver: zodResolver(profileHandleSchema),
    defaultValues: { handle: initialHandle },
    mode: "onTouched",
  });

  const deleteForm = useForm<DeleteOwnAccountType>({
    resolver: zodResolver(deleteOwnAccountSchema),
    defaultValues: { password: "", confirmation: "" },
    mode: "onTouched",
  });

  const submitHandler = async (values: ProfileUpdateType) => {
    const result = await updateProfile(values);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Settings saved");
    router.refresh();
  };

  const submitHandleHandler = async (values: ProfileHandleType) => {
    const result = await updateProfileHandle(values);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(`Handle updated to @${result.handle}`);
    handleForm.reset({ handle: result.handle });
    router.refresh();
  };

  const submitDeleteHandler = async (values: DeleteOwnAccountType) => {
    const result = await deleteOwnAccount(values);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    await authClient.signOut();
    window.location.href = "/";
  };

  return (
    <div className="grid w-full gap-6 lg:grid-cols-2">
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Profile details</CardTitle>
          <CardDescription>
            Update how your name, bio, and location appear on your profile (
            {email}).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(submitHandler)}
            className="grid gap-5"
            noValidate>
            <FieldGroup>
              <Controller
                name="name"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Display name</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder="Your display name"
                      autoComplete="name"
                    />
                    {fieldState.invalid ?
                      <FieldError errors={[fieldState.error]} />
                    : null}
                  </Field>
                )}
              />

              <Controller
                name="bio"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Bio</FieldLabel>
                    <Textarea
                      {...field}
                      id={field.name}
                      rows={4}
                      aria-invalid={fieldState.invalid}
                      placeholder="A short note about what you shoot or curate"
                    />
                    {fieldState.invalid ?
                      <FieldError errors={[fieldState.error]} />
                    : null}
                  </Field>
                )}
              />

              <Controller
                name="location"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Location</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder="City, country"
                      autoComplete="off"
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
                disabled={isSubmitting || !isDirty}>
                {isSubmitting ?
                  <>
                    <Loader2Icon
                      data-icon="inline-start"
                      className="animate-spin"
                    />
                    Saving...
                  </>
                : <>
                    <CheckIcon data-icon="inline-start" />
                    Save profile
                  </>
                }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid content-start gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AtSignIcon
                aria-hidden="true"
                className="size-4"
              />
              Creator handle
            </CardTitle>
            <CardDescription>
              Customize the URL slug for your profile at{" "}
              <code className="text-xs">/u/{initialHandle || "handle"}</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleForm.handleSubmit(submitHandleHandler)}
              className="grid gap-4"
              noValidate>
              <Controller
                name="handle"
                control={handleForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="creator-handle">Handle</FieldLabel>
                    <Input
                      {...field}
                      id="creator-handle"
                      aria-invalid={fieldState.invalid}
                      placeholder="e.g. aurora-shots"
                      spellCheck={false}
                      autoComplete="off"
                    />
                    {fieldState.invalid ?
                      <FieldError errors={[fieldState.error]} />
                    : null}
                  </Field>
                )}
              />
              <div>
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={
                    handleForm.formState.isSubmitting ||
                    !handleForm.formState.isDirty
                  }>
                  {handleForm.formState.isSubmitting ?
                    <>
                      <Loader2Icon
                        data-icon="inline-start"
                        className="animate-spin"
                      />
                      Updating...
                    </>
                  : <>
                      <CheckIcon data-icon="inline-start" />
                      Update handle
                    </>
                  }
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Choose the surface theme used across the gallery and studio tools.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              role="group"
              aria-label="Color theme"
              className="grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant={currentTheme === "dark" ? "default" : "outline"}
                aria-pressed={currentTheme === "dark"}
                onClick={() => setTheme("dark")}
                className="h-auto justify-start gap-3 px-4 py-3 text-left">
                <MoonStarIcon data-icon="inline-start" />
                <span className="grid gap-0.5">
                  <span className="font-medium">Cinematic dark</span>
                  <span className="text-xs opacity-75">
                    Near-black canvas built for photography
                  </span>
                </span>
              </Button>
              <Button
                type="button"
                variant={currentTheme === "light" ? "default" : "outline"}
                aria-pressed={currentTheme === "light"}
                onClick={() => setTheme("light")}
                className="h-auto justify-start gap-3 px-4 py-3 text-left">
                <SunIcon data-icon="inline-start" />
                <span className="grid gap-0.5">
                  <span className="font-medium">Gallery light</span>
                  <span className="text-xs opacity-75">
                    Bright achromatic surface for daylight viewing
                  </span>
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid gap-1">
              <CardTitle className="flex items-center gap-2">
                <ShieldIcon
                  aria-hidden="true"
                  className="size-4"
                />
                Password and active sessions
              </CardTitle>
              <CardDescription>
                Update your password or sign out devices from Profile security.
              </CardDescription>
            </div>
            <Link
              href={"/profile?tab=security" as Route}
              className={buttonVariants({ variant: "outline", size: "sm" })}>
              Open security
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </CardHeader>
        </Card>

        <Card className="border-destructive/40">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid gap-1">
              <CardTitle className="text-destructive">Delete account</CardTitle>
              <CardDescription>
                {isProtectedAdmin ?
                  "The primary seeded administrator account cannot be self-deleted."
                : "Permanently delete your account, uploads, boards, and saved data."}
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isProtectedAdmin}
              onClick={() => setDeleteOpen(true)}>
              <Trash2Icon data-icon="inline-start" />
              Delete account
            </Button>
          </CardHeader>
        </Card>
      </div>

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(next) => {
          if (!deleteForm.formState.isSubmitting) {
            setDeleteOpen(next);
            if (!next) deleteForm.reset();
          }
        }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account permanently</AlertDialogTitle>
            <AlertDialogDescription>
              All uploaded wallpapers, personal boards, and active sessions will
              be removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form
            onSubmit={deleteForm.handleSubmit(submitDeleteHandler)}
            className="grid gap-4"
            noValidate>
            <Controller
              name="password"
              control={deleteForm.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="delete-account-password">
                    Confirm password
                  </FieldLabel>
                  <PasswordInput
                    {...field}
                    id="delete-account-password"
                    aria-invalid={fieldState.invalid}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                  />
                  {fieldState.invalid ?
                    <FieldError errors={[fieldState.error]} />
                  : null}
                </Field>
              )}
            />
            <Controller
              name="confirmation"
              control={deleteForm.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="delete-account-confirm">
                    Type DELETE to confirm
                  </FieldLabel>
                  <Input
                    {...field}
                    id="delete-account-confirm"
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                    placeholder="DELETE"
                  />
                  {fieldState.invalid ?
                    <FieldError errors={[fieldState.error]} />
                  : null}
                </Field>
              )}
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button
                type="submit"
                variant="destructive"
                disabled={deleteForm.formState.isSubmitting}>
                {deleteForm.formState.isSubmitting ?
                  <>
                    <Loader2Icon
                      data-icon="inline-start"
                      className="animate-spin"
                    />
                    Deleting...
                  </>
                : <>
                    <Trash2Icon data-icon="inline-start" />
                    Delete permanently
                  </>
                }
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SettingsClient;
