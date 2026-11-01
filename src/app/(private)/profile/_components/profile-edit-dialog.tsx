"use client";

import { Button } from "@/components/shadcnui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcnui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/shadcnui/field";
import { Input } from "@/components/shadcnui/input";
import { Textarea } from "@/components/shadcnui/textarea";
import { profileUpdateSchema, type ProfileUpdateType } from "@/lib/zodSchema";
import { updateProfile } from "@/server/actions/profile";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, Loader2Icon, SquarePenIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";

type ProfileEditDialogProps = {
  name: string;
  bio: string;
  location: string;
};

const ProfileEditDialog = ({ name, bio, location }: ProfileEditDialogProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: { name, bio, location },
    mode: "all",
  });

  useEffect(() => {
    if (open) {
      reset({ name, bio, location });
    }
  }, [open, name, bio, location, reset]);

  const submitHandler = async (values: ProfileUpdateType) => {
    const result = await updateProfile(values);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Profile updated");
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => setOpen(next)}>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}>
        <SquarePenIcon
          data-icon="inline-start"
          className="size-4"
        />
        <span>Edit profile</span>
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Update your display name, bio, and location.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(submitHandler)}
          className="grid gap-4"
          noValidate>
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder="Your display name"
                  autoComplete="name"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
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
                  placeholder="A few words about you"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
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
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <DialogFooter>
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="outline"
                />
              }>
              <XIcon
                data-icon="inline-start"
                className="size-4"
              />
              <span>Cancel</span>
            </DialogClose>
            <Button
              type="submit"
              disabled={isSubmitting}>
              {isSubmitting ?
                <>
                  <Loader2Icon className="animate-spin" />
                  <span>Saving</span>
                </>
              : <>
                  <CheckIcon
                    data-icon="inline-start"
                    className="size-4"
                  />
                  <span>Save changes</span>
                </>
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditDialog;
