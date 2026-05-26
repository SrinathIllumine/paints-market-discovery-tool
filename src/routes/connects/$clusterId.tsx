import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { TriggerCard } from "@/components/app/TriggerCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, Phone, MessageSquare, Sparkles } from "lucide-react";
import { getCluster } from "@/data/clusters";
import { useAppStore } from "@/store/appStore";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/connects/$clusterId")({
  component: ConnectsClusterScreen,
});

type Tab = "whom" | "how" | "what";

function ConnectsClusterScreen() {
  const { clusterId } = Route.useParams();
  const cluster = useMemo(() => getCluster(clusterId), [clusterId]);
  const stakeholders = useAppStore((s) => s.stakeholders[clusterId] ?? []);
  const addStakeholder = useAppStore((s) => s.addStakeholder);
  const removeStakeholder = useAppStore((s) => s.removeStakeholder);

  const [tab, setTab] = useState<Tab>("whom");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", prospect: "", phone: "" });

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
          subtitle="Whom to connect, how to connect, what to talk."
          backTo="/connects"
        />
      }
    >
      <div className="sticky top-[124px] z-20 flex gap-1.5 bg-background/95 px-5 pb-2 pt-3 backdrop-blur">
        {(
          [
            { id: "whom", label: "Whom" },
            { id: "how", label: "How" },
            { id: "what", label: "What to talk" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 rounded-full border px-3 py-2 text-xs font-medium transition-colors",
              tab === t.id
                ? "border-navy bg-navy text-navy-foreground"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-4 px-5 pb-6 pt-3">
        {tab === "whom" && (
          <>
            <div className="space-y-2">
              {cluster.triggers.map((t) => (
                <TriggerCard key={t} text={t} />
              ))}
            </div>
            <div className="space-y-2">
              {stakeholders.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No stakeholders yet. Add your first contact below.
                </div>
              )}
              {stakeholders.map((s) => (
                <div
                  key={s.id}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-card p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{s.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{s.prospect}</p>
                    <a
                      href={`tel:${s.phone}`}
                      className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-critical"
                    >
                      <Phone className="h-3 w-3" /> {s.phone}
                    </a>
                  </div>
                  <button
                    onClick={() => removeStakeholder(clusterId, s.id)}
                    className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <Button
              onClick={() => setOpen(true)}
              className="h-12 w-full gap-2 bg-critical text-critical-foreground hover:bg-critical/90"
            >
              <Plus className="h-4 w-4" /> Add stakeholder
            </Button>
          </>
        )}

        {tab === "how" && (
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Suggested connection strategy
            </p>
            {cluster.howToConnect.map((h, i) => (
              <div
                key={h}
                className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy/10 text-xs font-semibold text-navy">
                  {i + 1}
                </div>
                <p className="text-sm leading-relaxed">{h}</p>
              </div>
            ))}
          </section>
        )}

        {tab === "what" && (
          <section className="space-y-3">
            <PitchBlock icon={<MessageSquare className="h-4 w-4" />} label="Introduction" text={cluster.pitch.intro} />
            <PitchBlock icon={<Sparkles className="h-4 w-4" />} label="Context" text={cluster.pitch.context} />
            <PitchBlock icon={<MessageSquare className="h-4 w-4" />} label="Intent" text={cluster.pitch.intent} />
            <p className="px-1 text-xs text-muted-foreground">
              Keep it conversational — adapt these blocks to each stakeholder.
            </p>
          </section>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Add stakeholder</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="s-name">Name</Label>
              <Input
                id="s-name"
                autoFocus
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Rajesh Kumar"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-prospect">Prospect / role</Label>
              <Input
                id="s-prospect"
                value={form.prospect}
                onChange={(e) => setForm({ ...form, prospect: e.target.value })}
                placeholder="e.g. Site engineer, Adhiraj Capital"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-phone">Phone</Label>
              <Input
                id="s-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 9xxxxxxxxx"
                inputMode="tel"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!form.name.trim()) return;
                addStakeholder(clusterId, {
                  name: form.name.trim(),
                  prospect: form.prospect.trim(),
                  phone: form.phone.trim(),
                });
                setForm({ name: "", prospect: "", phone: "" });
                setOpen(false);
              }}
              className="bg-critical text-critical-foreground hover:bg-critical/90"
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function PitchBlock({
  icon,
  label,
  text,
}: {
  icon: React.ReactNode;
  label: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-navy">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-sm leading-relaxed">{text}</p>
    </div>
  );
}
