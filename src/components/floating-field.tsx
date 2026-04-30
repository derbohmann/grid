"use client";

import { cn } from "@/lib/utils";
import { type ReactNode, useEffect, useRef, useState } from "react";

type FloatingFieldProps = {
  label: string;
  children: ReactNode;
  className?: string;
  defaultFilled?: boolean;
};

function fieldHasValue(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) {
  if (field instanceof HTMLInputElement && field.type === "file") {
    return Boolean(field.files?.length);
  }

  return field.value.length > 0;
}

export function FloatingField({ label, children, className, defaultFilled = false }: FloatingFieldProps) {
  const rootRef = useRef<HTMLLabelElement>(null);
  const [filled, setFilled] = useState(defaultFilled);

  function syncFilledState() {
    const field = rootRef.current?.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      "input:not([type='hidden']), select, textarea"
    );

    if (field) {
      setFilled(fieldHasValue(field));
    }
  }

  useEffect(syncFilledState, []);

  return (
    <label
      ref={rootRef}
      className={cn("floating-field", className)}
      data-filled={filled ? "true" : undefined}
      onChange={syncFilledState}
      onInput={syncFilledState}
    >
      {children}
      <span className="floating-field-label">{label}</span>
    </label>
  );
}
