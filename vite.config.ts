import fs from "node:fs";
import path from "node:path";
import { crx } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import manifest from "./manifest.config";

const imageDirectory = path.resolve(__dirname, "public/images");
const supportedExtensions = new Set([".avif", ".gif", ".jfif", ".jpeg", ".jpg", ".png", ".webp"]);
const bundledImagePaths = fs
  .readdirSync(imageDirectory)
  .filter((fileName) => supportedExtensions.has(path.extname(fileName).toLowerCase()))
  .sort()
  .map((fileName) => `images/${fileName}`);

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  define: {
    __AVATAR_IMAGE_PATHS__: JSON.stringify(bundledImagePaths),
  },
});
