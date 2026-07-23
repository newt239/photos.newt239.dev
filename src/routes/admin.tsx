import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { fetchAuth } from "#/server/auth.ts";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const { userId } = await fetchAuth();
    if (!userId) {
      throw redirect({ params: { _splat: "" }, to: "/login/$" });
    }
    return { userId };
  },
  component: Outlet,
});
