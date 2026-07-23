import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from "@mantine/core";
import mantineCoreCss from "@mantine/core/styles.css?url";
import mantineDropzoneCss from "@mantine/dropzone/styles.css?url";
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";

import ClerkProvider from "#/integrations/clerk/provider.tsx";
import { cookieColorSchemeManager } from "#/lib/color-scheme.ts";
import { getColorSchemeCookie } from "#/server/color-scheme.ts";
import appCss from "#/styles.css?url";

const colorSchemeManager = cookieColorSchemeManager();

const RootDocument = ({ children }: { children: React.ReactNode }) => {
  const { colorScheme } = Route.useLoaderData();
  return (
    <html lang="ja" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme={colorScheme} />
        <HeadContent />
      </head>
      <body>
        <MantineProvider defaultColorScheme={colorScheme} colorSchemeManager={colorSchemeManager}>
          <ClerkProvider>{children}</ClerkProvider>
        </MantineProvider>
        <Scripts />
      </body>
    </html>
  );
};

export const Route = createRootRoute({
  head: () => ({
    links: [
      {
        href: mantineCoreCss,
        rel: "stylesheet",
      },
      {
        href: mantineDropzoneCss,
        rel: "stylesheet",
      },
      {
        href: appCss,
        rel: "stylesheet",
      },
    ],
    meta: [
      {
        // HTML の meta charset は仕様上 "utf-8" である必要がある
        // eslint-disable-next-line unicorn/text-encoding-identifier-case
        charSet: "utf-8",
      },
      {
        content: "width=device-width, initial-scale=1",
        name: "viewport",
      },
      {
        title: "Photo",
      },
    ],
  }),
  loader: async () => ({
    colorScheme: await getColorSchemeCookie(),
  }),
  shellComponent: RootDocument,
});
