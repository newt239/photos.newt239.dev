import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

import { getDb } from "#/db/index.ts";
import { photos } from "#/db/schema.ts";
import { ensureUserRow, requireUserId } from "#/lib/auth.ts";
import { buildOriginalKey, buildThumbnailKey, keyOwnerId, signPutUrl } from "#/server/storage.ts";

const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
  "image/gif",
] as const;

const THUMB_MIME = "image/webp";
const MAX_FILE_SIZE = 50 * 1024 * 1024;

const createPhotoUploadInput = z.object({
  contentType: z.enum(ALLOWED_MIME),
  hasThumbnail: z.boolean().default(true),
  size: z.number().int().positive().max(MAX_FILE_SIZE),
});

export const createPhotoUpload = createServerFn({ method: "POST" })
  .inputValidator(createPhotoUploadInput)
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    await ensureUserRow(userId);
    const photoId = nanoid();
    const originalKey = buildOriginalKey(userId, photoId, data.contentType);
    const originalUrl = await signPutUrl(originalKey, data.contentType);
    let thumbnailKey: string | null = null;
    let thumbnailUrl: string | null = null;
    if (data.hasThumbnail) {
      thumbnailKey = buildThumbnailKey(userId, photoId);
      thumbnailUrl = await signPutUrl(thumbnailKey, THUMB_MIME);
    }
    return {
      originalKey,
      originalUrl,
      photoId,
      thumbnailKey,
      thumbnailUrl,
    };
  });

const finalizePhotoInput = z.object({
  altitude: z.number().nullable().optional(),
  aperture: z.number().nullable().optional(),
  cameraMake: z.string().nullable().optional(),
  cameraModel: z.string().nullable().optional(),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE),
  focalLength: z.number().nullable().optional(),
  height: z.number().int().positive(),
  iso: z.number().int().nullable().optional(),
  latitude: z.number().nullable().optional(),
  lensModel: z.string().nullable().optional(),
  longitude: z.number().nullable().optional(),
  mimeType: z.enum(ALLOWED_MIME),
  orientation: z.number().int().nullable().optional(),
  originalKey: z.string().min(1),
  photoId: z.string().min(1),
  rawExif: z.string().nullable().optional(),
  shutterSpeed: z.string().nullable().optional(),
  takenAt: z.string().datetime().nullable().optional(),
  thumbnailKey: z.string().nullable(),
  title: z.string().max(200).nullable().optional(),
  width: z.number().int().positive(),
});

export const finalizePhoto = createServerFn({ method: "POST" })
  .inputValidator(finalizePhotoInput)
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    if (keyOwnerId(data.originalKey) !== userId) {
      throw new Error("FORBIDDEN");
    }
    if (data.thumbnailKey && keyOwnerId(data.thumbnailKey) !== userId) {
      throw new Error("FORBIDDEN");
    }

    const head = await env.MY_BUCKET.head(data.originalKey);
    if (!head) {
      throw new Error("UPLOAD_NOT_FOUND");
    }

    try {
      const db = getDb(env.DB);
      await db.insert(photos).values({
        altitude: data.altitude ?? null,
        aperture: data.aperture ?? null,
        cameraMake: data.cameraMake ?? null,
        cameraModel: data.cameraModel ?? null,
        fileSize: data.fileSize,
        focalLength: data.focalLength ?? null,
        height: data.height,
        id: data.photoId,
        iso: data.iso ?? null,
        latitude: data.latitude ?? null,
        lensModel: data.lensModel ?? null,
        longitude: data.longitude ?? null,
        mimeType: data.mimeType,
        orientation: data.orientation ?? null,
        rawExif: data.rawExif ?? null,
        shutterSpeed: data.shutterSpeed ?? null,
        storageKey: data.originalKey,
        takenAt: data.takenAt ? new Date(data.takenAt) : null,
        thumbnailKey: data.thumbnailKey,
        title: data.title ?? null,
        userId,
        visibility: "private",
        width: data.width,
      });
    } catch (error) {
      await env.MY_BUCKET.delete(data.originalKey).catch(() => {
        // ロールバック時の削除失敗は無視する
      });
      if (data.thumbnailKey) {
        await env.MY_BUCKET.delete(data.thumbnailKey).catch(() => {
          // ロールバック時の削除失敗は無視する
        });
      }
      throw error;
    }

    return { id: data.photoId };
  });

