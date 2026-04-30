export type IconAssetLike = { name: string; source: string; path: string };

export function iconValue(asset: IconAssetLike) {
  if (asset.source === "bundled") {
    const name = asset.path.split("/").pop()?.replace(".svg", "");
    return `bundled:${name}`;
  }

  return `uploaded:${asset.path}`;
}
