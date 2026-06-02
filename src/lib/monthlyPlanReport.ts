import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getCluster } from "@/data/clusters";
import {
  CONNECT_STRATEGY_LABEL,
  generateActionPlan,
  getLocalCampaignSuggestions,
  type ActionLink,
  type ConnectStrategy,
  type StrategyAnswers,
} from "@/lib/strategyContent";

type Args = {
  focusClusterIds: string[];
  strategyByCluster: Record<string, ConnectStrategy>;
  answersByCluster: Record<string, StrategyAnswers>;
};

function normalisePdfText(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/→/g, "-")
    .replace(/•/g, "-")
    .replace(/·/g, "-")
    .replace(/…/g, "...");
}

function actionLinkReference(link: ActionLink): string {
  if (link.kind === "deck") {
    const filename = link.deckTitle ?? "JK-placeholder-deck.pptx";
    return `${link.label}: https://example.com/${filename}`;
  }
  return link.label;
}

export function generateMonthlyEngagementPlanPdf({
  focusClusterIds,
  strategyByCluster,
  answersByCluster,
}: Args) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  // Header band
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Monthly Cluster Engagement Plan - June 2026", margin, 35);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    `Generated ${new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}`,
    margin,
    54,
  );
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("DG: Sunil Kumar", pageWidth - margin, 30, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text("Area: Panvel", pageWidth - margin, 46, { align: "right" });
  doc.setTextColor(15, 23, 42);
  y = 110;

  let sectionIndex = 0;
  const heading = (text: string) => {
    if (y > 760) { doc.addPage(); y = margin; }
    if (sectionIndex > 0) {
      y += 18;
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
    if (y + h > 780) { doc.addPage(); y = margin; }
  };

  const wrapped = (text: string, indent = 0, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    const safeText = normalisePdfText(text);
    const lines = doc.splitTextToSize(safeText, pageWidth - margin * 2 - indent);
    ensureSpace(lines.length * 12 + 4);
    doc.text(lines, margin + indent, y);
    y += lines.length * 12;
    doc.setFont("helvetica", "normal");
  };

  /* ===== Focus clusters selected for engagement ===== */
  heading("Focus on these clusters");
  if (focusClusterIds.length === 0) {
    doc.setTextColor(120);
    doc.text("No clusters selected for this month.", margin, y);
    doc.setTextColor(15, 23, 42);
    y += 20;
  } else {
    autoTable(doc, {
      startY: y,
      head: [["Cluster", "Connect strategy"]],
      body: focusClusterIds.map((id) => {
        const c = getCluster(id);
        const s = strategyByCluster[id];
        return [c?.name ?? id, s ? CONNECT_STRATEGY_LABEL[s] : "-"];
      }),
      headStyles: { fillColor: [15, 23, 42] },
      margin: { left: margin, right: margin },
      styles: { fontSize: 10, cellPadding: 6 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 16;
  }

  /* ===== Per-cluster cards ===== */
  heading("Design the connect strategy & execute the action plan");

  for (const clusterId of focusClusterIds) {
    const cluster = getCluster(clusterId);
    if (!cluster) continue;
    const strategy = strategyByCluster[clusterId];
    const answers = answersByCluster[clusterId] ?? {};
    const assessment = assessments[clusterId];
    const profile = getRevenueProfile(clusterId);
    const cycle = getCycle(clusterId);
    const cstate = clusterStates[clusterId];

    const prospectCount = assessment?.prospectCountOverride ?? cstate?.prospects.length ?? cluster.prospectCountEstimate;
    const avgRev = assessment?.avgRevenueOverride ?? profile.avgRevenuePerProspect;
    const totalRev = prospectCount * avgRev;
    const months = assessment?.cycleMonths ?? cycle.months;
    const plural = prospectPlural(clusterId).toLowerCase();
    const singular = prospectSingular(clusterId).toLowerCase();

    ensureSpace(80);
    y += 6;
    doc.setFontSize(12);
    wrapped(cluster.name, 0, true);
    doc.setFontSize(10);

    /* Cluster potential snapshot */
    wrapped("Cluster potential snapshot:", 0, true);
    const facts: string[] = [
      `${prospectCount} ${plural} in cluster`,
      `Avg. revenue / ${singular}: ${formatRupees(avgRev)}`,
      `Total cluster revenue potential: ${formatRupees(totalRev)}`,
      `Avg. cycle time: ${months} months`,
    ];
    if (assessment?.accessRank) facts.push(`Access ranking: ${assessment.accessRank}`);
    if (assessment?.revenueRating) facts.push(`Revenue potential rating: ${HML_LABEL[assessment.revenueRating]}`);
    if (assessment?.cycleEase) facts.push(`Cycle-time rating: ${HML_LABEL[assessment.cycleEase]}`);
    facts.forEach((f) => wrapped(`• ${f}`, 12));

    if (assessment?.brandPresence && Object.keys(assessment.brandPresence).length > 0) {
      y += 2;
      wrapped("Competitor presence in cluster:", 0, true);
      Object.entries(assessment.brandPresence).forEach(([brand, lvl]) => {
        if (lvl) wrapped(`• ${brand}: ${HML_LABEL[lvl]}`, 12);
      });
    }

    y += 4;
    wrapped("Market context:", 0, true);
    cluster.potentialReasons.slice(0, 2).forEach((r) => wrapped(`• ${r}`, 12));

    y += 6;
    if (!strategy) {
      doc.setTextColor(120);
      wrapped("No connect strategy selected for this cluster.", 0);
      doc.setTextColor(15, 23, 42);
      y += 4;
      continue;
    }

    wrapped(`Connect strategy: ${CONNECT_STRATEGY_LABEL[strategy]}`, 0, true);
    y += 2;

    /* Strategy inputs */
    const inputs: string[] = [];
    if (strategy === "BRAND") {
      if (answers.runLocalCampaigns) inputs.push(`Run local campaigns: ${answers.runLocalCampaigns === "Y" ? "Yes" : "No"}`);
      const sel = answers.selectedCampaigns ?? [];
      const suggestions = getLocalCampaignSuggestions(clusterId);
      if (sel.length > 0) {
        inputs.push(`Selected campaigns:`);
        sel.forEach((s) => inputs.push(`   – ${s}`));
      } else if (answers.runLocalCampaigns === "Y") {
        inputs.push(`Suggested campaigns (none picked yet):`);
        suggestions.slice(0, 3).forEach((s) => inputs.push(`   – ${s}`));
      }
    }
    if (strategy === "CONTRACTOR") {
      if (answers.knowsContractors) inputs.push(`Already knows contractors: ${answers.knowsContractors === "Y" ? "Yes" : "No"}`);
      const cts = answers.contractors ?? [];
      if (cts.length > 0) {
        inputs.push("Contractors on file:");
        cts.forEach((c) =>
          inputs.push(`   – ${c.name || "Unnamed"}${c.phone ? ` · ${c.phone}` : ""}${c.area ? ` · ${c.area}` : ""}`),
        );
      }
    }
    if (strategy === "OUTREACH") {
      if (answers.hasCommunityTouchpoint) inputs.push(`Community touchpoint: ${answers.hasCommunityTouchpoint === "Y" ? "Yes" : "No"}`);
      const cc = answers.communityContacts ?? [];
      if (cc.length > 0) {
        inputs.push("Community contacts:");
        cc.forEach((c) =>
          inputs.push(`   – ${c.name || "Unnamed"}${c.phone ? ` · ${c.phone}` : ""}${c.area ? ` · ${c.area}` : ""}`),
        );
      }
      if (answers.consideredContributionEvents) inputs.push(`Considered contribution events: ${answers.consideredContributionEvents === "Y" ? "Yes" : "No"}`);
      const ts = answers.selectedEventTopics ?? [];
      if (ts.length > 0) {
        inputs.push("Selected events:");
        ts.forEach((t) => inputs.push(`   – ${t}`));
      }
    }
    if (strategy === "D2C") {
      if (answers.wantsDirectReach) inputs.push(`Direct end-customer reach: ${answers.wantsDirectReach === "Y" ? "Yes" : "No"}`);
      const ch = answers.d2cChannels ?? [];
      if (ch.length > 0) {
        inputs.push("Channels:");
        ch.forEach((c) => inputs.push(`   – ${c}`));
      }
    }
    if (inputs.length > 0) {
      wrapped("Inputs captured:", 0, true);
      inputs.forEach((f) => wrapped(`• ${f}`, 12));
      y += 4;
    }

    wrapped("Action plan:", 0, true);
    const steps = generateActionPlan(clusterId, strategy, answers);
    steps.forEach((s, i) => {
      wrapped(`${i + 1}. ${s.text}`, 12);
      if (s.link) {
        const ref =
          s.link.kind === "deck"
            ? `${s.link.label} → ${s.link.deckTitle}`
            : s.link.label;
        doc.setTextColor(180, 38, 38);
        wrapped(`→ ${ref}`, 24);
        doc.setTextColor(15, 23, 42);
      }
    });
    y += 10;
  }

  /* Footer */
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `JK Cement · Monthly Cluster Engagement Plan · Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 20,
      { align: "center" },
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  doc.save(`JK-Monthly-Cluster-Engagement-Plan-${today}.pdf`);
}
