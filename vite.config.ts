import fs from "node:fs";
import path from "node:path";
import { crx } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import manifest from "./manifest.config";
import { IMAGE_SET_OPTIONS } from "./src/shared/image-sets";

const imageDirectory = path.resolve(__dirname, "public/images");
const supportedExtensions = new Set([
  ".avif",
  ".gif",
  ".jfif",
  ".jpeg",
  ".jpg",
  ".png",
  ".webp",
]);

const bundledImageCatalog = IMAGE_SET_OPTIONS.flatMap((option) => {
  const folderPath = path.join(imageDirectory, option.folder);

  if (!fs.existsSync(folderPath)) return [];

  return fs
    .readdirSync(folderPath)
    .filter((fileName) =>
      supportedExtensions.has(path.extname(fileName).toLowerCase()),
    )
    .sort()
    .map((fileName) => ({
      category: option.id,
      path: `images/${option.folder}/${fileName}`,
    }));
});

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  define: {
    __AVATAR_IMAGE_CATALOG__: JSON.stringify(bundledImageCatalog),
  },
});
