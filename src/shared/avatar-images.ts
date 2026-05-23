import { type ImageSelection } from "./image-sets";

const BUNDLED_IMAGE_CATALOG = __AVATAR_IMAGE_CATALOG__;

export function getBundledAvatarUrls(selection: ImageSelection): string[] {
  return BUNDLED_IMAGE_CATALOG.filter((entry) => selection[entry.category]).map(
    (entry) => chrome.runtime.getURL(entry.path),
  );
}
