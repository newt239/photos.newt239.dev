import { nanoid } from "nanoid";

const slugify = (input: string): string => {
  const normalized = input
    .normalize("NFKD")
    .replaceAll(/[\u0300-\u036F]/g, "")
    .toLowerCase()
    .replaceAll(/[^a-z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
  return normalized || "album";
};

export const uniqueSlug = (title: string): string => `${slugify(title)}-${nanoid(6)}`;
