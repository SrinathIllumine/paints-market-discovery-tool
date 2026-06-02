import { Link, useRouterState } from "@tanstack/react-router";
import { Map as MapIcon, ClipboardList, Lightbulb, HandHeart } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/map", icon: MapIcon, label: "Cluster Potential", disabled: false },
  { to: "/plan", icon: ClipboardList, label: "Cluster Engagement", disabled: false },
    { to: "/sales-enablement", icon: Lightbulb, label: "Sales Enablers", disabled: true },
    { to: "/handhold", icon: HandHeart, label: "Ongoing Customer Relationship", disabled: true },
] as const;

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="sticky bottom-0 z-30 grid grid-cols-4 border-t border-border bg-card/95 backdrop-blur md:rounded-b-3xl">
      {items.map((it) => {
        const Icon = it.icon;
        if (it.disabled) {
          return (
            <div
              key={it.to}
              aria-disabled="true"
              title="Coming soon"
              className="flex cursor-not-allowed flex-col items-center gap-1 py-3 text-[11px] font-medium text-muted-foreground/40"
            >
              <Icon className="h-5 w-5" />
              {it.label}
            </div>
          );
        }
        const active = path.startsWith(it.to);
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
