import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Package, Gauge } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ContentCard } from "@/components/systemic/ContentCard";
import { getSystemTile } from "@/lib/systemTiles";

export const Route = createFileRoute("/systemic/$slug")({
  loader: ({ params }) => {
    const tile = getSystemTile(params.slug);
    if (!tile) throw notFound();
    return tile;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.title} — Market Intelligence System` : "Sub-system" },
      { name: "description", content: loaderData?.desc ?? "" },
    ],
  }),
  component: SystemDetailPage,
});

function SystemDetailPage() {
  const tile = Route.useLoaderData();
  const [lightbox, setLightbox] = useState<{ src: string; text: string } | null>(null);
  const Icon = tile.icon;

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="bg-navy px-6 pb-6 pt-6 text-navy-foreground">
        <div className="mx-auto max-w-4xl">
          <Link
            to="/"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Systemic View
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-bold leading-tight">{tile.title}</h1>
              {tile.layer && (
                <span className="mt-0.5 inline-block w-fit rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-white/70">
                  {tile.layer}
                </span>
              )}
            </div>
          </div>
          <p className="mt-3 text-sm text-white/75">{tile.desc}</p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-6 py-6">
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Package className="h-4 w-4 text-navy" />
            <h2 className="font-display text-base font-bold text-foreground">What it contains</h2>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {tile.contains.map((item, i) => (
              <ContentCard
                key={i}
                item={item}
                slug={tile.slug}
                fallbackIcon={Icon}
                tone="navy"
                onExpand={(src, text) => setLightbox({ src, text })}
              />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Gauge className="h-4 w-4 text-critical" />
            <h2 className="font-display text-base font-bold text-foreground">Measures / Outcomes</h2>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {tile.outcomes.map((item, i) => (
              <ContentCard
                key={i}
                item={item}
                slug={tile.slug}
                fallbackIcon={Icon}
                tone="critical"
                onExpand={(src, text) => setLightbox({ src, text })}
              />
            ))}
          </div>
        </section>
      </main>

      <Dialog open={lightbox !== null} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="max-w-2xl overflow-hidden p-0">
          {lightbox && (
            <>
              <img src={lightbox.src} alt="" className="max-h-[70vh] w-full object-contain bg-muted" />
              <p className="p-4 text-sm text-foreground">{lightbox.text}</p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
