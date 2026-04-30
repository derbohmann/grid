import path from "node:path";

export const dataRoot =
  process.env.DATA_DIR ??
  (process.env.NODE_ENV === "production"
    ? "/data"
    : path.join(/* turbopackIgnore: true */ process.cwd(), "data"));
export const uploadRoot = path.join(dataRoot, "uploads");
export const iconUploadRoot = path.join(uploadRoot, "icons");
export const backgroundUploadRoot = path.join(uploadRoot, "backgrounds");

export function publicUploadPath(kind: "icons" | "backgrounds", filename: string) {
  return `/api/assets/${kind}/${filename}`;
}
