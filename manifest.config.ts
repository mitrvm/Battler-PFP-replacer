import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "Battler Avatar Replacer",
  description:
    "Replaces Twitter/X avatars with images of Ushiromiya Battler from the Umineko series.",
  version: "1.0.0",
  action: {
    default_popup: "index.html",
    default_title: "Battler Avatar Replacer",
  },
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
