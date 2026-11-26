"use client";

import PasswordInput from "@/components/Auth/PasswordInput";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/shadcnui/alert";
import { Button } from "@/components/shadcnui/button";
import { Checkbox } from "@/components/shadcnui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import { Label } from "@/components/shadcnui/label";
import { authClient } from "@/lib/auth-client";
import { signInSchema, type SignInType } from "@/lib/zodSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircleIcon, Loader2Icon, LockIcon } from "lucide-react";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";

const isSafeCallbackUrl = (value: string | null): value is Route => {
  if (!value) return false;
  if (!value.startsWith("/") || value.startsWith("//")) return false;
  if (value.startsWith("/api")) return false;
  return true;
};

const SignInForm = () => {
  const { replace } = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [formError, setFormError] = useState<string | null>(null);

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    mode: "onTouched",
  });

  const signInHandler = async ({ email, password, rememberMe }: SignInType) => {
    setFormError(null);
    const { error } = await authClient.signIn.email({
      email,
      password,
      rememberMe,
    });

    if (error) {
      const message = error.message ?? "Unable to sign in. Check your credentials.";
      setFormError(message);
      toast.error(message);
      return;
    }

    toast.success("Welcome back!");
    reset();
    if (isSafeCallbackUrl(callbackUrl)) {
      replace(callbackUrl);
      return;
    }
    const { data: session } = await authClient.getSession();
    if (session?.user.role === "admin") {
      replace("/admin");
    } else {
      replace("/browse");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(signInHandler)}
      className="grid gap-5"
      noValidate>
      <div
        aria-live="polite"
        aria-atomic="true">
        {formError ?
          <Alert variant="destructive">
            <AlertCircleIcon aria-hidden="true" />
            <AlertTitle>Sign in failed</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        : null}
      </div>

      <FieldGroup>
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Email</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="email"
                aria-invalid={fieldState.invalid}
                placeholder="you@example.com"
                autoComplete="email"
              />
              {fieldState.invalid ?
                <FieldError errors={[fieldState.error]} />
              : null}
            </Field>
          )}
        />

        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Password</FieldLabel>
              <PasswordInput
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              {fieldState.invalid ?
                <FieldError errors={[fieldState.error]} />
              : null}
            </Field>
          )}
        />

        <Controller
          name="rememberMe"
          control={control}
          render={({ field }) => (
            <Field orientation="horizontal">
              <Checkbox
                id={field.name}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
              <Label
                htmlFor={field.name}
                className="text-sm font-normal">
                Remember me
              </Label>
            </Field>
          )}
        />
      </FieldGroup>

      <Button
        className="w-full"
        type="submit"
        disabled={isSubmitting}>
        {isSubmitting ?
          <>
            <Loader2Icon
              data-icon="inline-start"
              className="animate-spin"
            />
            Signing in...
          </>
        : <>
            <LockIcon data-icon="inline-start" />
            Sign In
          </>
        }
      </Button>
    </form>
  );
};

export default SignInForm;
