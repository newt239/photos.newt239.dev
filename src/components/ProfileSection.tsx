import { useUser } from "@clerk/tanstack-react-start";
import { Avatar, Group, Stack, Text } from "@mantine/core";

export const ProfileSection = () => {
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
