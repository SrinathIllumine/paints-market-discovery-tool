import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/sales-enablement")({
  head: () => ({
    meta: [
      { title: "Sales Enablers" },
      {
        name: "description",
        content: "Move your prospects through the customer management funnel.",
      },
    ],
  }),
  component: () => <Outlet />,
});
