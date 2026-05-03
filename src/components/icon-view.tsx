"use client";

import { isLucideIconValue, resolveIconPath } from "@/lib/icon-paths";
import { LUCIDE_ICON_REGISTRY, parseLucideStoredValue } from "@/lib/lucide-icons";
import { cn } from "@/lib/utils";
import { Boxes } from "lucide-react";

export function IconView({
  icon,
  alt,
  className
}: {
  icon?: string | null;
  alt: string;
  className?: string;
}) {
  const lucideName = isLucideIconValue(icon) ? parseLucideStoredValue(icon) : null;
  const LucideCmp = lucideName ? LUCIDE_ICON_REGISTRY[lucideName] : null;

  if (LucideCmp) {
    return (
      <span className={cn("grid place-items-center text-slate-700 dark:text-slate-200 rounded-xl dark:bg-white/15 bg-slate-900/10", className)}>
        <LucideCmp className="h-[55%] w-[55%]" aria-hidden />
        {alt ? <span className="sr-only">{alt}</span> : null}
      </span>
    );
  }

  const path = resolveIconPath(icon);

  if (!path) {
    return (
      <span className={cn("grid place-items-center rounded-xl dark:bg-white/15 bg-slate-900/10", className)}>
        <Boxes className="h-5 w-5" />
      </span>
    );
  }

  return (
    <span className={cn("relative block overflow-hidden ", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={path} alt={alt} className="h-full w-full object-contain" />
    </span>
  );
}
