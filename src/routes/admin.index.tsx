import { Group, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { Link, createFileRoute } from "@tanstack/react-router";

import { ActionCard } from "#/components/ActionCard.tsx";
import { AlbumCard, type AlbumCardData } from "#/components/AlbumCard.tsx";
import { PhotoGrid } from "#/components/PhotoGrid.tsx";
import { listMyAlbums } from "#/server/albums.ts";
import { listMyPhotos } from "#/server/photos.ts";

import type { PhotoCardData } from "#/components/PhotoCard.tsx";

const PREVIEW_LIMIT = 6;

type LoaderData = {
  readonly photos: readonly PhotoCardData[];
  readonly albums: readonly AlbumCardData[];
};

const AdminIndexPage = () => {
  const { photos, albums } = Route.useLoaderData();
  return (
    <Stack p="xl" gap="xl" maw={1200} mx="auto">
      <Stack gap={4}>
        <Title order={1}>Photo</Title>
        <Text c="dimmed" size="sm">
          最近の写真とアルバム
        </Text>
      </Stack>

      <Stack gap="sm">
        <Group justify="space-between" align="baseline">
          <Title order={3}>写真</Title>
          <Text component={Link} to="/admin/photos" size="sm" c="blue">
            すべて見る →
          </Text>
        </Group>
        <PhotoGrid photos={photos} />
      </Stack>

      <Stack gap="sm">
        <Group justify="space-between" align="baseline">
          <Title order={3}>アルバム</Title>
          <Text component={Link} to="/admin/albums" size="sm" c="blue">
            すべて見る →
          </Text>
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

      <Paper withBorder radius="md" p="md">
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          <ActionCard
            to="/admin/photos/upload"
            title="アップロード"
            description="新しい写真を追加"
          />
          <ActionCard to="/admin/albums/new" title="アルバム作成" description="写真をまとめる" />
          <ActionCard to="/admin/settings" title="設定" description="プロフィールとテーマ" />
        </SimpleGrid>
      </Paper>
    </Stack>
  );
};

export const Route = createFileRoute("/admin/")({
  component: AdminIndexPage,
  head: () => ({ meta: [{ title: "管理 | Photo" }] }),
  loader: async (): Promise<LoaderData> => {
    const [photos, albums] = await Promise.all([
      listMyPhotos({ data: { limit: PREVIEW_LIMIT } }),
      listMyAlbums({ data: { limit: PREVIEW_LIMIT } }),
    ]);
    return { albums, photos };
  },
});
