import type { MantineColorScheme, MantineColorSchemeManager } from "@mantine/core";

export const COLOR_SCHEME_COOKIE = "mantine-color-scheme-value";

const ONE_YEAR = 60 * 60 * 24 * 365;

export const isColorScheme = (value: unknown): value is MantineColorScheme =>
  value === "light" || value === "dark" || value === "auto";

export const cookieColorSchemeManager = (
  opts: { key?: string; maxAge?: number } = {},
): MantineColorSchemeManager => {
  const key = opts.key ?? COLOR_SCHEME_COOKIE;
  const maxAge = opts.maxAge ?? ONE_YEAR;

  return {
    clear: () => {
      if (typeof document === "undefined") {
        return;
      }
      document.cookie = `${key}=; path=/; max-age=0; SameSite=Lax`;
    },
    get: (defaultValue) => {
      if (typeof document === "undefined") {
        return defaultValue;
      }
      const match = document.cookie.split("; ").find((row) => row.startsWith(`${key}=`));
      if (!match) {
        return defaultValue;
      }
      const value = decodeURIComponent(match.slice(key.length + 1));
      return isColorScheme(value) ? value : defaultValue;
    },
    set: (value) => {
      if (typeof document === "undefined") {
        return;
      }
      document.cookie = `${key}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
    },
    subscribe: () => {
      // Cookie ベースのため購読は不要
    },
    unsubscribe: () => {
      // Cookie ベースのため購読は不要
    },
  };
};
