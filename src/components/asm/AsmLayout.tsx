import { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Grid3x3, TrendingUp, ListChecks, LogOut } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PANVEL_ASM, getAreasForState } from "@/data/geography";
import { ALL_ASM_AREAS_ID, useAsmStore } from "@/store/asmStore";

const DATA_AS_OF = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });

const navItems = [
  {
    icon: Grid3x3,
    label: "Priority Matrix",
    sub: "Which are the top market clusters that can improve our market penetration?",
    to: "/asm-analytics" as const,
  },
  {
    icon: ListChecks,
    label: "Strategy & Execution",
    sub: "Are we engaging enough with the markets and executing our strategies?",
    to: "/asm-analytics/execution" as const,
  },
  {
    icon: TrendingUp,
    label: "Market Penetration",
    sub: "Is our market penetration increasing?",
    to: "/asm-analytics/penetration" as const,
  },
];

/** Area selector — my whole territory, or drill into any one of my 4 DGs' areas. Every option is selectable. */
export function AsmAreaFilter({ className }: { className?: string }) {
  const areaId = useAsmStore((s) => s.areaId);
  const setArea = useAsmStore((s) => s.setArea);
  const areas = getAreasForState("maharashtra").filter((a) => PANVEL_ASM.areaIds.includes(a.id));

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Area</span>
      <Select value={areaId} onValueChange={setArea}>
        <SelectTrigger className="h-8 w-[190px] text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_ASM_AREAS_ID}>All areas (my territory)</SelectItem>
          {areas.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * ASM Analytics shell — Vikram Desai's view of his own 4-DG territory
 * (Panvel + Khopoli + Karjat + Pen). Each area maps to exactly one DG, so
 * the area filter doubles as a "drill into one DG" control.
 */
export function AsmLayout({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="asm-ui flex min-h-screen bg-background">
      <aside className="sticky top-0 flex h-screen w-72 shrink-0 flex-col border-r border-border bg-navy text-navy-foreground">
        <div className="border-b border-white/10 p-5">
          <h1 className="font-display text-lg font-bold">Paints</h1>
          <p className="mt-0.5 text-xs text-white/60">ASM Analytics</p>
          <p className="mt-2 text-sm font-semibold">Vikram Desai</p>
          <p className="text-xs text-white/50">Raigad ASM Territory · Panvel, Khopoli, Karjat, Pen</p>
        </div>
        <p className="px-5 pt-4 text-[10px] font-semibold uppercase tracking-wide text-white/40">
          Key questions for my territory
        </p>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => {
            const active = path === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors",
                  active ? "bg-critical text-critical-foreground" : "text-white/80 hover:bg-white/10",
                )}
              >
                <item.icon className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-light leading-tight">{item.label}</p>
                  <p className={cn("mt-0.5 text-sm font-semibold leading-snug", active ? "text-white" : "text-white/55")}>
                    {item.sub}
                  </p>
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
          <p className="px-3 pb-2 text-[11px] text-white/40">Data as of {DATA_AS_OF}</p>
          <Link
            to="/"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            Switch App
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl p-6">{children}</div>
      </main>
    </div>
  );
}
