import { SegmentedControl, useMantineColorScheme } from "@mantine/core";

export const ThemeSection = () => {
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
