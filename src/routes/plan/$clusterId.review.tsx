import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { getCluster } from "@/data/clusters";
import { useAppStore, type ReviewEntry } from "@/store/appStore";
import { ArrowLeft, ClipboardCheck } from "lucide-react";

export const Route = createFileRoute("/plan/$clusterId/review")({
  component: ReviewScreen,
});

const EMPTY_REVIEWS: Record<string, ReviewEntry> = {};
const CLUSTER_REVIEW_KEY = "cluster:summary";

const MODEL_OPTIONS = [
  { value: "", label: "Select a model…" },
  { value: "events", label: "Events / camps" },
  { value: "contractor", label: "Contractor-driven" },
  { value: "retailer", label: "Retailer-driven" },
  { value: "stakeholder", label: "Stakeholder-driven" },
];

function ReviewScreen() {
  const { clusterId } = Route.useParams();
  const navigate = useNavigate();

  const cluster = useMemo(() => {
    try {
      return getCluster(clusterId) ?? null;
    } catch {
      return null;
    }
  }, [clusterId]);

  const reviews = useAppStore((s) => s.plan.reviewsByCluster[clusterId] ?? EMPTY_REVIEWS);
  const setReview = useAppStore((s) => s.setReview);
  const values: ReviewEntry = reviews[CLUSTER_REVIEW_KEY] ?? {};

  const update = (fieldId: string, value: string) => setReview(clusterId, CLUSTER_REVIEW_KEY, { [fieldId]: value });

  if (!cluster) {
    return (
      <AppShell bottom={<BottomNav />}>
        <div className="p-6 text-center text-muted-foreground">
          Cluster not found.{" "}
          <button className="text-navy underline" onClick={() => navigate({ to: "/plan" })}>
            Go back
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      bottom={<BottomNav />}
      header={<StageHeader eyebrow="REVIEW ENGAGEMENT" title="Cluster Review" backTo="/plan" />}
    >
      <div className="mx-auto max-w-xl space-y-6 px-4 py-6 pb-24">
        <div>
          <button
            type="button"
            onClick={() => navigate({ to: "/plan" })}
            className="mb-2 flex items-center gap-1.5 text-[11px] text-muted-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to plans
          </button>
          <h2 className="font-serif text-2xl leading-tight text-foreground">
            How did your quarter in{" "}
            <span className="text-critical">{cluster.name}</span> go?
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            A quick three-question reflection on what worked for this cluster — keep it crisp.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-3">
            <ClipboardCheck className="h-4 w-4 text-green-700" />
            <p className="text-[11px] font-semibold uppercase tracking-widest text-green-700">Cluster review</p>
          </div>

          <div className="divide-y divide-border">
            {/* Q1 — Yes/No */}
            <div className="px-5 py-5">
              <label className="block text-sm font-medium text-foreground">
                1. Did any of your events have good reception?
              </label>
              <div className="mt-3 inline-flex overflow-hidden rounded-xl border border-border">
                {(["Yes", "No"] as const).map((opt) => {
                  const active = values.goodReception === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => update("goodReception", opt)}
                      className={
                        "px-5 py-2 text-sm transition-colors " +
                        (active
                          ? "bg-navy text-navy-foreground"
                          : "bg-background text-foreground hover:bg-muted/40")
                      }
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Q2 — number */}
            <div className="px-5 py-5">
              <label className="block text-sm font-medium text-foreground">
                2. How many leads were you able to generate?
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={values.leadsGenerated ?? ""}
                onChange={(e) => update("leadsGenerated", e.target.value)}
                placeholder="e.g. 24"
                className="mt-3 w-40 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-navy focus:outline-none"
              />
            </div>

            {/* Q3 — dropdown */}
            <div className="px-5 py-5">
              <label className="block text-sm font-medium text-foreground">
                3. Which model worked best for you?
              </label>
              <select
                value={values.bestModel ?? ""}
                onChange={(e) => update("bestModel", e.target.value)}
                className="mt-3 w-full max-w-sm rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-navy focus:outline-none"
              >
                {MODEL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} disabled={o.value === ""}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate({ to: "/plan" })}
          className="h-11 w-full rounded-xl bg-navy font-serif text-sm text-navy-foreground hover:bg-navy/90"
        >
          Save & return to plans
        </button>
      </div>
    </AppShell>
  );
}
