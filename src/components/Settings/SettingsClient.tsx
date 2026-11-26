"use client";

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
import { profileUpdateSchema, type ProfileUpdateType } from "@/lib/zodSchema";
import { updateProfile } from "@/server/actions/profile";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRightIcon,
  CheckIcon,
  Loader2Icon,
  MoonStarIcon,
  ShieldIcon,
  SunIcon,
} from "lucide-react";
import type { Route } from "next";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";

const emptySubscribe = () => () => {};

type SettingsClientProps = {
  initialName: string;
  initialBio: string;
  initialLocation: string;
  email: string;
};

const SettingsClient = ({
  initialName,
  initialBio,
  initialLocation,
  email,
}: SettingsClientProps) => {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
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

  const submitHandler = async (values: ProfileUpdateType) => {
    const result = await updateProfile(values);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Settings saved");
    router.refresh();
  };

  return (
    <div className="grid max-w-3xl gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile details</CardTitle>
          <CardDescription>
            Update how your name, bio, and location appear on your public
            profile ({email}).
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
    </div>
  );
};

export default SettingsClient;
