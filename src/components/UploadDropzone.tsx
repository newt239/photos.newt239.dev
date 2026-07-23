import { useState } from "react";

import { Button, Group, List, Paper, Progress, Stack, Text } from "@mantine/core";
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { useRouter } from "@tanstack/react-router";

import { extractExif, generateThumbnail, probeDimensions } from "#/lib/image.ts";
import { createPhotoUpload, finalizePhoto } from "#/server/photos.ts";

const ACCEPTED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
  "image/gif",
] as const;

type UploadState = {
  id: string;
  name: string;
  status: "queued" | "preparing" | "uploading" | "saving" | "done" | "error";
  progress: number;
  error?: string;
};

const putToR2 = async (url: string, body: Blob, contentType: string) => {
  const res = await fetch(url, {
    body,
    headers: { "Content-Type": contentType },
    method: "PUT",
  });
  if (!res.ok) {
    throw new Error(`R2_PUT_FAILED_${res.status}`);
  }
};

export const UploadDropzone = ({ onComplete }: { onComplete?: () => void }) => {
  const [items, setItems] = useState<UploadState[]>([]);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const updateItem = (id: string, patch: Partial<UploadState>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const uploadOne = async (file: File, id: string) => {
    const contentType = file.type.toLowerCase();
    if (!ACCEPTED_MIME.includes(contentType as (typeof ACCEPTED_MIME)[number])) {
      updateItem(id, { error: `非対応の形式: ${contentType}`, status: "error" });
      return;
    }
    try {
      updateItem(id, { progress: 5, status: "preparing" });
      const [dims, exif, thumb] = await Promise.all([
        probeDimensions(file),
        extractExif(file),
        generateThumbnail(file),
      ]);

      updateItem(id, { progress: 25 });
      const prep = await createPhotoUpload({
        data: {
          contentType: contentType as (typeof ACCEPTED_MIME)[number],
          hasThumbnail: Boolean(thumb),
          size: file.size,
        },
      });

      updateItem(id, { progress: 40, status: "uploading" });
      await putToR2(prep.originalUrl, file, contentType);

      if (thumb && prep.thumbnailUrl) {
        updateItem(id, { progress: 70 });
        await putToR2(prep.thumbnailUrl, thumb, "image/webp");
      }

      updateItem(id, { progress: 85, status: "saving" });
      await finalizePhoto({
        data: {
          fileSize: file.size,
          height: dims.height,
          mimeType: contentType as (typeof ACCEPTED_MIME)[number],
          originalKey: prep.originalKey,
          photoId: prep.photoId,
          thumbnailKey: prep.thumbnailKey,
          width: dims.width,
          ...exif,
        },
      });

      updateItem(id, { progress: 100, status: "done" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      updateItem(id, { error: message, status: "error" });
    }
  };

  const handleDrop = async (files: File[]) => {
    const batch: { file: File; item: UploadState }[] = files.map((file) => ({
      file,
      item: {
        id: `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        progress: 0,
        status: "queued",
      },
    }));
    setItems((prev) => [...prev, ...batch.map((b) => b.item)]);
    setBusy(true);
    try {
      for (const { file, item } of batch) {
        // 進捗表示と負荷抑制のため意図的に 1 件ずつ逐次アップロードする
        // eslint-disable-next-line no-await-in-loop
        await uploadOne(file, item.id);
      }
      await router.invalidate();
      onComplete?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack gap="md">
      <Dropzone
        onDrop={handleDrop}
        onReject={(rejections) => {
          // eslint-disable-next-line no-console
          console.warn("rejected files", rejections);
        }}
        accept={IMAGE_MIME_TYPE}
        maxSize={50 * 1024 * 1024}
        loading={busy}
        multiple
      >
        <Group justify="center" mih={160} style={{ pointerEvents: "none" }}>
          <Stack align="center" gap={4}>
            <Text size="xl" fw={600}>
              画像をドラッグ&ドロップ
            </Text>
            <Text size="sm" c="dimmed">
              JPEG / PNG / WebP / AVIF / HEIC、1 ファイル 50 MB まで
            </Text>
          </Stack>
        </Group>
      </Dropzone>

      {items.length > 0 && (
        <Paper withBorder p="md" radius="md">
          <List spacing="sm" size="sm">
            {items.map((it) => (
              <List.Item key={it.id}>
                <Stack gap={4}>
                  <Group justify="space-between" wrap="nowrap">
                    <Text size="sm" truncate>
                      {it.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {labelFor(it.status)}
                    </Text>
                  </Group>
                  <Progress value={it.progress} color={it.status === "error" ? "red" : undefined} />
                  {it.error && (
                    <Text size="xs" c="red">
                      {it.error}
                    </Text>
                  )}
                </Stack>
              </List.Item>
            ))}
          </List>
        </Paper>
      )}

      <Group justify="flex-end">
        <Button
          variant="default"
          onClick={() => setItems([])}
          disabled={busy || items.length === 0}
        >
          履歴をクリア
        </Button>
      </Group>
    </Stack>
  );
};

const STATUS_LABEL: Record<UploadState["status"], string> = {
  done: "完了",
  error: "エラー",
  preparing: "前処理中",
  queued: "待機中",
  saving: "保存中",
  uploading: "アップロード中",
};

const labelFor = (status: UploadState["status"]): string => STATUS_LABEL[status];
