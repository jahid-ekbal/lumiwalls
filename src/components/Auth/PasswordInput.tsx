"use client";

import { Button } from "@/components/shadcnui/button";
import { Input } from "@/components/shadcnui/input";
import { cn } from "@/lib/utils";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState, type ComponentProps } from "react";

type PasswordInputProps = Omit<ComponentProps<typeof Input>, "type">;

const PasswordInput = ({ className, ...props }: PasswordInputProps) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={cn("pr-10", className)}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        onClick={() => setVisible((prev) => !prev)}
        className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1.5 -translate-y-1/2 rounded-full">
        {visible ?
          <EyeOffIcon aria-hidden="true" />
        : <EyeIcon aria-hidden="true" />}
      </Button>
    </div>
  );
};

export default PasswordInput;
