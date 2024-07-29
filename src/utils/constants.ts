export const imageTypes = ["image/png", "image/jpeg", "image/webp"] as const;

export type ImageType = (typeof imageTypes)[number];
