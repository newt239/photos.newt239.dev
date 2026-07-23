import { AwsClient } from "aws4fetch";

import { env } from "#/env.ts";

const MIME_EXT: Record<string, string> = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const extFromMime = (mime: string): string => MIME_EXT[mime.toLowerCase()] ?? "bin";

export const buildOriginalKey = (userId: string, photoId: string, mime: string): string =>
  `users/${userId}/photos/${photoId}/original.${extFromMime(mime)}`;

export const buildThumbnailKey = (userId: string, photoId: string): string =>
  `users/${userId}/photos/${photoId}/thumb.webp`;

export const keyOwnerId = (storageKey: string): string | null => {
  const match = /^users\/([^/]+)\//.exec(storageKey);
  return match?.[1] ?? null;
};

const r2Client = (): AwsClient =>
  new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    region: "auto",
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    service: "s3",
  });

const R2_BUCKET_NAME = "photo";

const r2Endpoint = (key: string): string =>
  `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${key}`;

export const signPutUrl = async (
  key: string,
  contentType: string,
  expiresInSeconds = 300,
): Promise<string> => {
  const client = r2Client();
  const url = new URL(r2Endpoint(key));
  url.searchParams.set("X-Amz-Expires", String(expiresInSeconds));
  const signed = await client.sign(
    new Request(url.toString(), {
      headers: { "Content-Type": contentType },
      method: "PUT",
    }),
    { aws: { signQuery: true } },
  );
  return signed.url;
};
