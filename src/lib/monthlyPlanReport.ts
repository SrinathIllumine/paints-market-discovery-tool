// jsPDF is imported dynamically inside the generator to keep it out of the
// SSR bundle (it touches `window`/`self` at module load and crashes on
// Cloudflare Workers).
import { getCluster } from "@/data/clusters";
import { getValuePropsForGroup, type ContactEntry } from "@/lib/strategyContent";

type CustomerGroupOut = { id: string; label: string; pct: number; valueProps: string[] };
type CampOut = { id: string; label: string; starred: boolean; review?: Record<string, string> };
type ContactOut = ContactEntry & { starred?: boolean };

type Args = {
  focusClusterId: string;
  valueProps: string[];
  customerGroups: CustomerGroupOut[];
  camps: CampOut[];
  contractors: ContactOut[];
  retailers: ContactOut[];
  stakeholders: ContactOut[];
  groupReview?: {
    contractors?: Record<string, string>;
    retailers?: Record<string, string>;
    stakeholders?: Record<string, string>;
  };
  campEnablers?: Record<string, string[]>;
  contractorEnablers?: string[];
  retailerEnablers?: string[];
  stakeholderEnablers?: string[];
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

export async function generateMonthlyEngagementPlanPdf({
  focusClusterId,
  valueProps,
  customerGroups,
  camps,
  contractors,
  retailers,
  stakeholders,
  groupReview,
  campEnablers,
  contractorEnablers,
  retailerEnablers,
  stakeholderEnablers,
}: Args) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Quarterly Cluster Engagement Plan", margin, 35);
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

  const ensureSpace = (h: number) => {
    if (y + h > 780) {
      doc.addPage();
      y = margin;
    }
  };

  const heading = (text: string) => {
    ensureSpace(40);
    y += 4;
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

  const subheading = (text: string) => {
    ensureSpace(20);
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(normalisePdfText(text), margin, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  };

  const wrapped = (text: string, indent = 0, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    const safe = normalisePdfText(text);
    const lines = doc.splitTextToSize(safe, pageWidth - margin * 2 - indent);
    ensureSpace(lines.length * 12 + 4);
    doc.text(lines, margin + indent, y);
    y += lines.length * 12;
    doc.setFont("helvetica", "normal");
  };

  const cluster = getCluster(focusClusterId);

  // Customer groups + their value propositions (mirrors on-screen action plan)
  if (customerGroups.length > 0) {
    heading("Customer groups and their value propositions");
    for (const g of customerGroups) {
      subheading(`${g.label}  (${g.pct}%)`);
      const props = g.valueProps.length > 0 ? g.valueProps : getValuePropsForGroup(focusClusterId, g.id);
      for (const p of props) wrapped(`- ${p}`, 12);
      y += 4;
    }
  }

  // Cluster-level value props (if any extra)
  {
    /*if (valueProps.length > 0) {
    heading("Cluster-level value propositions");
    for (const vp of valueProps) wrapped(`- ${vp}`, 0);
    y += 4;
  }*/
  }

  // Action plan — mirrors the on-screen table: star + action + enablers
  heading("Action plan");

  const tableX = margin;
  const tableWidth = pageWidth - margin * 2;
  const colStar = 30;
  const colEnablers = 160;
  const colAction = tableWidth - colStar - colEnablers;
  const cellPad = 6;
  const lineH = 11;

  const drawSectionDivider = (label: string) => {
    ensureSpace(20);
    doc.setFillColor(241, 245, 249);
    doc.rect(tableX, y, tableWidth, 16, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(normalisePdfText(label), tableX + cellPad, y + 11);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  };

  const drawTableHeaderRow = () => {
    ensureSpace(22);
    doc.setFillColor(15, 23, 42);
    doc.rect(tableX, y, tableWidth, 18, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Action", tableX + colStar + cellPad, y + 12);
    doc.text("Enablers", tableX + colStar + colAction + cellPad, y + 12);
    y += 18;
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  };

  const drawTableRow = (title: string, sub: string | undefined, starred: boolean, enablers?: string[]) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    const titleLines = doc.splitTextToSize(normalisePdfText(title), colAction - cellPad * 2);
    const subLines = sub ? doc.splitTextToSize(normalisePdfText(sub), colAction - cellPad * 2) : [];
    const enablerLines =
      enablers && enablers.length > 0
        ? enablers.flatMap((e) => doc.splitTextToSize(normalisePdfText(e), colEnablers - cellPad * 2))
        : [];

    const actionHeight = titleLines.length * lineH + subLines.length * (lineH - 2) + cellPad * 2;
    const enablersHeight = enablerLines.length * lineH + cellPad * 2;
    const rowHeight = Math.max(actionHeight, enablersHeight, 24);

    ensureSpace(rowHeight);
    doc.setDrawColor(230);
    doc.rect(tableX, y, tableWidth, rowHeight);
    doc.line(tableX + colStar, y, tableX + colStar, y + rowHeight);
    doc.line(tableX + colStar + colAction, y, tableX + colStar + colAction, y + rowHeight);

    const starCx = tableX + colStar / 2;
    const starCy = y + rowHeight / 2;
    if (starred) {
      doc.setFillColor(245, 158, 11);
      doc.circle(starCx, starCy, 3, "F");
    } else {
      doc.setDrawColor(180);
      doc.circle(starCx, starCy, 3, "S");
    }

    let ty = y + cellPad + 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(titleLines, tableX + colStar + cellPad, ty);
    ty += titleLines.length * lineH;
    if (subLines.length > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 110, 120);
      doc.text(subLines, tableX + colStar + cellPad, ty);
    }

    if (enablerLines.length > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(enablerLines, tableX + colStar + colAction + cellPad, y + cellPad + 8);
    }

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    y += rowHeight;
  };

  drawTableHeaderRow();

  if (camps.length > 0) {
    drawSectionDivider("Events & camps");
    for (const c of camps) {
      drawTableRow(c.label, undefined, c.starred, campEnablers?.[c.id]);
    }
  }

  const validContractors = contractors.filter((c) => (c.name ?? "").trim());
  if (validContractors.length > 0) {
    drawSectionDivider("Contractors");
    const grpStar = validContractors.some((c) => c.starred);
    const sub = validContractors
      .map((c) => c.name)
      .filter(Boolean)
      .join(", ");
    drawTableRow("Contractors to convert", sub, grpStar, contractorEnablers);
  }

  const validRetailers = retailers.filter((c) => (c.name ?? "").trim());
  if (validRetailers.length > 0) {
    drawSectionDivider("Retailers");
    const grpStar = validRetailers.some((c) => c.starred);
    const sub = validRetailers
      .map((c) => c.name)
      .filter(Boolean)
      .join(", ");
    drawTableRow("Retailers who can connect", sub, grpStar, retailerEnablers);
  }

  const validStakeholders = stakeholders.filter((c) => (c.name ?? "").trim());
  if (validStakeholders.length > 0) {
    drawSectionDivider("Stakeholders");
    const grpStar = validStakeholders.some((c) => c.starred);
    const sub = validStakeholders
      .map((c) => c.name)
      .filter(Boolean)
      .join(", ");
    drawTableRow("Stakeholders to meet directly", sub, grpStar, stakeholderEnablers);
  }

  y += 6;
  wrapped("[Priority] = starred for this quarter", 0);

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `JK Cement - Quarterly Cluster Engagement Plan - Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 20,
      { align: "center" },
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  doc.save(`JK-Quarterly-Cluster-Engagement-Plan-${today}.pdf`);
}
