import { deleteIconAction, uploadIconAction } from "@/app/actions";
import { FloatingField } from "@/components/floating-field";
import { IconView } from "@/components/icon-view";
import { iconValue } from "@/lib/icon-value";
import type { IconAsset } from "@prisma/client";

type Props = {
  icons: IconAsset[];
};

export function AdminIconLibraryPanel({ icons }: Props) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
      <h2 className="text-xl font-black">Icon library</h2>
      <form action={uploadIconAction} className="mt-4 grid gap-3">
        <FloatingField label="Icon name">
          <input className="field" name="name" placeholder="Icon name" />
        </FloatingField>
        <FloatingField label="Icon file">
          <input className="field" name="icon" type="file" accept="image/svg+xml,image/png,image/jpeg,image/webp" />
        </FloatingField>
        <button className="btn w-fit" type="submit">
          Upload icon
        </button>
      </form>
      <div className="mt-6 grid max-h-72 gap-2 overflow-auto">
        {icons.map((icon) => (
          <div
            key={icon.id}
            className="flex items-center justify-between gap-3 rounded-2xl bg-slate-100 p-3 dark:bg-slate-800"
          >
            <div className="flex items-center gap-3">
              <IconView icon={iconValue(icon)} alt="" className="h-9 w-9" />
              <span>
                <span className="block text-sm font-bold">{icon.name}</span>
                <span className="text-xs text-slate-500">{icon.source}</span>
              </span>
            </div>
            {icon.source === "uploaded" ? (
              <form action={deleteIconAction}>
                <input type="hidden" name="id" value={icon.id} />
                <button className="text-sm font-bold text-red-600" type="submit">
                  Delete
                </button>
              </form>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
