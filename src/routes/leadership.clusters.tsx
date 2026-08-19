import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { LeadershipLayout } from "@/components/leadership/LeadershipLayout";
import { QUADRANT_TYPE_LABEL, formatCr, getClustersRankedByRevenue } from "@/lib/leadershipAnalytics";

export const Route = createFileRoute("/leadership/clusters")({
  head: () => ({
    meta: [
      { title: "Cluster-wise Market Overview — Leadership Analytics" },
      { name: "description", content: "Top clusters by revenue potential." },
    ],
  }),
  component: ClustersOverviewPage,
});

const PAGE_SIZE = 10;

function ClustersOverviewPage() {
  const rows = getClustersRankedByRevenue();
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pagedRows = rows.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  return (
    <LeadershipLayout>
      <Link to="/leadership" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-navy hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to matrix
      </Link>

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h1 className="font-display text-lg font-bold text-foreground">Top clusters by revenue potential</h1>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Sl. No</th>
                <th className="px-4 py-2">Cluster</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2 text-right">Revenue Potential</th>
                <th className="px-4 py-2 text-right">Access</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((r, i) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-2 tabular-nums text-muted-foreground">{(pageSafe - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="px-4 py-2 font-medium text-foreground">{r.name}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{QUADRANT_TYPE_LABEL[r.quadrant]}</td>
                  <td className="px-4 py-2 text-right font-semibold tabular-nums">{formatCr(r.revenuePotential)}</td>
                  <td className="px-4 py-2 text-right text-xs text-muted-foreground">{r.access}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={pageSafe <= 1}
            className="rounded border border-border px-2 py-1 disabled:opacity-40"
          >
            ← Previous
          </button>
          <span>
            Page {pageSafe} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={pageSafe >= totalPages}
            className="rounded border border-border px-2 py-1 disabled:opacity-40"
          >
            Next page →
          </button>
        </div>
      </div>
    </LeadershipLayout>
  );
}
