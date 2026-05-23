declare const __AVATAR_IMAGE_CATALOG__: Array<{
  category: "original" | "ps3" | "pachinko" | "other";
  path: string;
}>;

declare const chrome: {
  runtime: {
    getURL(path: string): string;
  };
  storage: {
    local: {
      get(
        key: string,
        callback: (items: Record<string, unknown>) => void,
      ): void;
      set(items: Record<string, unknown>, callback?: () => void): void;
    };
    onChanged: {
      addListener(
        callback: (
          changes: Record<string, chrome.storage.StorageChange>,
          areaName: string,
        ) => void,
      ): void;
      removeListener(
        callback: (
          changes: Record<string, chrome.storage.StorageChange>,
          areaName: string,
        ) => void,
      ): void;
    };
    StorageChange: never;
  };
};

declare namespace chrome {
  namespace storage {
    type StorageChange = {
      oldValue?: unknown;
      newValue?: unknown;
    };
  }
}
