import { auth } from "@clerk/tanstack-react-start/server";
import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";
import { and, eq, exists, sql } from "drizzle-orm";

import { getDb } from "#/db/index.ts";
import { albumPhotos, albums, photos } from "#/db/schema.ts";

const FILE_PATTERN = /^(original|thumb)\.(jpg|jpeg|png|webp|avif|heic|heif|gif)$/i;

const serveFromR2 = async (key: string, cacheControl: string): Promise<Response> => {
  const obj = await env.MY_BUCKET.get(key);
  if (!obj) {
    return new Response("Not Found", { status: 404 });
  }
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("Cache-Control", cacheControl);
  headers.set("ETag", obj.httpEtag);
  return new Response(obj.body, { headers });
};

export const Route = createFileRoute("/api/i/$userId/$photoId/$file")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { userId: ownerId, photoId, file } = params;
        if (!FILE_PATTERN.test(file)) {
          return new Response("Not Found", { status: 404 });
        }
        const key = `users/${ownerId}/photos/${photoId}/${file}`;

        const { userId: requesterId } = await auth();
        if (requesterId === ownerId) {
          return serveFromR2(key, "private, max-age=3600");
        }

        // 非所有者: 写真自体が public、または public アルバムに属していれば配信
        const db = getDb(env.DB);
        const [row] = await db
          .select({
            inPublicAlbum: exists(
              db
                .select({ one: sql`1` })
                .from(albumPhotos)
                .innerJoin(albums, eq(albumPhotos.albumId, albums.id))
                .where(and(eq(albumPhotos.photoId, photos.id), eq(albums.visibility, "public"))),
            ),
            visibility: photos.visibility,
          })
          .from(photos)
          .where(and(eq(photos.id, photoId), eq(photos.userId, ownerId)))
          .limit(1);
        if (!row || (row.visibility !== "public" && !row.inPublicAlbum)) {
          return new Response("Not Found", { status: 404 });
        }
        return serveFromR2(key, "public, max-age=3600");
      },
    },
  },
});
