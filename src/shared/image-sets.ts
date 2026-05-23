export const IMAGE_SET_OPTIONS = [
  {
    id: "original",
    folder: "original",
    label: "Original sprites",
  },
  {
    id: "ps3",
    folder: "ps3",
    label: "Ps3 sprites & CGs",
  },
  {
    id: "pachinko",
    folder: "pachinko",
    label: "Pachinko sprites",
  },
  {
    id: "other",
    folder: "other",
    label: "Other official media",
  },
] as const;

export type ImageSetId = (typeof IMAGE_SET_OPTIONS)[number]["id"];

export type ImageSelection = Record<ImageSetId, boolean>;

export const DEFAULT_IMAGE_SELECTION: ImageSelection = {
  original: true,
  ps3: true,
  pachinko: true,
  other: true,
};
