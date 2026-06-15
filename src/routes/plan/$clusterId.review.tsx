import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { getCluster } from "@/data/clusters";
import { useAppStore, type ReviewEntry } from "@/store/appStore";
import { getCampIdeas, type ContactEntry } from "@/lib/strategyContent";
import { Lightbulb, ClipboardCheck, ArrowLeft, CalendarDays, HardHat, Building2, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/plan/$clusterId/review")({
  component: ReviewScreen,
});

const CONTRACTOR_BUCKET = "CONTRACTOR" as const;
const RETAILER_BUCKET = "RETAILER" as const;
const STAKEHOLDER_BUCKET = "D2C" as const;

const EMPTY_ARR: string[] = [];
const EMPTY_CONTACTS: ContactEntry[] = [];
const EMPTY_REVIEWS: Record<string, ReviewEntry> = {};

type Question = { id: string; label: string; placeholder?: string; type?: "number" | "text" | "textarea" };

const EVENT_ENABLERS = [
  "Walk in with a clear value statement: how J K's product solves a real pain point for attendees.",
  "Carry visual samples, demo kits and a short success story to anchor conversations.",
  "Pre-identify 3-5 high-intent attendees you must speak to and capture their contact details.",
];
const EVENT_QUESTIONS: Question[] = [
  { id: "attended", label: "How many participants attended?", type: "number", placeholder: "e.g. 42" },
  { id: "leads", label: "How many qualified leads did you generate?", type: "number", placeholder: "e.g. 8" },
  { id: "rating", label: "How well did the engagement land (1-10)?", type: "number", placeholder: "e.g. 7" },
  {
    id: "takeaways",
    label: "What worked, what didn't, and what's the next step?",
    type: "textarea",
    placeholder: "Key takeaways and follow-ups",
  },
];

const CONTRACTOR_ENABLERS = [
  "Lead with margin, on-site support and product reliability — what makes the contractor's job easier and more profitable.",
  "Carry a comparison sheet against the brand they currently use, with concrete coverage / finish / TCO numbers.",
  "Be ready with a starter scheme (sample / loyalty / fast credit) they can act on in this meeting.",
];
const CONTRACTOR_QUESTIONS: Question[] = [
  { id: "met", label: "How many contractors did you meet?", type: "number" },
  { id: "interested", label: "How many showed real interest in switching / trying J K?", type: "number" },
  { id: "trials", label: "How many committed to a trial or first order?", type: "number" },
  { id: "blockers", label: "What objections or blockers came up?", type: "textarea" },
];

const RETAILER_ENABLERS = [
  "Frame the visit around demand you can drive into their shop — not just shelf-space asks.",
  "Bring data: which contractors / projects in their catchment are already asking for J K.",
  "Offer a clear next step: intro to a specific contractor, a joint site visit, or a sampling activity.",
];
const RETAILER_QUESTIONS: Question[] = [
  { id: "met", label: "How many retailers did you engage?", type: "number" },
  { id: "intros", label: "How many introductions / referrals did they commit to?", type: "number" },
  { id: "newLeads", label: "How many new contractor / project leads did you collect?", type: "number" },
  { id: "feedback", label: "Feedback on pricing, scheme and product fit", type: "textarea" },
];

