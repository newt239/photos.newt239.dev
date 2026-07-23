import { Anchor, Button, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { Link, createFileRoute } from "@tanstack/react-router";

import { AlbumCard, type AlbumCardData } from "#/components/AlbumCard.tsx";
import { listMyAlbums } from "#/server/albums.ts";

const AlbumsIndexPage = () => {
  const { albums } = Route.useLoaderData();
  return (
    <Stack p="xl" gap="md" maw={1200} mx="auto">
      <Anchor component={Link} to="/admin" size="sm">
        ← ホーム
      </Anchor>
      <Group justify="space-between">
        <Title order={2}>アルバム</Title>
        <Button component={Link} to="/admin/albums/new">
          新規作成
        </Button>
      </Group>
      {albums.length === 0 ? (
        <Text c="dimmed" size="sm">
          アルバムはまだありません
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 2, md: 4, sm: 3 }} spacing="md">
          {albums.map((a) => (
            <AlbumCard key={a.id} album={a} />
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
};

export const Route = createFileRoute("/admin/albums/")({
  component: AlbumsIndexPage,
  head: () => ({ meta: [{ title: "アルバム | Photo" }] }),
  loader: async (): Promise<{ albums: readonly AlbumCardData[] }> => ({
    albums: await listMyAlbums({ data: {} }),
  }),
});
