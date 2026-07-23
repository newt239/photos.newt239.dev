import { Anchor, Card, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { Link, createFileRoute } from "@tanstack/react-router";

import classes from "#/components/AlbumCard.module.css";
import { photoImageUrl } from "#/components/PhotoCard.tsx";
import { listPublicAlbums } from "#/server/public.ts";

type PublicAlbums = Awaited<ReturnType<typeof listPublicAlbums>>;

const PublicAlbumCard = ({ album }: Readonly<{ album: PublicAlbums[number] }>) => {
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

const IndexPage = () => {
  const { albums } = Route.useLoaderData();
  return (
    <Stack p="xl" gap="xl" maw={1200} mx="auto" mih="100vh">
      <Stack gap={4}>
        <Title order={1}>Photo</Title>
        <Text c="dimmed" size="sm">
          アルバム
        </Text>
      </Stack>

      {albums.length === 0 ? (
        <Text c="dimmed" size="sm">
          公開アルバムはまだありません
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 2, md: 4, sm: 3 }} spacing="md">
          {albums.map((a) => (
            <PublicAlbumCard key={a.id} album={a} />
          ))}
        </SimpleGrid>
      )}

      <Group justify="center" mt="auto">
        <Anchor component={Link} to="/admin" size="xs" c="dimmed">
          管理
        </Anchor>
      </Group>
    </Stack>
  );
};

export const Route = createFileRoute("/")({
  component: IndexPage,
  head: () => ({ meta: [{ title: "Photo" }] }),
  loader: async (): Promise<{ albums: PublicAlbums }> => ({
    albums: await listPublicAlbums(),
  }),
});
