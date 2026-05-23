import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "Battler Avatar Replacer",
  description:
    "Replaces Twitter/X avatars with images of Ushiromiya Battler from the Umineko series.",
  version: "1.0.0",
  icons: {
    16: "icons/battler_tiny_tiny.png",
    32: "icons/battler_tiny_tiny.png",
    48: "icons/battler_tiny_tiny.png",
    128: "icons/battler_tiny_tiny.png",
  },
  action: {
    default_popup: "index.html",
    default_title: "Battler Avatar Replacer",
    default_icon: {
      16: "icons/battler_tiny_tiny.png",
      32: "icons/battler_tiny_tiny.png",
    },
  },
  permissions: ["storage"],
  content_scripts: [
    {
      matches: ["https://x.com/*", "https://twitter.com/*"],
      js: ["src/content/index.ts"],
      run_at: "document_idle",
    },
  ],
  web_accessible_resources: [
    {
      resources: ["images/*"],
      matches: ["https://x.com/*", "https://twitter.com/*"],
    },
  ],
});
