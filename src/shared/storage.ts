import { DEFAULT_IMAGE_SELECTION, type ImageSelection } from "./image-sets";

const STORAGE_KEY = "imageSelection";

function normalizeSelection(
  value: Partial<ImageSelection> | undefined,
): ImageSelection {
  return {
    ...DEFAULT_IMAGE_SELECTION,
    ...value,
  };
}

export function getImageSelection(): Promise<ImageSelection> {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      resolve(
        normalizeSelection(result[STORAGE_KEY] as Partial<ImageSelection>),
      );
    });
  });
}

export function setImageSelection(selection: ImageSelection): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set(
      {
        [STORAGE_KEY]: selection,
      },
      () => resolve(),
    );
  });
}

export function onImageSelectionChanged(
  callback: (selection: ImageSelection) => void,
): () => void {
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string,
  ): void => {
    if (areaName !== "local" || !changes[STORAGE_KEY]) return;
    callback(
      normalizeSelection(
        changes[STORAGE_KEY].newValue as Partial<ImageSelection>,
      ),
    );
  };
  chrome.storage.onChanged.addListener(listener);

  return () => chrome.storage.onChanged.removeListener(listener);
}
