import { Card, Stack, Text } from "@mantine/core";
import { Link } from "@tanstack/react-router";

import classes from "./AlbumCard.module.css";
import { photoImageUrl } from "./PhotoCard";

export type AlbumCardData = {
  readonly id: string;
  readonly slug: string;
  readonly title: string | null;
  readonly description: string | null;
  readonly visibility: "public" | "private";
  readonly coverThumbnailKey: string | null;
  readonly coverStorageKey: string | null;
  readonly photoCount: number;
};

export const AlbumCard = ({ album }: Readonly<{ album: AlbumCardData }>) => {
  const coverKey = album.coverThumbnailKey ?? album.coverStorageKey;
  return (
    <Link to="/admin/albums/$slug" params={{ slug: album.slug }} className={classes.link}>
      <Card withBorder radius="md" padding={0} className={classes.card}>
        <div className={classes.cover}>
          {coverKey ? (
            <img src={photoImageUrl(coverKey)} alt="" loading="lazy" />
          ) : (
            <div className={classes.placeholder}>
              <Text size="xs" c="dimmed">
                No cover
              </Text>
            </div>
          )}
        </div>
        <Stack gap={2} px="sm" py="xs">
          <Text fw={600} truncate>
            {album.title ?? "(無題)"}
          </Text>
          <Text size="xs" c="dimmed">
            {album.photoCount} 枚・
            {album.visibility === "public" ? "公開" : "非公開"}
          </Text>
        </Stack>
      </Card>
    </Link>
  );
};
