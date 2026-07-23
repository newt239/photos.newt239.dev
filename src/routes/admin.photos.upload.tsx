import { Anchor, Paper, Stack, Title } from "@mantine/core";
import { Link, createFileRoute } from "@tanstack/react-router";

import { UploadDropzone } from "#/components/UploadDropzone.tsx";

const PhotosUploadPage = () => {
  return (
    <Stack p="xl" gap="md" maw={900} mx="auto">
      <Anchor component={Link} to="/admin" size="sm">
        ← ホーム
      </Anchor>
      <Title order={2}>写真をアップロード</Title>
      <Paper withBorder radius="md" p="lg">
        <UploadDropzone />
      </Paper>
    </Stack>
  );
};

export const Route = createFileRoute("/admin/photos/upload")({
  component: PhotosUploadPage,
  head: () => ({ meta: [{ title: "アップロード | Photo" }] }),
});
