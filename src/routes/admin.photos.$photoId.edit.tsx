import { useState } from "react";

import { Anchor, Button, Group, Paper, Stack, TextInput, Textarea, Title } from "@mantine/core";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import { generatePhotoDraft, getPhoto, updatePhoto } from "#/server/photos.ts";

type PhotoDetail = Awaited<ReturnType<typeof getPhoto>>;

const EditPhotoPage = () => {
  const photo = Route.useLoaderData();
  const navigate = useNavigate();
  const [title, setTitle] = useState(photo.title ?? "");
  const [caption, setCaption] = useState(photo.caption ?? "");
  const [alt, setAlt] = useState(photo.alt ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (generating) {
      return;
    }
    setGenerating(true);
    setErrorMessage(null);
    try {
      const result = await generatePhotoDraft({ data: { id: photo.id } });
      if (result.success) {
        setCaption(result.caption);
        setAlt(result.alt);
      } else {
        setErrorMessage(result.error);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) {
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await updatePhoto({
        data: {
          alt: alt.trim() || null,
          caption: caption.trim() || null,
          id: photo.id,
          title: title.trim() || null,
        },
      });
      if (result.success) {
        await navigate({ params: { photoId: photo.id }, to: "/admin/photos/$photoId" });
      } else {
        setErrorMessage(result.error);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack p="xl" gap="md" maw={680} mx="auto">
      <Anchor
        size="sm"
        renderRoot={(props) => (
          <Link {...props} to="/admin/photos/$photoId" params={{ photoId: photo.id }} />
        )}
      >
        ← 詳細に戻る
      </Anchor>
      <Title order={2}>写真を編集する</Title>
      <Paper withBorder radius="md" p="lg">
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="タイトル"
              value={title}
              onChange={(e) => setTitle(e.currentTarget.value)}
              maxLength={200}
            />
            <Textarea
              label="キャプション"
              autosize
              minRows={2}
              value={caption}
              onChange={(e) => setCaption(e.currentTarget.value)}
              maxLength={2000}
            />
            <Textarea
              label="代替テキスト"
              autosize
              minRows={2}
              value={alt}
              onChange={(e) => setAlt(e.currentTarget.value)}
              maxLength={500}
            />
            <Group justify="flex-start">
              <Button
                type="button"
                variant="light"
                loading={generating}
                disabled={submitting}
                onClick={handleGenerate}
              >
                AIで生成する
              </Button>
            </Group>
            {errorMessage && <div style={{ color: "red" }}>{errorMessage}</div>}
            <Group justify="flex-end">
              <Button type="submit" loading={submitting} disabled={generating}>
                保存する
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
};

export const Route = createFileRoute("/admin/photos/$photoId/edit")({
  component: EditPhotoPage,
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.title ?? "写真"} を編集 | Photo` }],
  }),
  loader: async ({
    params,
  }: {
    readonly params: { readonly photoId: string };
  }): Promise<PhotoDetail> => getPhoto({ data: { id: params.photoId } }),
});
