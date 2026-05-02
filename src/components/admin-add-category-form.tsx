"use client";

import { saveCategoryAction } from "@/app/actions";
import { FloatingField } from "@/components/floating-field";
import { IconPicker } from "@/components/icon-picker";
import type { IconAssetLike } from "@/lib/icon-value";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

type Props = {
  icons: IconAssetLike[];
  sortOrder: number;
};

export function AdminAddCategoryForm({ icons, sortOrder }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto]"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          await saveCategoryAction(fd);
          router.refresh();
        });
      }}
    >
      <FloatingField label="Category name">
        <input className="field" name="name" placeholder="Category name" required disabled={pending} />
      </FloatingField>
      <IconPicker key={`add-category-${icons.length}`} name="icon" icons={icons} />
      <input type="hidden" name="sortOrder" value={String(sortOrder)} />
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add"}
      </button>
    </form>
  );
}
