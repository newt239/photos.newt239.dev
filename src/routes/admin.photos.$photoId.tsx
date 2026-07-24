import { Anchor } from "@mantine/core";
import { Link, createFileRoute } from "@tanstack/react-router";

import { PhotoDetailView } from "#/components/PhotoDetailView.tsx";
import { getPhoto } from "#/server/photos.ts";

type PhotoDetail = Awaited<ReturnType<typeof getPhoto>>;

const PhotoDetailPage = () => {
  const photo = Route.useLoaderData();
  return (
    <PhotoDetailView
      photo={photo}
      backLink={
        <Anchor component={Link} to="/admin/photos" size="sm">
          ← 写真一覧に戻る
        </Anchor>
      }
    />
  );
};

export const Route = createFileRoute("/admin/photos/$photoId")({
  component: PhotoDetailPage,
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.caption ?? "写真"} | Photo` }],
  }),
  loader: async ({
    params,
  }: {
    readonly params: { readonly photoId: string };
  }): Promise<PhotoDetail> => getPhoto({ data: { id: params.photoId } }),
});
