import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    displayName: text("display_name"),
    email: text().notNull(),
    id: text().primaryKey(),
    imageUrl: text("image_url"),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

export const photos = sqliteTable(
  "photos",
  {
    alt: text(),
    altitude: real(),
    aperture: real(),
    cameraMake: text("camera_make"),
    cameraModel: text("camera_model"),
    caption: text(),
    fileSize: integer("file_size").notNull(),
    focalLength: real("focal_length"),
    height: integer().notNull(),
    id: text().primaryKey(),
    iso: integer(),
    latitude: real(),
    lensModel: text("lens_model"),
    longitude: real(),
    mimeType: text("mime_type").notNull(),
    orientation: integer(),
    rawExif: text("raw_exif"),
    shutterSpeed: text("shutter_speed"),
    storageKey: text("storage_key").notNull(),
    takenAt: integer("taken_at", { mode: "timestamp" }),
    thumbnailKey: text("thumbnail_key"),
    uploadedAt: integer("uploaded_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    visibility: text({ enum: ["public", "private"] }).notNull(),
    width: integer().notNull(),
  },
  (t) => [
    index("photos_user_id_idx").on(t.userId),
    index("photos_taken_at_idx").on(t.takenAt),
    index("photos_lat_lng_idx").on(t.latitude, t.longitude),
  ],
);

export const albums = sqliteTable(
  "albums",
  {
    coverPhotoId: text("cover_photo_id").references(() => photos.id, {
      onDelete: "set null",
    }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    description: text(),
    id: text().primaryKey(),
    slug: text().notNull(),
    title: text(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    visibility: text({ enum: ["public", "private"] }).notNull(),
  },
  (t) => [uniqueIndex("albums_slug_idx").on(t.slug), index("albums_user_id_idx").on(t.userId)],
);

export const albumPhotos = sqliteTable(
  "album_photos",
  {
    addedAt: integer("added_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    albumId: text("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "cascade" }),
    photoId: text("photo_id")
      .notNull()
      .references(() => photos.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order"),
  },
  (t) => [
    primaryKey({ columns: [t.albumId, t.photoId] }),
    index("album_photos_photo_id_idx").on(t.photoId),
  ],
);

export const albumShares = sqliteTable(
  "album_shares",
  {
    albumId: text("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.albumId, t.userId] }),
    index("album_shares_user_id_idx").on(t.userId),
  ],
);

export const photoShares = sqliteTable(
  "photo_shares",
  {
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    photoId: text("photo_id")
      .notNull()
      .references(() => photos.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.photoId, t.userId] }),
    index("photo_shares_user_id_idx").on(t.userId),
  ],
);
