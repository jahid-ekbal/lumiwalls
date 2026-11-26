"use client";

import { Button } from "@/components/shadcnui/button";
import { MoonStarIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

const ThemeToggleButton = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const isDark = mounted ? resolvedTheme !== "light" : true;
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      aria-pressed={isDark}
      title={label}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative">
      {!mounted ?
        <MoonStarIcon aria-hidden="true" />
      : isDark ?
        <SunIcon aria-hidden="true" />
      : <MoonStarIcon aria-hidden="true" />}
    </Button>
  );
};

export default ThemeToggleButton;
