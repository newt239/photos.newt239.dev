import { useMemo, useState } from "react";

import { Badge, Button, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { createFileRoute, useRouter } from "@tanstack/react-router";

import { AddPhotosToAlbumModal } from "#/components/AddPhotosToAlbumModal.tsx";
import { PhotoCard } from "#/components/PhotoCard.tsx";
import { getAlbumBySlug } from "#/server/albums.ts";

const AlbumDetailPage = () => {
  const { album, photos } = Route.useLoaderData();
  const { slug } = Route.useParams();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const existingIds = useMemo(() => new Set(photos.map((p) => p.id)), [photos]);

  return (
    <Stack p="xl" gap="md" maw={1200} mx="auto">
      <Stack gap={4}>
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Title order={2}>{album.title ?? "(無題)"}</Title>
            <Group gap="xs">
              <Badge variant="light">{album.visibility === "public" ? "公開" : "非公開"}</Badge>
              <Text size="sm" c="dimmed">
                {photos.length} 枚
              </Text>
            </Group>
          </Stack>
          <Button onClick={() => setModalOpen(true)}>写真を追加</Button>
        </Group>
        {album.description && (
          <Text size="sm" c="dimmed">
            {album.description}
          </Text>
        )}
      </Stack>

      {photos.length === 0 ? (
        <Text c="dimmed" size="sm">
          このアルバムにはまだ写真がありません
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 2, md: 4, sm: 3 }} spacing="md">
          {photos.map((p) => (
            <PhotoCard
              key={p.id}
              albumSlug={slug}
              photo={{
                height: p.height,
                id: p.id,
                storageKey: p.storageKey,
                thumbnailKey: p.thumbnailKey,
                title: p.title,
                width: p.width,
              }}
            />
          ))}
        </SimpleGrid>
      )}

      <AddPhotosToAlbumModal
        albumId={album.id}
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        existingPhotoIds={existingIds}
        onAdded={async () => router.invalidate()}
      />
    </Stack>
  );
};

type AlbumDetail = {
  readonly album: {
    readonly id: string;
    readonly title: string | null;
    readonly description: string | null;
    readonly visibility: "public" | "private";
  };
  readonly photos: readonly {
    readonly id: string;
    readonly title: string | null;
    readonly storageKey: string;
    readonly thumbnailKey: string | null;
    readonly width: number;
    readonly height: number;
  }[];
};

export const Route = createFileRoute("/admin/albums/$slug")({
  component: AlbumDetailPage,
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.album.title ?? "アルバム"} | Photo` }],
  }),
  loader: async ({
    params,
  }: {
    readonly params: { readonly slug: string };
  }): Promise<AlbumDetail> => getAlbumBySlug({ data: { slug: params.slug } }),
});
