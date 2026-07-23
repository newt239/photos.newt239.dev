import { Anchor, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { Link, createFileRoute } from "@tanstack/react-router";

import { PublicAlbumCard, type PublicAlbumData } from "#/components/PublicAlbumCard.tsx";
import { listPublicAlbums } from "#/server/public.ts";

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
  loader: async (): Promise<{ albums: PublicAlbumData[] }> => ({
    albums: await listPublicAlbums(),
  }),
});
