import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/leadership")({
  head: () => ({
    meta: [
      { title: "Leadership Analytics" },
      { name: "description", content: "Aggregated visibility for leadership across all DGs." },
    ],
  }),
  component: () => <Outlet />,
});
