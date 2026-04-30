import { prisma } from "@/lib/db";

export function resolveIconPath(icon?: string | null) {
  if (!icon) {
    return null;
  }

  if (icon.startsWith("bundled:")) {
    return `/icons/bundled/${icon.replace("bundled:", "")}.svg`;
  }

  if (icon.startsWith("uploaded:")) {
    return icon.replace("uploaded:", "");
  }

  if (icon.startsWith("http://") || icon.startsWith("https://")) {
    return icon;
  }

  return icon;
}

export async function getIconAssets() {
  return prisma.iconAsset.findMany({
    orderBy: [{ source: "asc" }, { name: "asc" }]
  });
}
