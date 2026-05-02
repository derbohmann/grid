import { AdminAddCategoryForm } from "@/components/admin-add-category-form";
import { AdminAppearancePanel } from "@/components/admin-appearance-panel";
import { AdminCategoryManager } from "@/components/admin-category-manager";
import { AdminIconLibraryPanel } from "@/components/admin-icon-library-panel";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
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
            <LogoutButton />
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <AdminAppearancePanel settings={settings} />

          <AdminIconLibraryPanel icons={icons} />
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
          <h2 className="text-xl font-black">Add category</h2>
          <AdminAddCategoryForm icons={icons} sortOrder={categories.length} />
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
