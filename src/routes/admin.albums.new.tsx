import { useState } from "react";

import {
  Anchor,
  Button,
  Group,
  Paper,
  SegmentedControl,
  Stack,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import { createAlbum } from "#/server/albums.ts";

const NewAlbumPage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length === 0 || submitting) {
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const { slug } = await createAlbum({
        data: {
          description: description.trim() || null,
          title: title.trim(),
          visibility,
        },
      });
      await navigate({ params: { slug }, to: "/admin/albums/$slug" });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack p="xl" gap="md" maw={680} mx="auto">
      <Anchor component={Link} to="/admin" size="sm">
        ← ホーム
      </Anchor>
      <Title order={2}>新しいアルバム</Title>
      <Paper withBorder radius="md" p="lg">
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="タイトル"
              required
              value={title}
              onChange={(e) => setTitle(e.currentTarget.value)}
              maxLength={200}
            />
            <Textarea
              label="説明"
              autosize
              minRows={2}
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
              maxLength={2000}
            />
            <div>
              <SegmentedControl
                value={visibility}
                onChange={(v) => setVisibility(v)}
                data={[
                  { label: "非公開", value: "private" },
                  { label: "公開", value: "public" },
                ]}
              />
            </div>
            {errorMessage && <div style={{ color: "red" }}>{errorMessage}</div>}
            <Group justify="flex-end">
              <Button type="submit" loading={submitting} disabled={title.trim().length === 0}>
                作成
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
};

export const Route = createFileRoute("/admin/albums/new")({
  component: NewAlbumPage,
  head: () => ({ meta: [{ title: "新規アルバム | Photo" }] }),
});
