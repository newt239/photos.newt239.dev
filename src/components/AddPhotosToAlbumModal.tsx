import { useEffect, useState } from "react";

import { Button, Checkbox, Group, Modal, ScrollArea, SimpleGrid, Stack, Text } from "@mantine/core";

import { addPhotosToAlbum } from "#/server/albums.ts";
import { listMyPhotos } from "#/server/photos.ts";

import classes from "./AddPhotosToAlbumModal.module.css";
import { photoImageUrl } from "./PhotoCard";

type PhotoItem = Awaited<ReturnType<typeof listMyPhotos>>[number];

export const AddPhotosToAlbumModal = ({
  albumId,
  opened,
  onClose,
  onAdded,
  existingPhotoIds,
}: {
  albumId: string;
  opened: boolean;
  onClose: () => void;
  onAdded: () => void;
  existingPhotoIds: Set<string>;
}) => {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [selected, setSelected] = useState(new Set<string>());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!opened) {
      return;
    }
    setLoading(true);
    listMyPhotos({ data: {} })
      .then((rows) => {
        setPhotos(rows);
        setSelected(new Set());
      })
      .finally(() => setLoading(false));
  }, [opened]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selected.size === 0 || submitting) {
      return;
    }
    setSubmitting(true);
    try {
      await addPhotosToAlbum({
        data: { albumId, photoIds: [...selected] },
      });
      onAdded();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="写真を追加" size="lg">
      <Stack gap="md">
        {loading ? (
          <Text c="dimmed" size="sm">
            読み込み中…
          </Text>
        ) : photos.length === 0 ? (
          <Text c="dimmed" size="sm">
            追加できる写真がありません
          </Text>
        ) : (
          <ScrollArea.Autosize mah={480}>
            <SimpleGrid cols={{ base: 3, sm: 4 }} spacing="sm">
              {photos.map((p) => {
                const already = existingPhotoIds.has(p.id);
                const checked = selected.has(p.id);
                return (
                  <label
                    key={p.id}
                    className={classes.thumb}
                    data-checked={checked || undefined}
                    data-disabled={already || undefined}
                  >
                    <img
                      src={photoImageUrl(p.thumbnailKey ?? p.storageKey)}
                      alt=""
                      loading="lazy"
                    />
                    <Checkbox
                      className={classes.check}
                      checked={already || checked}
                      disabled={already}
                      onChange={() => toggle(p.id)}
                      aria-label={p.caption ?? p.id}
                    />
                  </label>
                );
              })}
            </SimpleGrid>
          </ScrollArea.Autosize>
        )}

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} loading={submitting} disabled={selected.size === 0}>
            {selected.size > 0 ? `${selected.size} 枚を追加` : "追加"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
