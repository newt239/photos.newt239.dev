import { useClerk, useUser } from "@clerk/tanstack-react-start";
import {
  Anchor,
  Avatar,
  Button,
  Group,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
} from "@mantine/core";
import { Link, createFileRoute } from "@tanstack/react-router";

const ProfileSection = () => {
  const { isLoaded, user } = useUser();
  if (!isLoaded || !user) {
    return (
      <Text c="dimmed" size="sm">
        読み込み中…
      </Text>
    );
  }
  const displayName = user.fullName ?? user.username ?? "(名前未設定)";
  const email = user.primaryEmailAddress?.emailAddress ?? "-";
  return (
    <Group gap="md" wrap="nowrap">
      <Avatar src={user.imageUrl} size="lg" radius="xl" alt={displayName} />
      <Stack gap={2} style={{ minWidth: 0 }}>
        <Text fw={600} truncate>
          {displayName}
        </Text>
        <Text size="sm" c="dimmed" truncate>
          {email}
        </Text>
      </Stack>
    </Group>
  );
};

const ThemeSection = () => {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  return (
    <SegmentedControl
      value={colorScheme}
      onChange={(v) => setColorScheme(v)}
      data={[
        { label: "ライト", value: "light" },
        { label: "ダーク", value: "dark" },
        { label: "自動", value: "auto" },
      ]}
    />
  );
};

const SignOutButton = () => {
  const { signOut } = useClerk();
  const handleSignOut = async () => {
    await signOut({ redirectUrl: "/" });
  };
  return (
    <Button color="red" variant="light" onClick={handleSignOut}>
      ログアウト
    </Button>
  );
};

const SettingsPage = () => {
  return (
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
};

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "設定 | Photo" }] }),
});
