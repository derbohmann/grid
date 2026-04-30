import { prisma } from "@/lib/db";

export async function getSettings() {
  return prisma.appSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      dashboardTitle: "Grid",
      themeDefault: "system",
      backgroundOverlay: 0.45
    }
  });
}
