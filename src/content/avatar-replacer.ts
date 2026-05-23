import {
  AVATAR_SOURCE_SELECTOR,
  DATA_ATTRIBUTE,
  DEBUG,
  EXTENSION_NAME,
} from "../shared/config";
import { getBundledAvatarUrls } from "../shared/avatar-images";

type ProcessRoot = Document | DocumentFragment | Element | HTMLImageElement;

const PROFILE_IMAGE_PATTERN = /\/profile_images\//i;
const RESERVED_PATH_SEGMENTS = new Set([
  "explore",
  "home",
  "i",
  "intent",
  "messages",
  "notifications",
  "search",
  "settings",
  "tos",
]);

const replacementUrls = getBundledAvatarUrls();
const replacementByUser = new Map<string, string>();

function debugLog(message: string, details?: unknown): void {
  if (!DEBUG) return;

  console.log(`[${EXTENSION_NAME}] ${message}`, details);
}

function getImageSource(image: HTMLImageElement): string {
  return image.currentSrc || image.src || image.getAttribute("src") || "";
}

function isExtensionAvatar(image: HTMLImageElement): boolean {
  const source = getImageSource(image);

  return replacementUrls.includes(source);
}

function isProfileAvatar(image: HTMLImageElement): boolean {
  if (!image.isConnected) return false;
  if (isExtensionAvatar(image)) return false;

  const source = getImageSource(image);
  const sourceSet = image.getAttribute("srcset") || "";

  return (
    PROFILE_IMAGE_PATTERN.test(source) || PROFILE_IMAGE_PATTERN.test(sourceSet)
  );
}

function getUserKey(image: HTMLImageElement): string {
  const link = image.closest("a[href]");

  if (link) {
    const href = link.getAttribute("href");
    if (href) {
      const url = new URL(href, window.location.origin);
      const [firstSegment, secondSegment] = url.pathname
        .split("/")
        .filter(Boolean);
      if (
        firstSegment &&
        !RESERVED_PATH_SEGMENTS.has(firstSegment) &&
        (!secondSegment ||
          secondSegment === "photo" ||
          secondSegment === "with_replies" ||
          secondSegment === "media" ||
          secondSegment === "likes")
      ) {
        return firstSegment.toLowerCase();
      }
    }
  }

  return getImageSource(image).toLowerCase();
}

function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function getReplacementUrl(userKey: string): string {
  const cached = replacementByUser.get(userKey);

  if (cached) return cached;
  const nextUrl = replacementUrls[hashString(userKey) % replacementUrls.length];
  replacementByUser.set(userKey, nextUrl);

  return nextUrl;
}

function replaceAvatar(image: HTMLImageElement): void {
  if (!isProfileAvatar(image)) return;

  const userKey = getUserKey(image);
  const replacementUrl = getReplacementUrl(userKey);

  if (
    image.getAttribute(DATA_ATTRIBUTE.replacementUrl) === replacementUrl &&
    getImageSource(image) === replacementUrl
  )
    return;

  image.setAttribute(DATA_ATTRIBUTE.replaced, "true");
  image.setAttribute(DATA_ATTRIBUTE.userKey, userKey);
  image.setAttribute(DATA_ATTRIBUTE.originalSrc, getImageSource(image));
  image.setAttribute(DATA_ATTRIBUTE.replacementUrl, replacementUrl);
  image.src = replacementUrl;
  image.srcset = replacementUrl;
  image.style.objectFit = "cover";

  debugLog("Replaced avatar", { userKey, replacementUrl });
}

function collectImages(root: ProcessRoot): HTMLImageElement[] {
  if (root instanceof HTMLImageElement) return [root];

  if (
    root instanceof Element ||
    root instanceof Document ||
    root instanceof DocumentFragment
  ) {
    return Array.from(
      root.querySelectorAll<HTMLImageElement>(AVATAR_SOURCE_SELECTOR),
    );
  }

  return [];
}

export function startAvatarReplacement(): () => void {
  if (replacementUrls.length === 0) {
    console.warn(`[${EXTENSION_NAME}] No images were found.`);
    return () => undefined;
  }

  const pendingRoots = new Set<ProcessRoot>();
  let frameId: number | null = null;

  const flush = (): void => {
    frameId = null;
    const roots = Array.from(pendingRoots);
    pendingRoots.clear();
    for (const root of roots) {
      for (const image of collectImages(root)) {
        replaceAvatar(image);
      }
    }
  };

  const schedule = (root: ProcessRoot): void => {
    pendingRoots.add(root);
    if (frameId !== null) return;
    frameId = window.requestAnimationFrame(flush);
  };

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (
        mutation.type === "attributes" &&
        mutation.target instanceof HTMLImageElement
      ) {
        schedule(mutation.target);
        continue;
      }

      for (const addedNode of mutation.addedNodes) {
        if (addedNode instanceof HTMLImageElement) {
          schedule(addedNode);
          continue;
        }
        if (
          addedNode instanceof Element ||
          addedNode instanceof DocumentFragment
        )
          schedule(addedNode);
      }
    }
  });

  schedule(document);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["src", "srcset"],
  });

  const cleanup = (): void => {
    observer.disconnect();

    if (frameId !== null) window.cancelAnimationFrame(frameId);

    pendingRoots.clear();
  };

  window.addEventListener("pagehide", cleanup, { once: true });

  debugLog("Started avatar replacement observer", {
    imagePoolSize: replacementUrls.length,
  });

  return cleanup;
}
