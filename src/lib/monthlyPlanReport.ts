import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getCluster, POTENTIAL_LABEL } from "@/data/clusters";
import type { Pathways } from "@/store/appStore";

export type PathwayPriority = {
  key: keyof Pathways;
  label: string;
  priority: number;
  rationale: string;
};

const PATHWAY_LABEL: Record<keyof Pathways, string> = {
  L1: "Personal connects (contractors / painters / contacts)",
  L2: "Collective / contribution events",
  L3: "Cold calling",
  L4: "Promotional activities (brochures, e-mails)",
};

/**
 * Dynamic prioritization:
 *  - L1 (warm connects) is always preferred if available.
 *  - L2 (events) ranks higher than L3 / L4 because it builds local goodwill.
 *  - L3 (cold calling) drops if L1 is also selected (since warm contacts exist).
 *  - L4 (promo) is supportive and ranks last.
 *  - Clusters with stakeholders push L1 even higher; clusters without contacts
 *    push L2 / L3 up so the DG has a way in.
 */
export function prioritizePathways(
  pathways: Pathways,
  stakeholderCount: number,
): PathwayPriority[] {
  const selected: PathwayPriority[] = [];
  if (pathways.L1) {
    selected.push({
      key: "L1",
      label: PATHWAY_LABEL.L1,
      priority: 1,
      rationale:
        stakeholderCount > 0
          ? `You already have ${stakeholderCount} contact${stakeholderCount === 1 ? "" : "s"}. Start with warm intros — fastest conversion.`
          : "Warm intros convert fastest. Map your contacts first.",
    });
  }
  if (pathways.L2) {
    selected.push({
      key: "L2",
      label: PATHWAY_LABEL.L2,
      priority: pathways.L1 ? 2 : 1,
      rationale:
        "Contribution events build trust at scale and surface new contacts.",
    });
  }
  if (pathways.L3) {
    selected.push({
      key: "L3",
      label: PATHWAY_LABEL.L3,
      priority: pathways.L1 ? 3 : pathways.L2 ? 3 : 2,
      rationale: pathways.L1
        ? "De-prioritised — exhaust warm connects before cold outreach."
        : "Volume play with lower conversion; useful when warm contacts are thin.",
    });
  }
  if (pathways.L4) {
    selected.push({
      key: "L4",
      label: PATHWAY_LABEL.L4,
      priority: 4,
      rationale: "Supports other pathways — pair with events or visits.",
    });
  }
  return selected.sort((a, b) => a.priority - b.priority);
}

type Args = {
  focusClusterIds: string[];
  valueProps: Record<string, string>;
  pathways: Record<string, Pathways>;
  stakeholders: Record<string, { id: string }[]>;
};

