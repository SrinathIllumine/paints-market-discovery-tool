import { useState } from "react";
import { ImageOff, Maximize2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContentItem } from "@/lib/systemTiles";

export function ContentCard({
  item,
  slug,
  fallbackIcon: FallbackIcon,
  tone,
  onExpand,
}: {
  item: ContentItem;
  slug: string;
  fallbackIcon: LucideIcon;
  tone: "navy" | "critical";
  onExpand: (src: string, text: string) => void;
}) {
  const [errored, setErrored] = useState(false);
  const src = item.image ? `/systemic/${slug}/${item.image}` : undefined;
  const hasImage = !!src && !errored;

  return (
    <button
      type="button"
      onClick={() => hasImage && src && onExpand(src, item.text)}
      className={cn(
        "group flex w-full items-start gap-3 rounded-xl border border-border bg-card p-2.5 text-left transition-all",
        hasImage ? "cursor-zoom-in hover:shadow-md hover:-translate-y-0.5" : "cursor-default",
      )}
    >
      <div
        className={cn(
          "relative h-16 w-24 shrink-0 overflow-hidden rounded-lg",
          tone === "navy" ? "bg-navy/10" : "bg-critical/10",
        )}
      >
        {hasImage ? (
          <>
            <img
              src={src}
              alt=""
              onError={() => setErrored(true)}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
              <Maximize2 className="h-3 w-3" />
            </span>
          </>
        ) : (
          <div className={cn("flex h-full w-full items-center justify-center", tone === "navy" ? "text-navy" : "text-critical")}>
            {item.image ? <ImageOff className="h-5 w-5 opacity-40" /> : <FallbackIcon className="h-6 w-6 opacity-70" />}
          </div>
        )}
      </div>
      <p className="min-w-0 flex-1 text-xs leading-snug text-foreground">{item.text}</p>
    </button>
  );
}
