export const DEBUG = true;

export const AVATAR_SOURCE_SELECTOR =
  'img[src*="/profile_images/"], img[srcset*="/profile_images/"]';

export const DATA_ATTRIBUTE = {
  replaced: "data-battler-avatar-replaced",
  replacementUrl: "data-battler-avatar-url",
  originalSrc: "data-battler-avatar-original-src",
  userKey: "data-battler-avatar-user-key",
} as const;

export const EXTENSION_NAME = "Battler Avatar Replacer";
