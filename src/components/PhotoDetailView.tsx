import type { ReactNode } from "react";

import { Anchor, Badge, Card, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";

import { photoImageUrl } from "./PhotoCard";
import classes from "./PhotoDetailView.module.css";

type PhotoDetailData = {
  readonly id: string;
  readonly title: string | null;
  readonly caption: string | null;
  readonly alt: string | null;
  readonly storageKey: string;
  readonly width: number;
  readonly height: number;
  readonly mimeType: string;
  readonly fileSize: number;
  readonly visibility: "public" | "private";
  readonly takenAt: Date | string | null;
  readonly uploadedAt: Date | string | null;
  readonly cameraMake: string | null;
  readonly cameraModel: string | null;
  readonly lensModel: string | null;
  readonly focalLength: number | null;
  readonly aperture: number | null;
  readonly shutterSpeed: string | null;
  readonly iso: number | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly altitude: number | null;
};

type InfoRow = { readonly label: string; readonly value: string };

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatDateTime = (value: Date | string | null): string | null => {
  if (!value) {
    return null;
  }
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d.toLocaleString("ja-JP", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatCoord = (value: number): string => value.toFixed(6);

const buildExifRows = (photo: PhotoDetailData): readonly InfoRow[] => {
  const rows: InfoRow[] = [];
  const camera = [photo.cameraMake, photo.cameraModel].filter(Boolean).join(" ");
  if (camera) {
    rows.push({ label: "カメラ", value: camera });
  }
  if (photo.lensModel) {
    rows.push({ label: "レンズ", value: photo.lensModel });
  }
  if (photo.focalLength !== null) {
    rows.push({ label: "焦点距離", value: `${photo.focalLength} mm` });
  }
  if (photo.aperture !== null) {
    rows.push({ label: "絞り", value: `f/${photo.aperture}` });
  }
  if (photo.shutterSpeed) {
    rows.push({ label: "シャッター速度", value: `${photo.shutterSpeed} s` });
  }
  if (photo.iso !== null) {
    rows.push({ label: "ISO", value: `ISO ${photo.iso}` });
  }
  return rows;
};

const buildFileRows = (photo: PhotoDetailData): readonly InfoRow[] => {
  const rows: InfoRow[] = [
    { label: "サイズ", value: `${photo.width} × ${photo.height}` },
    { label: "ファイルサイズ", value: formatFileSize(photo.fileSize) },
    { label: "形式", value: photo.mimeType },
  ];
  const uploaded = formatDateTime(photo.uploadedAt);
  if (uploaded) {
    rows.push({ label: "アップロード日時", value: uploaded });
  }
  return rows;
};

const renderInfoList = (rows: readonly InfoRow[]) => (
  <Stack gap={6}>
    {rows.map((row) => (
      <Group key={row.label} justify="space-between" gap="md" wrap="nowrap">
        <Text size="sm" c="dimmed">
          {row.label}
        </Text>
        <Text size="sm" ta="right">
          {row.value}
        </Text>
      </Group>
    ))}
  </Stack>
);

type Props = {
  readonly photo: PhotoDetailData;
  readonly backLink?: ReactNode;
  readonly editLink?: ReactNode;
};

export const PhotoDetailView = ({ photo, backLink, editLink }: Props) => {
  const imageSrc = photoImageUrl(photo.storageKey);
  const exifRows = buildExifRows(photo);
  const fileRows = buildFileRows(photo);
  const takenAt = formatDateTime(photo.takenAt);
  const hasLocation = photo.latitude !== null && photo.longitude !== null;

  return (
    <Stack p="xl" gap="md" maw={1200} mx="auto">
      {(backLink || editLink) && (
        <Group justify="space-between" wrap="nowrap">
          {backLink}
          {editLink}
        </Group>
      )}

      <Stack gap={4}>
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Title order={2}>{photo.title ?? "(無題)"}</Title>
          <Badge variant="light">{photo.visibility === "public" ? "公開" : "非公開"}</Badge>
        </Group>
        {photo.caption && <Text size="sm">{photo.caption}</Text>}
        {takenAt && (
          <Text size="sm" c="dimmed">
            撮影日時: {takenAt}
          </Text>
        )}
      </Stack>

      <div className={classes.frame} style={{ aspectRatio: `${photo.width} / ${photo.height}` }}>
        <img src={imageSrc} alt={photo.alt ?? photo.title ?? ""} />
      </div>

      <SimpleGrid cols={{ base: 1, md: hasLocation ? 3 : 2 }} spacing="md">
        {exifRows.length > 0 && (
          <Card withBorder radius="md" padding="md">
            <Stack gap="xs">
              <Title order={4}>EXIF</Title>
              {renderInfoList(exifRows)}
            </Stack>
          </Card>
        )}
        <Card withBorder radius="md" padding="md">
          <Stack gap="xs">
            <Title order={4}>ファイル情報</Title>
            {renderInfoList(fileRows)}
          </Stack>
        </Card>
        {photo.latitude !== null && photo.longitude !== null && (
          <Card withBorder radius="md" padding="md">
            <Stack gap="xs">
              <Title order={4}>位置情報</Title>
              {renderInfoList([
                { label: "緯度", value: formatCoord(photo.latitude) },
                { label: "経度", value: formatCoord(photo.longitude) },
                ...(photo.altitude === null
                  ? []
                  : [{ label: "標高", value: `${photo.altitude.toFixed(1)} m` }]),
              ])}
              <Anchor
                href={`https://www.google.com/maps?q=${photo.latitude},${photo.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                size="sm"
              >
                Google Maps で開く
              </Anchor>
            </Stack>
          </Card>
        )}
      </SimpleGrid>
    </Stack>
  );
};