export function generateMonthlyEngagementPlanPdf({
  focusClusterIds,
  valueProps,
  pathways,
  stakeholders,
}: Args) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Monthly Engagement Plan for June 2026", margin, 35);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    `Generated ${new Date().toLocaleDateString(undefined, {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}`,
    margin,
    54,
  );
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("DG: Sunil Kumar", pageWidth - margin, 30, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text("Area: Panvel", pageWidth - margin, 46, { align: "right" });
  doc.setTextColor(15, 23, 42);
  y = 100;

  let sectionIndex = 0;
  const heading = (text: string) => {
    if (y > 760) {
      doc.addPage();
      y = margin;
    }
    if (sectionIndex > 0) {
      y += 20;
      doc.setDrawColor(180);
      doc.setLineWidth(0.75);
      doc.line(margin, y - 6, pageWidth - margin, y - 6);
      y += 22;
    }
    sectionIndex++;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(text, margin, y);
    y += 8;
    doc.setDrawColor(220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  };

  const ensureSpace = (h: number) => {
    if (y + h > 780) {
      doc.addPage();
      y = margin;
    }
  };

  const wrapped = (text: string, indent = 0) => {
    const lines = doc.splitTextToSize(text, pageWidth - margin * 2 - indent);
    ensureSpace(lines.length * 12 + 4);
    doc.text(lines, margin + indent, y);
    y += lines.length * 12;
  };

  // ===== Focus clusters
  heading("Focus clusters for this month");
  if (focusClusterIds.length === 0) {
    doc.setTextColor(120);
    doc.text("No clusters selected for this month.", margin, y);
    doc.setTextColor(15, 23, 42);
    y += 20;
  } else {
    autoTable(doc, {
      startY: y,
      head: [["Cluster", "Potential", "Pathways selected"]],
      body: focusClusterIds.map((id) => {
        const c = getCluster(id);
        const pw = pathways[id] ?? { L1: false, L2: false, L3: false, L4: false };
        const selected = (Object.keys(pw) as (keyof Pathways)[])
          .filter((k) => pw[k])
          .join(", ");
        return [c?.name ?? id, c ? POTENTIAL_LABEL[c.potential] : "—", selected || "—"];
      }),
      headStyles: { fillColor: [15, 23, 42] },
      margin: { left: margin, right: margin },
      styles: { fontSize: 10, cellPadding: 6 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  }

  // ===== Value propositions
  heading("Value proposition by cluster");
  if (focusClusterIds.length === 0) {
    doc.setTextColor(120);
    doc.text("Select clusters to capture value propositions.", margin, y);
    doc.setTextColor(15, 23, 42);
    y += 20;
  } else {
    for (const id of focusClusterIds) {
      const c = getCluster(id);
      if (!c) continue;
      ensureSpace(40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(c.name, margin, y);
      y += 14;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const vp = valueProps[id]?.trim();
      if (vp) {
        wrapped(vp, 8);
      } else {
        doc.setTextColor(140);
        wrapped("(no value proposition captured)", 8);
        doc.setTextColor(15, 23, 42);
      }
      y += 6;
    }
  }

  // ===== Prioritised pathways
  heading("Prioritised pathways (dynamic recommendation)");
  if (focusClusterIds.length === 0) {
    doc.setTextColor(120);
    doc.text("Select clusters and pathways to see recommendations.", margin, y);
    doc.setTextColor(15, 23, 42);
    y += 20;
  } else {
    for (const id of focusClusterIds) {
      const c = getCluster(id);
      if (!c) continue;
      const pw = pathways[id] ?? { L1: false, L2: false, L3: false, L4: false };
      const ranked = prioritizePathways(pw, stakeholders[id]?.length ?? 0);
      ensureSpace(40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(c.name, margin, y);
      y += 14;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      if (ranked.length === 0) {
        doc.setTextColor(140);
        wrapped("(no pathway selected)", 8);
        doc.setTextColor(15, 23, 42);
      } else {
        for (const r of ranked) {
          wrapped(`P${r.priority} — ${r.label}`, 8);
          doc.setTextColor(110);
          wrapped(r.rationale, 20);
          doc.setTextColor(15, 23, 42);
          y += 2;
        }
      }
      y += 6;
    }
  }

  // ===== 4-week execution plan
  heading("4-week execution plan");
  const clusterNames = focusClusterIds
    .map((id) => getCluster(id)?.name)
    .filter((n): n is string => Boolean(n));

  const writeWeek = (title: string, lines: string[]) => {
    ensureSpace(20 + lines.length * 14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(title, margin, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    for (const l of lines) {
      wrapped(l, 8);
    }
    y += 8;
  };

  if (clusterNames.length === 0) {
    doc.setTextColor(120);
    doc.text("Select clusters to generate the weekly plan.", margin, y);
    doc.setTextColor(15, 23, 42);
    y += 20;
  } else {
    writeWeek(
      `Week 1: Reach out to ${clusterNames.length} cluster${clusterNames.length === 1 ? "" : "s"} and learn about painting needs + build contact database for each`,
      clusterNames.map((n, i) => `${i + 1}. ${n}`),
    );

    // Week 2 & 3
    ensureSpace(24);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Week 2 & 3: Conduct workshops / campaigns for each cluster", margin, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    for (const id of focusClusterIds) {
      const c = getCluster(id);
      if (!c) continue;
      const pw = pathways[id] ?? { L1: false, L2: false, L3: false, L4: false };
      const ranked = prioritizePathways(pw, stakeholders[id]?.length ?? 0);
      ensureSpace(30);
      doc.setFont("helvetica", "bold");
      wrapped(`For ${c.name}:`, 8);
      doc.setFont("helvetica", "normal");
      const actions = activitiesForCluster(c.id, ranked);
      for (const a of actions) {
        wrapped(`• ${a}`, 20);
      }
      y += 6;
    }

    writeWeek("Week 4: Follow-up and measurement", [
      "Follow-up with participants of contribution events.",
      "Assess the increase in demand at outlets from the focus clusters.",
      "Capture insights and refresh contact database.",
    ]);
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `JK Cement · Monthly Engagement Plan · Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 20,
      { align: "center" },
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  doc.save(`JK-Monthly-Engagement-Plan-${today}.pdf`);
}

function activitiesForCluster(clusterId: string, ranked: PathwayPriority[]): string[] {
  const out: string[] = [];
  const has = (k: keyof Pathways) => ranked.some((r) => r.key === k);

  if (clusterId === "schools") {
    if (has("L2")) {
      out.push(
        "Knowledge Contribution — Conduct a workshop for school admins / principals on “How colourful exterior painting attracts new admissions.”",
      );
      out.push(
        "Service Contribution — Propose a quick audit of school premises to identify leakages and quick touch-ups.",
      );
      out.push(
        "Social Contribution — Propose a career-counselling session sponsored by JK (local career counsellor).",
      );
    }
  } else if (clusterId === "mid-apartments" || clusterId === "gated-community" || clusterId === "redevelopment") {
    if (has("L4")) {
      out.push(
        "Distribute ‘Waterproofing Diagnostic’ pamphlets via painters, site supervisors and retailers to home-owners in residential societies.",
      );
    }
    if (has("L2")) {
      out.push("Host a society-committee meet on monsoon-readiness and exterior coatings.");
    }
  }

  // Generic fallbacks based on pathways
  if (has("L1") && out.length === 0) {
    out.push("Activate personal connects (contractors / painters) to set up cluster walkthroughs.");
  }
  if (has("L3")) {
    out.push("Run a focused cold-calling sprint with the cluster contact database from Week 1.");
  }
  if (has("L4") && !out.some((o) => o.toLowerCase().includes("pamphlet") || o.toLowerCase().includes("brochure"))) {
    out.push("Send targeted brochure / e-mail campaign to decision makers in the cluster.");
  }
  if (out.length === 0) {
    out.push("Plan a cluster-specific awareness activity aligned to the selected pathways.");
  }
  return out;
}