export const listMyPhotos = createServerFn({ method: "GET" })
  .inputValidator(z.object({ limit: z.number().int().positive().max(200).optional() }))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const db = getDb(env.DB);
    const rows = await db
      .select()
      .from(photos)
      .where(eq(photos.userId, userId))
      .orderBy(desc(photos.uploadedAt))
      .limit(data.limit ?? 200);
    return rows;
  });

export const getPhoto = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const db = getDb(env.DB);
    const [row] = await db
      .select()
      .from(photos)
      .where(and(eq(photos.id, data.id), eq(photos.userId, userId)))
      .limit(1);
    if (!row) {
      throw new Error("NOT_FOUND");
    }
    return row;
  });

const updatePhotoInput = z.object({
  alt: z.string().max(500).nullable(),
  caption: z.string().max(2000).nullable(),
  id: z.string().min(1),
  title: z.string().max(200).nullable(),
});

export const updatePhoto = createServerFn({ method: "POST" })
  .inputValidator(updatePhotoInput)
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const db = getDb(env.DB);
    const [existing] = await db
      .select({ id: photos.id })
      .from(photos)
      .where(and(eq(photos.id, data.id), eq(photos.userId, userId)))
      .limit(1);
    if (!existing) {
      return { error: "NOT_FOUND", success: false } as const;
    }
    await db
      .update(photos)
      .set({ alt: data.alt, caption: data.caption, title: data.title })
      .where(and(eq(photos.id, data.id), eq(photos.userId, userId)));
    return { id: data.id, success: true } as const;
  });

const draftSchema = z
  .object({
    alt: z.string(),
    caption: z.string(),
  })
  .partial();

export const generatePhotoDraft = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const db = getDb(env.DB);
    const [photo] = await db
      .select({ storageKey: photos.storageKey, thumbnailKey: photos.thumbnailKey })
      .from(photos)
      .where(and(eq(photos.id, data.id), eq(photos.userId, userId)))
      .limit(1);
    if (!photo) {
      return { error: "NOT_FOUND", success: false } as const;
    }

    const obj = await env.MY_BUCKET.get(photo.thumbnailKey ?? photo.storageKey);
    if (!obj) {
      return { error: "IMAGE_NOT_FOUND", success: false } as const;
    }
    const bytes = new Uint8Array(await obj.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 8192) {
      binary += String.fromCodePoint(...bytes.subarray(i, i + 8192));
    }
    const dataUri = `data:${obj.httpMetadata?.contentType ?? "image/jpeg"};base64,${btoa(binary)}`;

    const result = await env.AI.run("@cf/google/gemma-3-12b-it", {
      max_tokens: 512,
      messages: [
        {
          content: [
            {
              text:
                "あなたは写真管理アプリのアシスタントです。画像を見て日本語でキャプションと代替テキストを生成します。" +
                '出力は必ず次のJSON形式のみとし、前後に文章を付けないでください: {"caption": "...", "alt": "..."}。' +
                "caption は写真の魅力を伝える1〜2文の説明文。alt はスクリーンリーダー向けの簡潔で客観的な描写にしてください。",
              type: "text",
            },
            { image_url: { url: dataUri }, type: "image_url" },
          ],
          role: "user",
        },
      ],
      temperature: 0.2,
    });

    const raw = typeof result.response === "string" ? result.response : "";
    const match = /\{[\s\S]*\}/.exec(raw);
    let caption = raw.trim();
    let alt = "";
    if (match) {
      try {
        const parsed = draftSchema.safeParse(JSON.parse(match[0]));
        if (parsed.success) {
          const { alt: parsedAlt, caption: parsedCaption } = parsed.data;
          if (parsedCaption !== undefined) {
            caption = parsedCaption;
          }
          if (parsedAlt !== undefined) {
            alt = parsedAlt;
          }
        }
      } catch {
        // JSON のパースに失敗した場合は全文を caption として扱う
      }
    }

    return { alt, caption, success: true } as const;
  });
