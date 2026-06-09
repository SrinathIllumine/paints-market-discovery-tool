import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { BottomNav } from "@/components/app/BottomNav";
import { StageHeader } from "@/components/app/StageHeader";
import { CLUSTERS, getCluster } from "@/data/clusters";
import { useAppStore } from "@/store/appStore";
import { getDominantContractors } from "@/lib/clusterScoring";
import { cn } from "@/lib/utils";
import { Phone, MapPin, Users, Hammer, Lightbulb, Store } from "lucide-react";

export const Route = createFileRoute("/network")({
  head: () => ({
    meta: [{ title: "My Network — Market Discovery Tool" }],
  }),
  component: NetworkPage,
});

type Category = "all" | "contractors" | "stakeholders" | "influencers" | "retailers";

const TABS: { key: Category; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "all",          label: "All",            icon: Users },
  { key: "contractors",  label: "Contractors",    icon: Hammer },
  { key: "stakeholders", label: "Stakeholders",   icon: Users },
  { key: "influencers",  label: "Influencers",    icon: Lightbulb },
  { key: "retailers",    label: "Retailers",      icon: Store },
];

type Entry = {
  id: string;
  name: string;
  phone?: string;
  area?: string;
  clusterId: string;
  category: Exclude<Category, "all">;
  role?: string;
};

const RETAILER_POOL = [
  { name: "Shree Hardware", area: "Old Panvel" },
  { name: "Sai Paints & Tiles", area: "Kharghar" },
  { name: "Krishna Decor Mart", area: "Kamothe" },
  { name: "Om Sai Building Materials", area: "Taloja" },
  { name: "Maharashtra Paint House", area: "New Panvel" },
];

function NetworkPage() {
  const stakeholders = useAppStore((s) => s.stakeholders);
  const strategyContacts = useAppStore((s) => s.plan.strategyContactsByCluster);

  const allEntries = useMemo<Entry[]>(() => {
    const out: Entry[] = [];

    for (const c of CLUSTERS) {
      // Stakeholders captured by user
      for (const sh of stakeholders[c.id] ?? []) {
        out.push({
          id: `sh-${sh.id}`,
          name: sh.name,
          phone: sh.phone,
          area: sh.marketArea,
          clusterId: c.id,
          category: "stakeholders",
        });
      }

      // Strategy-level contacts (contractors / retailers / influencers)
      const cm = strategyContacts[c.id] ?? {};
      for (const [strategy, list] of Object.entries(cm)) {
        const cat: Exclude<Category, "all"> =
          strategy === "CONTRACTOR" ? "contractors"
            : strategy === "RETAILER" ? "retailers"
            : strategy === "INFLUENCER" ? "influencers"
            : "stakeholders";
        for (const c2 of list ?? []) {
          if (!c2.name?.trim()) continue;
          out.push({
            id: `${strategy}-${c2.id}`,
            name: c2.name,
            phone: c2.phone,
            area: c2.area,
            role: c2.role,
            clusterId: c.id,
            category: cat,
          });
        }
      }

      // Seed dominant contractors so the page is never empty
      for (const dc of getDominantContractors(c.id).slice(0, 2)) {
        out.push({
          id: `seed-c-${c.id}-${dc.name}`,
          name: dc.name,
          phone: dc.phone,
          area: dc.area,
          clusterId: c.id,
          category: "contractors",
          role: dc.brandPreference,
        });
      }

      // Seed a few retailers per cluster
      for (let i = 0; i < 2; i++) {
        const r = RETAILER_POOL[(c.id.length + i) % RETAILER_POOL.length];
        out.push({
          id: `seed-r-${c.id}-${i}`,
          name: r.name,
          area: r.area,
          phone: `+91 9${(80000000 + (c.id.charCodeAt(0) * 1000) + i).toString().slice(0, 9)}`,
          clusterId: c.id,
          category: "retailers",
        });
      }
    }
    return out;
  }, [stakeholders, strategyContacts]);

  const [tab, setTab] = useState<Category>("all");
  const [clusterFilter, setClusterFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allEntries.filter((e) => {
      if (tab !== "all" && e.category !== tab) return false;
      if (clusterFilter !== "all" && e.clusterId !== clusterFilter) return false;
      if (q && !`${e.name} ${e.area ?? ""} ${e.role ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allEntries, tab, clusterFilter, search]);

  const counts = useMemo(() => {
    const c: Record<Category, number> = { all: 0, contractors: 0, stakeholders: 0, influencers: 0, retailers: 0 };
    for (const e of allEntries) {
      if (clusterFilter !== "all" && e.clusterId !== clusterFilter) continue;
      c.all += 1;
      c[e.category] += 1;
    }
    return c;
  }, [allEntries, clusterFilter]);

  return (
    <AppShell
      bottom={<BottomNav />}
      header={<StageHeader eyebrow="Directory" title="My Network" backTo="/dashboard" />}
    >
      <div className="space-y-3 px-5 py-5">
        <p className="text-xs text-muted-foreground">
          Contractors, stakeholders, influencers and retailers across all clusters.
        </p>

        {/* Cluster filter + search */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={clusterFilter}
            onChange={(e) => setClusterFilter(e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm sm:w-1/2"
          >
            <option value="all">All clusters</option>
            {CLUSTERS.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, area, role…"
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm sm:w-1/2"
          />
        </div>

        {/* Category tabs */}
        <div className="-mx-1 flex gap-1 overflow-x-auto pb-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "border-navy bg-navy text-navy-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/40",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
                <span className={cn(
                  "ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground",
                )}>
                  {counts[t.key]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Entries list */}
        {filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            No contacts match your filters.
          </p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((e) => (
              <li key={e.id} className="rounded-xl border border-border bg-card p-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold leading-tight">{e.name}</p>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {getCluster(e.clusterId)?.name ?? e.clusterId}
                      {e.role ? ` · ${e.role}` : ""}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                      {e.phone && (
                        <a href={`tel:${e.phone}`} className="inline-flex items-center gap-1 text-navy hover:underline">
                          <Phone className="h-3 w-3" /> {e.phone}
                        </a>
                      )}
                      {e.area && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {e.area}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                    e.category === "contractors" && "bg-blue-100 text-blue-800",
                    e.category === "stakeholders" && "bg-violet-100 text-violet-800",
                    e.category === "influencers" && "bg-amber-100 text-amber-800",
                    e.category === "retailers" && "bg-emerald-100 text-emerald-800",
                  )}>
                    {e.category}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
