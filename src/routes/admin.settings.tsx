import { Anchor, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { Link, createFileRoute } from "@tanstack/react-router";

import { ProfileSection } from "#/components/ProfileSection.tsx";
import { SignOutButton } from "#/components/SignOutButton.tsx";
import { ThemeSection } from "#/components/ThemeSection.tsx";

const SettingsPage = () => (
  <Stack p="xl" gap="lg" maw={680} mx="auto">
    <Anchor component={Link} to="/admin" size="sm">
      ← ホーム
    </Anchor>
    <Title order={2}>設定</Title>

    <Paper withBorder radius="md" p="lg">
      <Stack gap="sm">
        <Text fw={600} size="sm">
          プロフィール
        </Text>
        <ProfileSection />
      </Stack>
    </Paper>

    <Paper withBorder radius="md" p="lg">
      <Stack gap="sm">
        <Text fw={600} size="sm">
          カラーテーマ
        </Text>
        <ThemeSection />
      </Stack>
    </Paper>

    <Paper withBorder radius="md" p="lg">
      <Stack gap="sm">
        <Text fw={600} size="sm">
          アカウント
        </Text>
        <Group>
          <SignOutButton />
        </Group>
      </Stack>
    </Paper>
  </Stack>
);

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "設定 | Photo" }] }),
});
