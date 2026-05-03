import { IconView } from "@/components/icon-view";
import { ServiceCard } from "@/components/service-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { Settings } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [settings, categories] = await Promise.all([
    getSettings(),
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
          include: {
            healthResults: {
              orderBy: { checkedAt: "desc" },
              take: 1
            }
          }
        }
      }
    })
  ]);

  const background =
    settings.backgroundImagePath ??
    "linear-gradient(135deg, #1e1b4b 0%, #581c87 45%, #0f172a 100%)";

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: background.startsWith("/") ? `url(${background})` : background
      }}
    >
      <div
        className="min-h-screen px-6 py-8 backdrop-blur-[1px] md:px-12"
        style={{ backgroundColor: `rgb(var(--dashboard-overlay-rgb) / ${settings.backgroundOverlay})` }}
      >
        <header className="mx-auto mb-10 flex max-w-7xl items-center justify-between text-slate-900 dark:text-white">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.35em] text-violet-700 dark:text-violet-200">
              Grid
            </p>
            <h1 className="mt-2 text-3xl font-black">{settings.dashboardTitle}</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/admin"
              className="rounded-full bg-slate-900/10 p-3 text-slate-900 backdrop-blur transition hover:bg-slate-900/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
              aria-label="Open admin settings"
            >
              <Settings className="h-5 w-5" />
            </Link>
          </div>
        </header>

        <section className="mx-auto grid max-w-7xl gap-6 md:gap-y-8 lg:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <div key={category.id} className="space-y-4">
              <div className="flex items-center gap-3 px-1 text-slate-900 dark:text-white">
                <IconView icon={category.icon} alt="" className="h-8 w-8 bg-transparent" />
                <h2 className="text-xl font-black">{category.name}</h2>
              </div>

              <div className="grid gap-2">
                {category.items.map((item) => {
                  const healthMonitoringEnabled = Boolean(item.healthCheckUrl?.trim());
                  return (
                    <ServiceCard
                      key={item.id}
                      id={item.id}
                      title={item.title}
                      description={item.description}
                      icon={item.icon}
                      url={item.url}
                      healthMonitoringEnabled={healthMonitoringEnabled}
                      status={healthMonitoringEnabled ? item.healthResults[0]?.status : null}
                      openInNewTab={item.openInNewTab}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
