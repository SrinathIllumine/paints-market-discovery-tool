import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export type TourStep = {
  selector: string; // CSS selector for [data-tour="..."]
  title: string;
  body: string;
};

const STORAGE_KEY = "sed.tour.done";

function isDone(tourKey: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const obj = JSON.parse(raw) as Record<string, boolean>;
    return !!obj[tourKey];
  } catch {
    return false;
  }
}

function markDone(tourKey: string) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const obj = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    obj[tourKey] = true;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch {
    /* ignore */
  }
}

export function Tour({ tourKey, steps }: { tourKey: string; steps: TourStep[] }) {
  const [active, setActive] = useState(false);
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (isDone(tourKey)) return;
    // Wait a tick for DOM to render
    const t = setTimeout(() => setActive(true), 400);
    return () => clearTimeout(t);
  }, [tourKey]);

  useLayoutEffect(() => {
    if (!active) return;
    const step = steps[idx];
    if (!step) return;
    const el = document.querySelector(step.selector) as HTMLElement | null;
    if (!el) {
      setRect(null);
      return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const update = () => setRect(el.getBoundingClientRect());
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const interval = setInterval(update, 300);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      clearInterval(interval);
    };
  }, [active, idx, steps]);

  if (!active || typeof document === "undefined") return null;

  const step = steps[idx];
  if (!step) return null;

  const finish = () => {
    markDone(tourKey);
    setActive(false);
  };
  const next = () => {
    if (idx >= steps.length - 1) finish();
    else setIdx(idx + 1);
  };
  const skip = () => finish();

  // Tooltip position: below the element if there's room, else above.
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const tooltipTop = rect
    ? rect.bottom + 12 + 180 < vh
      ? rect.bottom + 12
      : Math.max(12, rect.top - 12 - 180)
    : vh / 2 - 90;
  const tooltipLeft = rect ? Math.max(12, Math.min(window.innerWidth - 320 - 12, rect.left)) : 12;

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={skip} />
      {/* Highlight ring */}
      {rect && (
        <div
          className="pointer-events-none absolute rounded-2xl ring-4 ring-critical shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] transition-all"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
          }}
        />
      )}
      {/* Tooltip */}
      <div
        className="absolute z-10 w-[min(320px,calc(100vw-24px))] rounded-2xl border border-border bg-card p-4 shadow-2xl"
        style={{ top: tooltipTop, left: tooltipLeft }}
      >
        <div className="mb-1 flex items-start justify-between gap-2">
          <p className="font-display text-base leading-tight">{step.title}</p>
          <button onClick={skip} aria-label="Skip tour" className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">{step.body}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <button onClick={skip} className="text-xs font-medium text-muted-foreground hover:text-foreground">
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">
              {idx + 1} / {steps.length}
            </span>
            <Button size="sm" onClick={next} className="h-8 bg-navy text-navy-foreground hover:bg-navy/90">
              {idx >= steps.length - 1 ? "Done" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
