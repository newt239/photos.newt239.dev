import { Card, Stack, Text } from "@mantine/core";
import { Link } from "@tanstack/react-router";

import classes from "#/components/AlbumCard.module.css";
import { photoImageUrl } from "#/components/PhotoCard.tsx";

import type { listPublicAlbums } from "#/server/public.ts";

export type PublicAlbumData = Awaited<ReturnType<typeof listPublicAlbums>>[number];

export const PublicAlbumCard = ({ album }: Readonly<{ album: PublicAlbumData }>) => {
  const coverKey = album.coverThumbnailKey ?? album.coverStorageKey;
  return (
    <Link to="/albums/$slug" params={{ slug: album.slug }} className={classes.link}>
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
            {album.photoCount} 枚
          </Text>
        </Stack>
      </Card>
    </Link>
  );
};
