import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { HandHeart } from "lucide-react";

export const Route = createFileRoute("/handhold")({
  head: () => ({
    meta: [
      { title: "Ongoing Customer Relationship" },
      { name: "description", content: "Maintain customer relationship post-sales" },
    ],
  }),
  component: HandholdScreen,
});

function HandholdScreen() {
  return (
    <AppShell
      bottom={<BottomNav />}
      header={
        <StageHeader
          eyebrow="Ongoing Customer Relationship"
          title="Ongoing Customer Relationship"
          subtitle="Maintain customer relationship post-sales"
        />
      }
    >
      <div className="px-5 py-10">
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <HandHeart className="h-6 w-6" />
          </div>
          <p className="font-display text-xl">Coming soon</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Tools for post-sale handholding are on the way. This section is temporarily disabled.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
