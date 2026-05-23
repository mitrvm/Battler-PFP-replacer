import {
  AVATAR_SOURCE_SELECTOR,
  DATA_ATTRIBUTE,
  DEBUG,
  EXTENSION_NAME,
} from "../shared/config";
import { DEFAULT_IMAGE_SELECTION } from "../shared/image-sets";
import { getBundledAvatarUrls } from "../shared/avatar-images";
import { getImageSelection, onImageSelectionChanged } from "../shared/storage";

type ProcessRoot = Document | DocumentFragment | Element | HTMLImageElement;

const PROFILE_IMAGE_PATTERN = /\/profile_images\//i;
const OVERLAY_ATTRIBUTE = "data-battler-avatar-overlay";
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

let replacementUrls = getBundledAvatarUrls(DEFAULT_IMAGE_SELECTION);
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

function getOverlayHost(image: HTMLImageElement): HTMLElement | null {
  if (image.parentElement instanceof HTMLElement) return image.parentElement;

  return null;
}

function getOrCreateOverlay(host: HTMLElement): HTMLSpanElement {
  const existingOverlay = host.querySelector<HTMLSpanElement>(
    `[${OVERLAY_ATTRIBUTE}="true"]`,
  );

  if (existingOverlay) return existingOverlay;

  const overlay = document.createElement("span");

  overlay.setAttribute(OVERLAY_ATTRIBUTE, "true");
  overlay.setAttribute("aria-hidden", "true");
  overlay.style.position = "absolute";
  overlay.style.inset = "0";
  overlay.style.display = "block";
  overlay.style.pointerEvents = "none";
  overlay.style.backgroundPosition = "center";
  overlay.style.backgroundRepeat = "no-repeat";
  overlay.style.backgroundSize = "cover";
  overlay.style.zIndex = "1";

  return host.appendChild(overlay);
}

function removeOverlay(host: HTMLElement): void {
  host.querySelector(`[${OVERLAY_ATTRIBUTE}="true"]`)?.remove();
}

function restoreAvatar(image: HTMLImageElement): void {
  const overlayHost = getOverlayHost(image);

  if (overlayHost) removeOverlay(overlayHost);

  image.style.opacity = "";
  image.style.objectFit = "";
  image.removeAttribute(DATA_ATTRIBUTE.replaced);
  image.removeAttribute(DATA_ATTRIBUTE.userKey);
  image.removeAttribute(DATA_ATTRIBUTE.originalSrc);
  image.removeAttribute(DATA_ATTRIBUTE.replacementUrl);
}

function replaceAvatar(image: HTMLImageElement): void {
  if (!isProfileAvatar(image)) {
    restoreAvatar(image);
    return;
  }
  if (replacementUrls.length === 0) {
    restoreAvatar(image);
    return;
  }

  const userKey = getUserKey(image);
  const replacementUrl = getReplacementUrl(userKey);
  const overlayHost = getOverlayHost(image);

  if (!overlayHost) return;
  if (
    image.getAttribute(DATA_ATTRIBUTE.replacementUrl) === replacementUrl &&
    overlayHost.querySelector(`[${OVERLAY_ATTRIBUTE}="true"]`)
  )
    return;

  image.setAttribute(DATA_ATTRIBUTE.replaced, "true");
  image.setAttribute(DATA_ATTRIBUTE.userKey, userKey);
  image.setAttribute(DATA_ATTRIBUTE.originalSrc, getImageSource(image));
  image.setAttribute(DATA_ATTRIBUTE.replacementUrl, replacementUrl);

  if (getComputedStyle(overlayHost).position === "static")
    overlayHost.style.position = "relative";

  overlayHost.style.overflow = "hidden";
  const overlay = getOrCreateOverlay(overlayHost);
  overlay.style.backgroundImage = `url("${replacementUrl}")`;
  image.style.opacity = "0";
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
  const pendingRoots = new Set<ProcessRoot>();
  let frameId: number | null = null;
  let removeSelectionListener = (): void => undefined;

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

  const updateReplacementPool = async (): Promise<void> => {
    const selection = await getImageSelection();

    replacementUrls = getBundledAvatarUrls(selection);
    replacementByUser.clear();
    schedule(document);

    debugLog("Updated image selection", {
      selection,
      imagePoolSize: replacementUrls.length,
    });
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

  void updateReplacementPool();
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["src", "srcset"],
  });

  removeSelectionListener = onImageSelectionChanged((selection) => {
    replacementUrls = getBundledAvatarUrls(selection);
    replacementByUser.clear();
    schedule(document);

    debugLog("Updated image selection", {
      selection,
      imagePoolSize: replacementUrls.length,
    });
  });

  const cleanup = (): void => {
    observer.disconnect();
    removeSelectionListener();

    if (frameId !== null) window.cancelAnimationFrame(frameId);

    pendingRoots.clear();
  };

  window.addEventListener("pagehide", cleanup, { once: true });

  debugLog("Started avatar replacement observer", {
    imagePoolSize: replacementUrls.length,
  });

  return cleanup;
}
