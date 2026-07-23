import { Card, Text } from "@mantine/core";
import { Link } from "@tanstack/react-router";

import classes from "./PhotoCard.module.css";

export type PhotoCardData = {
  readonly id: string;
  readonly title: string | null;
  readonly storageKey: string;
  readonly thumbnailKey: string | null;
  readonly width: number;
  readonly height: number;
};

export const photoImageUrl = (key: string): string => {
  const m = /^users\/([^/]+)\/photos\/([^/]+)\/(.+)$/.exec(key);
  return m ? `/api/i/${m[1]}/${m[2]}/${m[3]}` : "";
};

type PhotoCardProps = {
  readonly photo: PhotoCardData;
  readonly albumSlug?: string;
};

export const PhotoCard = ({ photo, albumSlug }: Readonly<PhotoCardProps>) => {
  const src = photoImageUrl(photo.thumbnailKey ?? photo.storageKey);
  const card = (
    <Card withBorder radius="md" padding={0} className={classes.card}>
      <div className={classes.thumb} style={{ aspectRatio: `${photo.width} / ${photo.height}` }}>
        <img src={src} alt={photo.title ?? ""} loading="lazy" />
      </div>
      {photo.title && (
        <Text className={classes.title} size="sm" truncate px="sm" py="xs">
          {photo.title}
        </Text>
      )}
    </Card>
  );
  return albumSlug === undefined ? (
    <Link to="/admin/photos/$photoId" params={{ photoId: photo.id }} className={classes.link}>
      {card}
    </Link>
  ) : (
    <Link
      to="/admin/albums/$slug/photos/$photoId"
      params={{ photoId: photo.id, slug: albumSlug }}
      className={classes.link}
    >
      {card}
    </Link>
  );
};
