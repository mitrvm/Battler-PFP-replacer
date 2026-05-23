const BUNDLED_IMAGE_PATHS = __AVATAR_IMAGE_PATHS__;

export function getBundledAvatarUrls(): string[] {
  return BUNDLED_IMAGE_PATHS.map((path) => chrome.runtime.getURL(path));
}

export function getBundledAvatarCount(): number {
  return BUNDLED_IMAGE_PATHS.length;
}
