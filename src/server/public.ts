import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "#/db/index.ts";
import { albumPhotos, albums, photos } from "#/db/schema.ts";

export const listPublicAlbums = createServerFn({ method: "GET" }).handler(async () => {
  const db = getDb(env.DB);
  const rows = await db
    .select({
      coverStorageKey: sql<string | null>`(
          SELECT p.storage_key FROM album_photos ap
          JOIN photos p ON p.id = ap.photo_id
          WHERE ap.album_id = ${albums}.id
          ORDER BY ap.sort_order ASC, ap.added_at ASC
          LIMIT 1
        )`.as("cover_storage_key"),
      coverThumbnailKey: sql<string | null>`(
          SELECT p.thumbnail_key FROM album_photos ap
          JOIN photos p ON p.id = ap.photo_id
          WHERE ap.album_id = ${albums}.id
          ORDER BY ap.sort_order ASC, ap.added_at ASC
          LIMIT 1
        )`.as("cover_thumbnail_key"),
      createdAt: albums.createdAt,
      description: albums.description,
      id: albums.id,
      photoCount: sql<number>`(
          SELECT COUNT(*) FROM album_photos WHERE album_photos.album_id = ${albums}.id
        )`.as("photo_count"),
      slug: albums.slug,
      title: albums.title,
    })
    .from(albums)
    .where(eq(albums.visibility, "public"))
    .orderBy(desc(albums.createdAt));
  return rows;
});

export const getPublicAlbumBySlug = createServerFn({ method: "GET" })
  .inputValidator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data }) => {
    const db = getDb(env.DB);
    const [album] = await db
      .select({
        description: albums.description,
        id: albums.id,
        slug: albums.slug,
        title: albums.title,
      })
      .from(albums)
      .where(and(eq(albums.slug, data.slug), eq(albums.visibility, "public")))
      .limit(1);
    if (!album) {
      return null;
    }

    const photoRows = await db
      .select({
        height: photos.height,
        id: photos.id,
        storageKey: photos.storageKey,
        thumbnailKey: photos.thumbnailKey,
        title: photos.title,
        width: photos.width,
      })
      .from(albumPhotos)
      .innerJoin(photos, eq(albumPhotos.photoId, photos.id))
      .where(eq(albumPhotos.albumId, album.id))
      .orderBy(albumPhotos.sortOrder, albumPhotos.addedAt);

    return { album, photos: photoRows };
  });
