import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/store/appStore";
import { Briefcase, Store, Plus, Trash2, Lightbulb } from "lucide-react";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Market Intelligence · Insights" },
      { name: "description", content: "Track local market intelligence — insights from MEs, retailers and your own observations." },
    ],
  }),
  component: InsightsScreen,
});

const ME_INSIGHTS = [
  "ME has reported a new redevelopment activity near Panvel MMRDA grounds. A good opportunity to connect with site supervisors and direct demand to JK.",
];

const RETAILER_INSIGHTS = [
  "80% Retailers have suggested that the repainting demand in Schools cluster in Khopoli area (25 kms from Panvel) is going to spike in the coming months. Good time to conduct an event for schools.",
  "Several retailers mentioned that demand for waterproofing products is gradually rising ahead of the monsoon season, presenting a good opportunity for conducting a contribution event.",
];

function InsightsScreen() {
  const insights = useAppStore((s) => s.insights);
  const addInsight = useAppStore((s) => s.addInsight);
  const removeInsight = useAppStore((s) => s.removeInsight);
  const [draft, setDraft] = useState("");

  return (
    <AppShell
      bottom={<BottomNav />}
      header={
        <StageHeader
          eyebrow="Market Intelligence"
          title="Track local intelligence"
          subtitle="Capture insights from the field and reuse them across stages."
        />
      }
    >
      <div className="space-y-5 px-5 py-5">
        <Section
          icon={<Briefcase className="h-5 w-5" />}
          title="From Marketing Executives"
        >
          {ME_INSIGHTS.map((t, i) => (
            <InsightCard key={i} text={t} />
          ))}
        </Section>

        <Section
          icon={<Store className="h-5 w-5" />}
          title="From Retailers in the area"
        >
          {RETAILER_INSIGHTS.map((t, i) => (
            <InsightCard key={i} text={t} />
          ))}
        </Section>

        <Section icon={<Lightbulb className="h-5 w-5" />} title="Your insights">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="What did you observe today in the field?"
            className="min-h-[80px]"
          />
          <Button
            onClick={() => {
              if (!draft.trim()) return;
              addInsight(draft.trim());
              setDraft("");
            }}
            disabled={!draft.trim()}
            className="mt-2 gap-1 bg-critical text-critical-foreground hover:bg-critical/90"
          >
            <Plus className="h-4 w-4" /> Add insight
          </Button>

          {insights.length > 0 && (
            <div className="mt-3 space-y-2">
              {insights.map((i) => (
                <div
                  key={i.id}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-card p-3"
                >
                  <p className="text-sm leading-relaxed">{i.text}</p>
                  <button
                    onClick={() => removeInsight(i.id)}
                    className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                    aria-label="Remove insight"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </AppShell>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy/10 text-navy">
          {icon}
        </div>
        <h2 className="font-display text-lg leading-tight">{title}</h2>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function InsightCard({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-3">
      <p className="text-sm leading-relaxed">{text}</p>
    </div>
  );
}
