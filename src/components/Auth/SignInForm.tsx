"use client";

import { Button } from "@/components/shadcnui/button";
import { Checkbox } from "@/components/shadcnui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import { Label } from "@/components/shadcnui/label";
import { authClient } from "@/lib/auth-client";
import { signInSchema, type SignInType } from "@/lib/zodSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, LockIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";

const SignInForm = () => {
  const { replace } = useRouter();

  const {
    handleSubmit,
    control,
    formState: { isSubmitting, isValid },
    reset,
  } = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    mode: "all",
  });

  const signInHandler = async ({ email, password, rememberMe }: SignInType) => {
    const { error } = await authClient.signIn.email({
      email,
      password,
      rememberMe,
    });

    if (error) {
      toast.error(error.message ?? "Something went wrong");
      return;
    }

    toast.success("Welcome back!");
    reset();
    replace("/browse");
  };

  return (
    <form
      onSubmit={handleSubmit(signInHandler)}
      className="grid gap-6"
      noValidate>
      {/* Email field */}
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
              placeholder="Enter your email"
              autoComplete="email"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Password field */}
      <Controller
        name="password"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Password</FieldLabel>
            <Input
              {...field}
              id={field.name}
              type="password"
              aria-invalid={fieldState.invalid}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Remember me + Forgot password */}
      <div className="flex items-center justify-between">
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
        <Link
          href={"/forgot-password" as Route}
          className="text-sm underline-offset-4 hover:underline">
          Forgot password?
        </Link>
      </div>

      {/* Submit button */}
      <Button
        className="w-full"
        type="submit"
        disabled={isSubmitting || !isValid}>
        {isSubmitting ?
          <>
            <Loader2Icon className="animate-spin" /> Signing in...
          </>
        : <>
            <LockIcon /> Sign In
          </>
        }
      </Button>
    </form>
  );
};

export default SignInForm;
