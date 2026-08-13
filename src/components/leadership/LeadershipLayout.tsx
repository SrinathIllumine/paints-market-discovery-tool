import { ReactNode, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Grid3x3, TrendingUp, Target, ListChecks, LogOut, Calendar as CalendarIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const navItems = [
  {
    icon: Grid3x3,
    label: "Priority Matrix",
    sub: "Which clusters should DGs focus on first?",
    to: "/leadership" as const,
  },
  {
    icon: TrendingUp,
    label: "Market Penetration",
    sub: "How deep is our reach in each cluster?",
    to: "/leadership/penetration" as const,
  },
  {
    icon: Target,
    label: "Engagement Focus",
    sub: "Where are DGs actually spending their time?",
    to: "/leadership/engagement" as const,
  },
  {
    icon: ListChecks,
    label: "Strategy & Execution",
    sub: "Is the plan on track across the team?",
    to: "/leadership/execution" as const,
  },
];

export function LeadershipLayout({ children, hideFilters = false }: { children: ReactNode; hideFilters?: boolean }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [period, setPeriod] = useState<"daily" | "weekly">("weekly");
  const [scope, setScope] = useState("maharashtra");

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 flex h-screen w-72 shrink-0 flex-col border-r border-border bg-navy text-navy-foreground">
        <div className="border-b border-white/10 p-5">
          <h1 className="font-display text-lg font-bold">Paints</h1>
          <p className="mt-0.5 text-xs text-white/60">Leadership Analytics</p>
        </div>
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
        {!hideFilters && (
          <div className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-sm">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-6 py-3">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Scope</span>
              <Select value={scope} onValueChange={setScope}>
                <SelectTrigger className="h-8 w-[180px] text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="national">National</SelectItem>
                  <SelectItem value="maharashtra">State · Maharashtra</SelectItem>
                  <SelectItem value="panvel">Area · Panvel</SelectItem>
                </SelectContent>
              </Select>

              <div className="ml-auto flex items-center gap-2">
                <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <Tabs value={period} onValueChange={(v) => setPeriod(v as "daily" | "weekly")}>
                  <TabsList className="h-8">
                    <TabsTrigger value="daily" className="px-3 text-xs">
                      Daily
                    </TabsTrigger>
                    <TabsTrigger value="weekly" className="px-3 text-xs">
                      Weekly
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>
        )}
        <div className="mx-auto max-w-6xl p-6">{children}</div>
      </main>
    </div>
  );
}
