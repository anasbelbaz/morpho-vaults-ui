"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={isDark ? "switch to light mode" : "switch to dark mode"}
      onClick={toggleTheme}
      className="relative"
    >
      <Sun
        className={`size-4 transition-all ${isDark ? "scale-0 opacity-0" : "scale-100 opacity-100"}`}
      />
      <Moon
        className={`absolute size-4 transition-all ${isDark ? "scale-100 opacity-100" : "scale-0 opacity-0"}`}
      />
    </Button>
  );
}
