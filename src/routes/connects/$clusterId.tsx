import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { Plus, Save } from "lucide-react";
import { getCluster } from "@/data/clusters";
import { getStakeholderTypes, type StakeholderType } from "@/data/stakeholderFramework";
import { useAppStore, type Stakeholder } from "@/store/appStore";

export const Route = createFileRoute("/connects/$clusterId")({
  component: ConnectsClusterScreen,
});

type Row = {
  id: string;
  name: string;
  phone: string;
  marketArea: string;
  comments: string;
  existingId?: string;
};

const blankRow = (): Row => ({
  id: `row-${Math.random().toString(36).slice(2, 9)}`,
  name: "",
  phone: "",
  marketArea: "",
  comments: "",
});

function buildInitialRows(existing: Stakeholder[]): Row[] {
  const fromExisting: Row[] = existing.map((s) => ({
    id: `row-${s.id}`,
    name: s.name,
    phone: s.phone,
    marketArea: s.marketArea ?? "",
    comments: s.comments ?? "",
    existingId: s.id,
  }));
  const fill = Math.max(0, 5 - fromExisting.length);
  return [...fromExisting, ...Array.from({ length: fill }, blankRow)];
}

function ConnectsClusterScreen() {
  const { clusterId } = Route.useParams();
  const navigate = useNavigate();
  const cluster = useMemo(() => getCluster(clusterId), [clusterId]);
  const types = useMemo(() => getStakeholderTypes(clusterId), [clusterId]);

  const existingAll = useAppStore((s) => s.stakeholders[clusterId]) ?? [];
  const addStakeholder = useAppStore((s) => s.addStakeholder);
  const removeStakeholder = useAppStore((s) => s.removeStakeholder);

  // Per stakeholder-type local row state (seed once)
  const [rowsByType, setRowsByType] = useState<Record<string, Row[]>>(() => {
    const init: Record<string, Row[]> = {};
    for (const t of types) {
      init[t.id] = buildInitialRows(existingAll.filter((s) => s.stakeholderTypeId === t.id));
    }
    return init;
  });

  if (!cluster) {
    return (
      <AppShell bottom={<BottomNav />}>
        <div className="p-6 text-center text-muted-foreground">Cluster not found.</div>
      </AppShell>
    );
  }

  const updateRow = (typeId: string, rowId: string, patch: Partial<Row>) => {
    setRowsByType((prev) => ({
      ...prev,
      [typeId]: prev[typeId].map((r) => (r.id === rowId ? { ...r, ...patch } : r)),
    }));
  };

  const addRow = (typeId: string) => {
    setRowsByType((prev) => ({ ...prev, [typeId]: [...prev[typeId], blankRow()] }));
  };

  const handleSave = () => {
    // Replace stored stakeholders for each type with what's in the rows.
    for (const t of types) {
      const rows = rowsByType[t.id] ?? [];
      const prevForType = existingAll.filter((s) => s.stakeholderTypeId === t.id);
      // Remove all previously saved for this type
      for (const s of prevForType) removeStakeholder(clusterId, s.id);
      // Re-add non-empty rows
      for (const r of rows) {
        if (r.name.trim().length === 0) continue;
        addStakeholder(clusterId, {
          name: r.name.trim(),
          phone: r.phone.trim(),
          marketArea: r.marketArea.trim() || undefined,
          comments: r.comments.trim() || undefined,
          stakeholderTypeId: t.id,
        });
      }
    }
    navigate({ to: "/map" });
  };

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
        <h2 className="font-display text-lg">
          Plan Connects - Build your connects list for the cluster
        </h2>
        <Accordion type="multiple" defaultValue={[]} className="space-y-3">
          {types.map((t) => (
            <StakeholderTypeCard
              key={t.id}
              type={t}
              rows={rowsByType[t.id] ?? []}
              onChangeRow={(rowId, patch) => updateRow(t.id, rowId, patch)}
              onAddRow={() => addRow(t.id)}
            />
          ))}
        </Accordion>

        <Button
          onClick={handleSave}
          className="mt-2 h-12 w-full gap-2 bg-navy text-base font-semibold text-navy-foreground hover:bg-navy/90"
        >
          <Save className="h-4 w-4" /> Save connects
        </Button>
      </div>
    </AppShell>
  );
}

function StakeholderTypeCard({
  type,
  rows,
  onChangeRow,
  onAddRow,
}: {
  type: StakeholderType;
  rows: Row[];
  onChangeRow: (rowId: string, patch: Partial<Row>) => void;
  onAddRow: () => void;
}) {
  const filled = rows.filter((r) => r.name.trim().length > 0).length;

  return (
    <AccordionItem
      value={type.id}
      className="overflow-hidden rounded-2xl border border-border bg-card"
    >
      <AccordionTrigger className="px-4 py-3 hover:no-underline">
        <div className="flex w-full items-start justify-between gap-3 pr-2 text-left">
          <div className="min-w-0">
            <p className="font-serif text-lg font-bold leading-snug tracking-tight text-foreground sm:text-base">
              {type.question}
            </p>
            <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground font-serif text-left font-normal">
              {type.name}
            </p>
          </div>
          <span className="mt-1 shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {filled}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-5 px-4 pb-5">
        {/* 1. Make your list */}
        <section className="rounded-xl border border-border p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-navy">
            1. Make your list
          </p>
          <div className="-mx-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-xs">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-2 py-1.5 font-semibold">Name</th>
                  <th className="px-2 py-1.5 font-semibold">Phone Number</th>
                  <th className="px-2 py-1.5 font-semibold">Market Area</th>
                  <th className="px-2 py-1.5 font-semibold">Comment(s)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border align-top">
                    <td className="whitespace-nowrap px-2 py-1">
                      <Input
                        value={r.name}
                        onChange={(e) => onChangeRow(r.id, { name: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </td>
                    <td className="whitespace-nowrap px-2 py-1">
                      <Input
                        value={r.phone}
                        inputMode="tel"
                        onChange={(e) => onChangeRow(r.id, { phone: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </td>
                    <td className="whitespace-nowrap px-2 py-1">
                      <Input
                        value={r.marketArea}
                        onChange={(e) => onChangeRow(r.id, { marketArea: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </td>
                    <td className="whitespace-nowrap px-2 py-1">
                      <Input
                        value={r.comments}
                        onChange={(e) => onChangeRow(r.id, { comments: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onAddRow}
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
