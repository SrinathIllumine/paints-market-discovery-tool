import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, Trash2 } from "lucide-react";
import { getCluster } from "@/data/clusters";
import { getStakeholderTypes, type StakeholderType } from "@/data/stakeholderFramework";
import { useAppStore } from "@/store/appStore";

export const Route = createFileRoute("/connects/$clusterId")({
  component: ConnectsClusterScreen,
});

function ConnectsClusterScreen() {
  const { clusterId } = Route.useParams();
  const cluster = useMemo(() => getCluster(clusterId), [clusterId]);
  const types = useMemo(() => getStakeholderTypes(clusterId), [clusterId]);

  if (!cluster) {
    return (
      <AppShell bottom={<BottomNav />}>
        <div className="p-6 text-center text-muted-foreground">Cluster not found.</div>
      </AppShell>
    );
  }

  return (
    <AppShell
      bottom={<BottomNav />}
      header={
        <StageHeader
          eyebrow="Stakeholder Connects"
          title={cluster.name}
          subtitle={`${cluster.nature} — ${cluster.description}`}
          backTo="/connects"
        />
      }
    >
      <div className="space-y-3 px-5 py-5">
        <h2 className="font-display text-lg">Plan Connects - Build your connects list for the cluster</h2>
        <Accordion type="multiple" defaultValue={[]} className="space-y-3">
          {types.map((t) => (
            <StakeholderTypeCard key={t.id} clusterId={clusterId} type={t} />
          ))}
        </Accordion>
      </div>
    </AppShell>
  );
}

function StakeholderTypeCard({
  clusterId,
  type,
}: {
  clusterId: string;
  type: StakeholderType;
}) {
  const all = useAppStore((s) => s.stakeholders[clusterId]) ?? [];
  const addStakeholder = useAppStore((s) => s.addStakeholder);
  const removeStakeholder = useAppStore((s) => s.removeStakeholder);

  const items = all.filter((s) => s.stakeholderTypeId === type.id);

  const [draft, setDraft] = useState({ name: "", phone: "", prospect: "", preferredBrand: "" });

  const canAdd = draft.name.trim().length > 0;

  return (
    <AccordionItem
      value={type.id}
      className="overflow-hidden rounded-2xl border border-border bg-card"
    >
      <AccordionTrigger className="px-4 py-3 hover:no-underline">
        <div className="flex w-full items-start justify-between gap-3 pr-2 text-left">
          <div className="min-w-0">
            <p className="font-display text-base leading-tight">{type.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{type.question}</p>
          </div>
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {items.length}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-5 px-4 pb-5">
        {/* 1. Make your list */}
        <section className="rounded-xl border border-border p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-navy">
            1. Make your list
          </p>
          {items.length > 0 && (
            <div className="mb-3 overflow-hidden rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-2 py-1.5 font-semibold">Name</th>
                    <th className="px-2 py-1.5 font-semibold">Phone</th>
                    <th className="px-2 py-1.5 font-semibold">Prospect</th>
                    <th className="px-2 py-1.5 font-semibold">Preferred Brand</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((s) => (
                    <tr key={s.id} className="border-t border-border">
                      <td className="px-2 py-1.5">{s.name}</td>
                      <td className="px-2 py-1.5">{s.phone || "—"}</td>
                      <td className="px-2 py-1.5">{s.prospect || "—"}</td>
                      <td className="px-2 py-1.5">{s.preferredBrand || "—"}</td>
                      <td className="px-2 py-1">
                        <button
                          onClick={() => removeStakeholder(clusterId, s.id)}
                          className="rounded-full p-1 text-muted-foreground hover:bg-muted"
                          aria-label="Remove"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Input
              placeholder="Name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
            <Input
              placeholder="Phone"
              inputMode="tel"
              value={draft.phone}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
            />
            <Input
              placeholder="Prospect"
              value={draft.prospect}
              onChange={(e) => setDraft({ ...draft, prospect: e.target.value })}
            />
            <Input
              placeholder="Preferred Brand"
              value={draft.preferredBrand}
              onChange={(e) => setDraft({ ...draft, preferredBrand: e.target.value })}
            />
          </div>
          <Button
            size="sm"
            disabled={!canAdd}
            onClick={() => {
              addStakeholder(clusterId, {
                name: draft.name.trim(),
                phone: draft.phone.trim(),
                prospect: draft.prospect.trim(),
                preferredBrand: draft.preferredBrand.trim() || undefined,
                stakeholderTypeId: type.id,
              });
              setDraft({ name: "", phone: "", prospect: "", preferredBrand: "" });
            }}
            className="mt-3 h-8 gap-1 text-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Add More
          </Button>
        </section>

        {/* 2. How to connect */}
        <section className="rounded-xl border border-border p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-navy">
            2. How to connect with the {type.name.toLowerCase()}?
          </p>
          <p className="mb-2 text-xs font-semibold">Connect Model:</p>
          <ul className="space-y-1.5 text-sm leading-relaxed">
            {type.howToConnect.map((h) => (
              <li key={h} className="flex gap-2">
                <span className="text-critical">•</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 3. What to talk */}
        <section className="rounded-xl border border-border p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-navy">
            3. What to talk?
          </p>
          <ul className="space-y-1.5 text-sm leading-relaxed">
            {type.whatToTalk.map((w) => (
              <li key={w} className="flex gap-2">
                <span className="text-critical">•</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </section>
      </AccordionContent>
    </AccordionItem>
  );
}
