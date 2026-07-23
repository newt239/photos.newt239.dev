import { parse } from "exifr";

type ImageMeta = {
  width: number;
  height: number;
  takenAt: string | null;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  cameraMake: string | null;
  cameraModel: string | null;
  lensModel: string | null;
  focalLength: number | null;
  aperture: number | null;
  shutterSpeed: string | null;
  iso: number | null;
  orientation: number | null;
  rawExif: string | null;
};

export const probeDimensions = async (file: File): Promise<{ width: number; height: number }> => {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    const loaded = new Promise<{ width: number; height: number }>((resolve, reject) => {
      img.addEventListener("load", () =>
        resolve({ height: img.naturalHeight, width: img.naturalWidth }),
      );
      img.addEventListener("error", () => reject(new Error("IMAGE_LOAD_FAILED")));
    });
    img.src = url;
    return await loaded;
  } finally {
    URL.revokeObjectURL(url);
  }
};

const formatShutter = (value: unknown): string | null => {
  if (typeof value !== "number" || value <= 0) {
    return null;
  }
  if (value >= 1) {
    return `${value}s`;
  }
  const reciprocal = Math.round(1 / value);
  return `1/${reciprocal}`;
};

export const extractExif = async (file: File): Promise<Omit<ImageMeta, "width" | "height">> => {
  try {
    const tags = (await parse(file, {
      exif: true,
      gps: true,
      tiff: true,
    })) as Record<string, unknown> | undefined;
    if (!tags) {
      return emptyExif();
    }
    const takenAt =
      tags.DateTimeOriginal instanceof Date
        ? tags.DateTimeOriginal.toISOString()
        : tags.CreateDate instanceof Date
          ? tags.CreateDate.toISOString()
          : null;
    return {
      altitude: numOrNull(tags.GPSAltitude),
      aperture: numOrNull(tags.FNumber ?? tags.ApertureValue),
      cameraMake: strOrNull(tags.Make),
      cameraModel: strOrNull(tags.Model),
      focalLength: numOrNull(tags.FocalLength),
      iso: intOrNull(tags.ISO),
      latitude: numOrNull(tags.latitude),
      lensModel: strOrNull(tags.LensModel),
      longitude: numOrNull(tags.longitude),
      orientation: intOrNull(tags.Orientation),
      rawExif: JSON.stringify(tags, replaceDates),
      shutterSpeed: formatShutter(tags.ExposureTime),
      takenAt,
    };
  } catch {
    return emptyExif();
  }
};

const emptyExif = (): Omit<ImageMeta, "width" | "height"> => ({
  altitude: null,
  aperture: null,
  cameraMake: null,
  cameraModel: null,
  focalLength: null,
  iso: null,
  latitude: null,
  lensModel: null,
  longitude: null,
  orientation: null,
  rawExif: null,
  shutterSpeed: null,
  takenAt: null,
});

const numOrNull = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;
const intOrNull = (v: unknown): number | null => {
  const n = numOrNull(v);
  return n === null ? null : Math.trunc(n);
};
const strOrNull = (v: unknown): string | null => {
  if (typeof v !== "string") {
    return null;
  }
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : null;
};
const replaceDates = (_key: string, value: unknown): unknown => {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value instanceof Uint8Array) {
    return undefined;
  }
  return value;
};

export const generateThumbnail = async (
  file: File,
  maxEdge = 1024,
  quality = 0.82,
): Promise<Blob | null> => {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.addEventListener("load", () => resolve());
      img.addEventListener("error", () => reject(new Error("IMAGE_LOAD_FAILED")));
      img.src = url;
    });
    const { naturalWidth: w, naturalHeight: h } = img;
    const scale = Math.min(1, maxEdge / Math.max(w, h));
    const tw = Math.round(w * scale);
    const th = Math.round(h * scale);
    const canvas = document.createElement("canvas");
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }
    ctx.drawImage(img, 0, 0, tw, th);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/webp", quality);
    });
    return blob;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
};
