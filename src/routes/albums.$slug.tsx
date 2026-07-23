import { Text } from "@mantine/core";
import { createFileRoute, notFound } from "@tanstack/react-router";

import { PublicAlbumGallery } from "#/components/PublicAlbumGallery.tsx";
import { getPublicAlbumBySlug } from "#/server/public.ts";

type PublicAlbum = NonNullable<Awaited<ReturnType<typeof getPublicAlbumBySlug>>>;

const PublicAlbumPage = () => {
  const { album, photos } = Route.useLoaderData();
  if (photos.length === 0) {
    return (
      <Text c="dimmed" size="sm" p="xl">
        このアルバムにはまだ写真がありません
      </Text>
    );
  }
  return <PublicAlbumGallery title={album.title} description={album.description} photos={photos} />;
};

export const Route = createFileRoute("/albums/$slug")({
  component: PublicAlbumPage,
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.album.title ?? "アルバム"} | Photo` }],
  }),
  loader: async ({
    params,
  }: {
    readonly params: { readonly slug: string };
  }): Promise<PublicAlbum> => {
    const result = await getPublicAlbumBySlug({ data: { slug: params.slug } });
    if (!result) {
      throw notFound();
    }
    return result;
  },
});
