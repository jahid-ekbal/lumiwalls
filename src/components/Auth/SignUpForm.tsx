"use client";

import PasswordInput from "@/components/Auth/PasswordInput";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/shadcnui/alert";
import { Button } from "@/components/shadcnui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import { authClient } from "@/lib/auth-client";
import { signUpSchema, type SignUpType } from "@/lib/zodSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircleIcon, Loader2Icon, UserPlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";

const SignUpForm = () => {
  const { replace } = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  });

  const signUpHandler = async ({ name, email, password }: SignUpType) => {
    setFormError(null);
    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
    });

    if (error) {
      const message = error.message ?? "Could not create account. Try again.";
      setFormError(message);
      toast.error(message);
      return;
    }

    toast.success("Account created successfully!");
    reset();
    replace("/browse");
  };

  return (
    <form
      onSubmit={handleSubmit(signUpHandler)}
      className="grid gap-5"
      noValidate>
      <div
        aria-live="polite"
        aria-atomic="true">
        {formError ?
          <Alert variant="destructive">
            <AlertCircleIcon aria-hidden="true" />
            <AlertTitle>Registration failed</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        : null}
      </div>

      <FieldGroup>
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Name</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="text"
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
                placeholder="Create a password (8+ characters)"
                autoComplete="new-password"
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
              <FieldLabel htmlFor={field.name}>Confirm password</FieldLabel>
              <PasswordInput
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder="Re-enter your password"
                autoComplete="new-password"
              />
              {fieldState.invalid ?
                <FieldError errors={[fieldState.error]} />
              : null}
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
            Creating account...
          </>
        : <>
            <UserPlusIcon data-icon="inline-start" />
            Sign Up
          </>
        }
      </Button>
    </form>
  );
};

export default SignUpForm;
