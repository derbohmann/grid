"use client";

import { IconView } from "@/components/icon-view";
import { iconValue, type IconAssetLike } from "@/lib/icon-value";
import { LUCIDE_ICON_OPTIONS, lucideIconStoredValue } from "@/lib/lucide-icons";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";

type IconPickerProps = {
  name: string;
  value?: string | null;
  icons: IconAssetLike[];
  label?: string;
};

export function IconPicker({ name, value, icons, label = "Icon" }: IconPickerProps) {
  const [selected, setSelected] = useState(() => value ?? "");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const q = query.trim().toLowerCase();

  const filteredLucide = useMemo(() => {
    if (!q) {
      return LUCIDE_ICON_OPTIONS;
    }
    return LUCIDE_ICON_OPTIONS.filter((opt) => opt.name.toLowerCase().includes(q));
  }, [q]);

  const filteredAssets = useMemo(() => {
    if (!q) {
      return icons;
    }
    return icons.filter((icon) => {
      const v = iconValue(icon);
      return (
        icon.name.toLowerCase().includes(q) ||
        icon.source.toLowerCase().includes(q) ||
        v.toLowerCase().includes(q)
      );
    });
  }, [icons, q]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const selectedLabel = useMemo(() => {
    if (!selected) {
      return "";
    }

    const lucide = LUCIDE_ICON_OPTIONS.find((option) => lucideIconStoredValue(option.name) === selected);
    if (lucide) {
      return `lucide:${lucide.name}`;
    }

    const uploaded = icons.find((icon) => iconValue(icon) === selected);
    if (uploaded) {
      return `${uploaded.source}:${uploaded.name}`;
    }

    return selected;
  }, [icons, selected]);

  const displayValue = open ? query : selectedLabel;

  return (
    <div className="floating-field relative" data-filled={displayValue.length > 0 ? "true" : undefined} ref={rootRef}>
      <input
        className="field"
        type="search"
        aria-label={label}
        placeholder="Search icons…"
        value={displayValue}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          setQuery("");
          setOpen(true);
        }}
        onClick={() => {
          setQuery("");
          setOpen(true);
        }}
        autoComplete="off"
      />
      <span className="floating-field-label">{label}</span>
      <input type="hidden" name={name} value={selected} />
      {open ? (
        <div className="absolute top-full z-30 mt-2 max-h-56 w-full overflow-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-600 dark:bg-slate-900">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-xs font-bold transition",
                selected === ""
                  ? "border-violet-500 bg-violet-500 text-white"
                  : "border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
              )}
              onClick={() => {
                setSelected("");
                setQuery("");
                setOpen(false);
              }}
              title="No icon"
            >
              ∅
            </button>
            {filteredLucide.map(({ name: lucideName, Icon }) => {
              const stored = lucideIconStoredValue(lucideName);
              const active = selected === stored;
              return (
                <button
                  key={lucideName}
                  type="button"
                  title={lucideName}
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition",
                    active
                      ? "border-violet-500 bg-violet-500 text-white"
                      : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800"
                  )}
                  onClick={() => {
                    setSelected(stored);
                    setQuery(lucideName);
                    setOpen(false);
                  }}
                >
                  <Icon className="h-5 w-5" />
                </button>
              );
            })}
            {filteredAssets.map((asset) => {
              const v = iconValue(asset);
              const active = selected === v;
              return (
                <button
                  key={asset.source + asset.path}
                  type="button"
                  title={`${asset.source}: ${asset.name}`}
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border transition",
                    active
                      ? "border-violet-500 ring-2 ring-violet-500"
                      : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800"
                  )}
                  onClick={() => {
                    setSelected(v);
                    setQuery(asset.name);
                    setOpen(false);
                  }}
                >
                  <IconView icon={v} alt="" className="h-9 w-9" />
                </button>
              );
            })}
          </div>
          {filteredLucide.length === 0 && filteredAssets.length === 0 ? (
            <p className="p-3 text-sm text-slate-500">No icons match your search.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