const STAKEHOLDER_ENABLERS = [
  "Open with an insight specific to their site / institution — show you've done the homework.",
  "Tie J K's offer to the outcome they care about (cost, durability, downtime, aesthetics).",
  "Close with a concrete ask: site visit, spec inclusion, pilot, or a written next step.",
];
const STAKEHOLDER_QUESTIONS: Question[] = [
  { id: "met", label: "How many stakeholders did you meet directly?", type: "number" },
  { id: "decisions", label: "How many decisions / specs did you influence?", type: "number" },
  { id: "nextSteps", label: "What next steps did they commit to?", type: "textarea" },
  { id: "risks", label: "Any risks or competing brands in play?", type: "textarea" },
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

  const selectedCamps = useAppStore((s) => s.plan.selectedCampsByCluster[clusterId] ?? EMPTY_ARR);
  const strategyContacts = useAppStore((s) => s.plan.strategyContactsByCluster[clusterId]);
  const reviews = useAppStore((s) => s.plan.reviewsByCluster[clusterId] ?? EMPTY_REVIEWS);
  const setReview = useAppStore((s) => s.setReview);

  const camps = useMemo(() => {
    if (!cluster) return [];
    try {
      return getCampIdeas(clusterId);
    } catch {
      return [];
    }
  }, [clusterId, cluster]);

  const contractors = strategyContacts?.[CONTRACTOR_BUCKET] ?? EMPTY_CONTACTS;
  const retailers = strategyContacts?.[RETAILER_BUCKET] ?? EMPTY_CONTACTS;
  const stakeholders = strategyContacts?.[STAKEHOLDER_BUCKET] ?? EMPTY_CONTACTS;

  const validContractors = contractors.filter((c) => (c.name ?? "").trim());
  const validRetailers = retailers.filter((c) => (c.name ?? "").trim());
  const validStakeholders = stakeholders.filter((c) => (c.name ?? "").trim());
  const selectedCampObjs = camps.filter((c) => selectedCamps.includes(c.id));

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

  const update = (key: string, fieldId: string, value: string) => setReview(clusterId, key, { [fieldId]: value });

  return (
    <AppShell
      bottom={<BottomNav />}
      header={<StageHeader eyebrow="REVIEW ENGAGEMENT" title="Plan Review" backTo="/plan" />}
    >
      <div className="space-y-5 px-4 py-5 pb-24">
        <div>
          <button
            type="button"
            onClick={() => navigate({ to: "/plan" })}
            className="mb-2 flex items-center gap-1.5 text-[11px] text-muted-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to plans
          </button>
          <h2 className="font-serif text-xl leading-tight text-foreground">
            Cluster: <span className="text-critical">{cluster.name}</span>
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Prep before each engagement and capture outcomes after.
          </p>
        </div>

        {selectedCampObjs.length === 0 &&
        validContractors.length === 0 &&
        validRetailers.length === 0 &&
        validStakeholders.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Nothing planned yet for this cluster. Add events, contractors, retailers or stakeholders first.
          </p>
        ) : null}

        {/* EVENTS */}
        {selectedCampObjs.length > 0 && (
          <Section
            icon={<CalendarDays className="h-4 w-4 text-blue-700" />}
            iconBg="bg-blue-50"
            title="Events & camps"
          >
            <div className="space-y-3">
              {selectedCampObjs.map((c) => {
                const key = `camp:${c.id}`;
                return (
                  <ReviewCard
                    key={key}
                    title={c.label}
                    subtitle={c.description}
                    enablers={EVENT_ENABLERS}
                    questions={EVENT_QUESTIONS}
                    values={reviews[key] ?? {}}
                    onChange={(fid, v) => update(key, fid, v)}
                  />
                );
              })}
            </div>
          </Section>
        )}

        {/* CONTRACTORS */}
        {validContractors.length > 0 && (
          <Section icon={<HardHat className="h-4 w-4 text-green-700" />} iconBg="bg-green-50" title="Contractors">
            <ReviewCard
              title="Contractors you planned to convert"
              subtitle={`${validContractors.length} contact${validContractors.length === 1 ? "" : "s"} in the plan`}
              enablers={CONTRACTOR_ENABLERS}
              questions={CONTRACTOR_QUESTIONS}
              values={reviews["group:contractors"] ?? {}}
              onChange={(fid, v) => update("group:contractors", fid, v)}
            />
          </Section>
        )}

        {/* RETAILERS */}
        {validRetailers.length > 0 && (
          <Section icon={<Building2 className="h-4 w-4 text-amber-700" />} iconBg="bg-amber-50" title="Retailers">
            <ReviewCard
              title="Retailers who can connect you"
              subtitle={`${validRetailers.length} contact${validRetailers.length === 1 ? "" : "s"} in the plan`}
              enablers={RETAILER_ENABLERS}
              questions={RETAILER_QUESTIONS}
              values={reviews["group:retailers"] ?? {}}
              onChange={(fid, v) => update("group:retailers", fid, v)}
            />
          </Section>
        )}

        {/* STAKEHOLDERS */}
        {validStakeholders.length > 0 && (
          <Section icon={<UserCheck className="h-4 w-4 text-red-800" />} iconBg="bg-red-50" title="Stakeholders">
            <ReviewCard
              title="Stakeholders you planned to meet"
              subtitle={`${validStakeholders.length} contact${validStakeholders.length === 1 ? "" : "s"} in the plan`}
              enablers={STAKEHOLDER_ENABLERS}
              questions={STAKEHOLDER_QUESTIONS}
              values={reviews["group:stakeholders"] ?? {}}
              onChange={(fid, v) => update("group:stakeholders", fid, v)}
            />
          </Section>
        )}
      </div>
    </AppShell>
  );
}

function Section({
  icon,
  iconBg,
  title,
  children,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center gap-2">
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", iconBg)}>{icon}</div>
        <h3 className="font-serif text-base text-foreground">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function ReviewCard({
  title,
  subtitle,
  enablers,
  questions,
  values,
  onChange,
}: {
  title: string;
  subtitle?: string;
  enablers: string[];
  questions: Question[];
  values: ReviewEntry;
  onChange: (fieldId: string, value: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="border-b border-border bg-muted/30 px-4 py-3">
        <p className="font-serif text-sm text-foreground">{title}</p>
        {subtitle && <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="space-y-4 px-4 py-3">
        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-700">Enablers before meeting</p>
          </div>
          <ul className="space-y-1.5">
            {enablers.map((e, i) => (
              <li key={i} className="flex gap-2 text-[12px] leading-relaxed text-foreground/80">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-border pt-3">
          <div className="mb-2 flex items-center gap-1.5">
            <ClipboardCheck className="h-3.5 w-3.5 text-green-700" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-green-700">Review post meeting</p>
          </div>
          <div className="space-y-2.5">
            {questions.map((q) => (
              <div key={q.id}>
                <label className="mb-1 block text-[11px] font-medium text-foreground/80">{q.label}</label>
                {q.type === "textarea" ? (
                  <textarea
                    value={values[q.id] ?? ""}
                    onChange={(e) => onChange(q.id, e.target.value)}
                    placeholder={q.placeholder}
                    rows={2}
                    className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs"
                  />
                ) : (
                  <input
                    type={q.type === "number" ? "number" : "text"}
                    value={values[q.id] ?? ""}
                    onChange={(e) => onChange(q.id, e.target.value)}
                    placeholder={q.placeholder}
                    className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
