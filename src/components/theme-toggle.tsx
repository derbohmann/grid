"use client";

import { cn } from "@/lib/utils";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";

type ThemeOption = "light" | "dark" | "system";

const options: { value: ThemeOption; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light theme", icon: Sun },
  { value: "dark", label: "Dark theme", icon: Moon },
  { value: "system", label: "System theme", icon: Laptop }
];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
    }, 0);
  }, []);

  const activeTheme = useMemo<ThemeOption>(() => {
    if (!mounted) {
      return "system";
    }

    if (theme === "light" || theme === "dark" || theme === "system") {
      return theme;
    }

    return "system";
  }, [mounted, theme]);

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full bg-slate-900/10 p-1 text-slate-900 backdrop-blur dark:bg-white/10 dark:text-white",
        className
      )}
      role="group"
      aria-label="Theme"
    >
      {options.map((option) => {
        const Icon = option.icon;
        const selected = activeTheme === option.value;

        return (
          <button
            key={option.value}
            type="button"
            className={cn(
              "cursor-pointer rounded-full p-2 transition",
              selected
                ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900"
                : "text-inherit hover:bg-slate-900/20 dark:hover:bg-white/20"
            )}
            onClick={() => setTheme(option.value)}
            aria-label={option.label}
            aria-pressed={selected}
            title={option.label}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
