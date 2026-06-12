import jsPDF from "jspdf";
import { getCluster } from "@/data/clusters";
import {
  getClusterIntel,
  getCompetitiveInsights,
  getEaseInsights,
  getRevenueProfile,
  getRepaintingCycleYears,
  scoreRevenue,
  scoreToHML,
  formatRupees,
  type HML,
} from "@/lib/clusterScoring";
import { groupIntoRegions } from "@/lib/regions";
import type { Prospect } from "@/store/appStore";

type Args = {
  clusterId: string;
  prospects: Prospect[];
  accessHML: HML;
  potentialScore: number;
  accessRollupScore: number;
  dgName?: string;
  area?: string;
};

const HML_FULL: Record<HML, string> = { H: "High", M: "Medium", L: "Low" };

function clean(t: string): string {
  return (
    t
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/[•·]/g, "-")
      .replace(/→/g, "->")
      .replace(/…/g, "...")
      // strip any remaining non-Latin1 chars jsPDF helvetica can't render
      .replace(/[^\x00-\xFF]/g, "")
  );
}

export function generateClusterReportPdf({
  clusterId,
  prospects,
  accessHML,
  potentialScore,
  accessRollupScore,
  dgName = "Sunil Kumar",
  area = "Panvel",
}: Args) {
  const cluster = getCluster(clusterId);
  if (!cluster) return;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  // Header band
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 84, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(clean(`Cluster Report for ${cluster.name}`), margin, 36);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    clean(
      `Generated ${new Date().toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}`,
    ),
    margin,
    56,
  );
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(clean(`DG: ${dgName}`), pageWidth - margin, 36, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text(clean(`Area: ${area}`), pageWidth - margin, 56, { align: "right" });
  doc.setTextColor(15, 23, 42);
  y = 120;

  const ensureSpace = (h: number) => {
    if (y + h > pageHeight - 40) {
      doc.addPage();
      y = margin;
    }
  };

  const heading = (text: string) => {
    ensureSpace(36);
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(clean(text), margin, y);
    y += 6;
    doc.setDrawColor(220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  };

  const para = (text: string, indent = 0, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(clean(text), pageWidth - margin * 2 - indent);
    ensureSpace(lines.length * 12 + 4);
    doc.text(lines, margin + indent, y);
    y += lines.length * 12;
    doc.setFont("helvetica", "normal");
  };

  const bullet = (text: string) => para(`- ${text}`, 10);

  // ── 1. Overview ─────────────────────────────────────────────
  const intel = getClusterIntel(clusterId, prospects.length);
  const observedCount = intel.totalProspectsObserved || prospects.length || cluster.prospectCountEstimate;
  const regions = groupIntoRegions(prospects);

  heading("Cluster Overview");
  para(`Cluster nature: ${cluster.nature}`);
  para(`${cluster.description}`);
  y += 4;
  para(`Total prospects in this cluster: ${observedCount}`, 0, true);
  y += 4;
  para("Prospects by region:", 0, true);
  if (regions.length === 0) {
    bullet("No prospects discovered yet in this cluster.");
  } else {
    for (const r of regions) {
      bullet(`${r.label}: ${r.prospects.length}`);
    }
  }
  y += 6;

  // ── 2. Cluster scores ───────────────────────────────────────
  const profile = getRevenueProfile(clusterId);
  const cycleYears = getRepaintingCycleYears(clusterId);
  const annualRevenue = (profile.avgRevenuePerProspect * observedCount) / cycleYears;
  const annualPerProspect = profile.avgRevenuePerProspect / cycleYears;
  const revenueHML: HML = scoreToHML(scoreRevenue(annualPerProspect));

  const competitiveInsights = getCompetitiveInsights(clusterId).slice(0, 2);
  const easeInsights = getEaseInsights(clusterId);

  heading("Cluster Snapshot");

  const block = (title: string, hml: HML, lines: string[]) => {
    para(`${title}: ${HML_FULL[hml]}`, 0, true);
    for (const l of lines) bullet(l);
    y += 4;
  };

  block("Revenue Potential", revenueHML, [
    `There are ${observedCount} prospects present in this cluster.`,
    `National average revenue per prospect: ${formatRupees(profile.avgRevenuePerProspect)}.`,
    `Typical repainting cycle: ${cycleYears} year${cycleYears === 1 ? "" : "s"}.`,
    `Total annual cluster revenue potential: ${formatRupees(annualRevenue)}.`,
  ]);

  block(
    "Competitive Strength",
    intel.competitiveHML,
    competitiveInsights.length > 0
      ? competitiveInsights
      : ["Competitive intelligence not yet captured for this cluster."],
  );

  block("Access Level", accessHML, [
    `There are ${intel.contractorCount} contractors dominating this cluster.`,
    `There are ${intel.retailerCount} retailers operating within this cluster.`,
  ]);

  block(
    "Ease of Sale",
    intel.easeHML,
    easeInsights.length > 0 ? easeInsights : ["Ease-of-sale intelligence not yet captured for this cluster."],
  );

  // ── 3. Strategic insights ───────────────────────────────────
  const highPotential = potentialScore >= 5;
  const highAccess = accessRollupScore >= 5;
  const positionLabel =
    highPotential && highAccess
      ? "High Potential / High Access"
      : highPotential && !highAccess
        ? "High Potential / Low Access"
        : !highPotential && highAccess
          ? "Low Potential / High Access"
          : "Low Potential / Low Access";

  const strategicPoints =
    highPotential && highAccess
      ? [
          "This cluster already has high potential and you have strong access into it.",
          "Plan contribution events with your ASM to penetrate more deeply into the cluster.",
          "Prioritise this cluster for value-proposition led engagement in the coming month.",
        ]
      : highPotential && !highAccess
        ? [
            "This cluster has high potential but your connect level here is low.",
            "Create a plan in the next stage to increase your connects with contractors, site supervisors, etc.",
            "Conduct more on-site visits to engage additional touchpoints.",
          ]
        : !highPotential && highAccess
          ? [
              "You have strong access into this cluster even though the overall potential is low.",
              "Make use of your connects to conduct events and maximise the available potential.",
              "Use this cluster to test new propositions before scaling into higher-potential clusters.",
            ]
          : [
              "Both the potential and your access into this cluster are low.",
              "Do not prioritise this cluster as part of your engagement plans.",
              "Revisit only after higher-priority clusters show diminishing returns.",
            ];

  heading("Strategic Insights");
  para(`Cluster position: ${positionLabel}`, 0, true);
  y += 2;
  for (const p of strategicPoints) bullet(p);

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      clean(`JK Cement - Cluster Report - ${cluster.name} - Page ${i} of ${pageCount}`),
      pageWidth / 2,
      pageHeight - 20,
      { align: "center" },
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const safeName = cluster.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  doc.save(`JK-Cluster-Report-${safeName}-${today}.pdf`);
}

I'm getting build failed error 