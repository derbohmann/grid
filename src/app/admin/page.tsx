import {
  deleteIconAction,
  saveCategoryAction,
  saveSettingsAction,
  uploadBackgroundAction,
  uploadIconAction
} from "@/app/actions";
import { logoutAction } from "@/app/auth-actions";
import { AdminCategoryManager } from "@/components/admin-category-manager";
import { FloatingField } from "@/components/floating-field";
import { IconPicker } from "@/components/icon-picker";
import { IconView } from "@/components/icon-view";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { iconValue } from "@/lib/icon-value";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await requireAdmin();
  const [settings, categories, icons] = await Promise.all([
    prisma.appSettings.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default", firstRunComplete: true }
    }),
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
          include: {
            healthResults: {
              orderBy: { checkedAt: "desc" },
              take: 50
            }
          }
        }
      }
    }),
    prisma.iconAsset.findMany({
      orderBy: [{ source: "asc" }, { name: "asc" }]
    })
  ]);

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
          <div>
            <p className="text-sm font-semibold text-violet-600">Signed in as {admin.email}</p>
            <h1 className="mt-1 text-3xl font-black">Admin Dashboard</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ThemeToggle />
            <Link className="btn btn-secondary" href="/">
              View grid
            </Link>
            <form action={logoutAction}>
              <button className="btn" type="submit">
                Logout
              </button>
            </form>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
            <h2 className="text-xl font-black">Appearance</h2>
            <form action={saveSettingsAction} className="mt-4 grid gap-4">
              <FloatingField label="Your Grid title" defaultFilled={settings.dashboardTitle.length > 0}>
                <input
                  className="field"
                  name="dashboardTitle"
                  placeholder="Your Grid title"
                  defaultValue={settings.dashboardTitle}
                />
              </FloatingField>
              <FloatingField label="Theme" defaultFilled>
                <select className="field" name="themeDefault" defaultValue={settings.themeDefault}>
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </FloatingField>
              <FloatingField label="Background overlay" defaultFilled>
                <input
                  className="field"
                  name="backgroundOverlay"
                  type="number"
                  min="0"
                  max="0.9"
                  step="0.05"
                  placeholder="Background overlay"
                  defaultValue={settings.backgroundOverlay}
                />
              </FloatingField>
              <button className="btn w-fit" type="submit">
                Save appearance
              </button>
            </form>

            <form action={uploadBackgroundAction} className="mt-6 grid gap-3 border-t border-slate-200 pt-6 dark:border-slate-700">
              <FloatingField label="Upload background">
                <input className="field" name="background" type="file" accept="image/png,image/jpeg,image/webp" />
              </FloatingField>
              <button className="btn w-fit" type="submit">
                Upload background
              </button>
            </form>
          </div>

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
                <div key={icon.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-100 p-3 dark:bg-slate-800">
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
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
          <h2 className="text-xl font-black">Add category</h2>
          <form action={saveCategoryAction} className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <FloatingField label="Category name">
              <input className="field" name="name" placeholder="Category name" required />
            </FloatingField>
            <IconPicker key={`add-category-${icons.length}`} name="icon" icons={icons} />
            <input type="hidden" name="sortOrder" value={String(categories.length)} />
            <button className="btn" type="submit">
              Add
            </button>
          </form>
        </section>

        <AdminCategoryManager
          key={categories
            .map(
              (c) =>
                `${c.id}:${c.sortOrder}:${c.updatedAt.getTime()}-` +
                c.items
                  .map(
                    (i) =>
                      `${i.id}:${i.sortOrder}:${i.updatedAt.getTime()}:${i.categoryId}:${i.title}:${i.icon ?? ""}:${i.healthResults[0]?.checkedAt?.getTime() ?? 0}`
                  )
                  .join(".")
            )
            .join("|")}
          initialCategories={categories}
          iconAssets={icons}
        />
      </div>
    </main>
  );
}
