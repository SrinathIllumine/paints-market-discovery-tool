import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/asm-analytics")({
  head: () => ({
    meta: [
      { title: "ASM Analytics" },
      { name: "description", content: "An Area Sales Manager's view of their own DG team." },
    ],
  }),
  component: () => <Outlet />,
});
