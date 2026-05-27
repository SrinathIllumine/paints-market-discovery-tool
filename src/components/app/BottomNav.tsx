import { Link, useRouterState } from "@tanstack/react-router";
import { Map as MapIcon, Users, ClipboardList, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/map", icon: MapIcon, label: "Market Map" },
  { to: "/connects", icon: Users, label: "Connects" },
  { to: "/plan", icon: ClipboardList, label: "Outreach" },
  { to: "/insights", icon: Lightbulb, label: "Insights" },
] as const;

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="sticky bottom-0 z-30 grid grid-cols-4 border-t border-border bg-card/95 backdrop-blur md:rounded-b-3xl">
      {items.map((it) => {
        const active = path.startsWith(it.to);
        const Icon = it.icon;
        return (
          <Link
            key={it.to}
            to={it.to}
            className={cn(
              "flex flex-col items-center gap-1 py-3 text-[11px] font-medium",
              active ? "text-navy" : "text-muted-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
