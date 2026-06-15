// jsPDF is imported dynamically inside the generator to keep it out of the
// SSR bundle (it touches `window`/`self` at module load and crashes on
// Cloudflare Workers).
import { getCluster } from "@/data/clusters";
import type { ContactEntry } from "@/lib/strategyContent";

type CustomerGroupOut = { id: string; label: string; pct: number };
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
    y += 6;
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

  heading("Focus cluster");
  wrapped(cluster?.name ?? focusClusterId, 0, true);
  y += 6;

  if (customerGroups.length > 0) {
    heading("Customer groups targeted");
    for (const g of customerGroups) wrapped(`- ${g.label} (${g.pct}%)`, 0);
    y += 6;
  }

  if (valueProps.length > 0) {
    heading("Value propositions");
    for (const vp of valueProps) wrapped(`- ${vp}`, 0);
    y += 6;
  }

  heading("Action plan");

  const starTag = (s: boolean) => (s ? " *" : "");
  const reviewLine = (rev?: Record<string, string>) => {
    if (!rev) return "";
    const entries = Object.entries(rev).filter(([, v]) => (v ?? "").toString().trim());
    if (entries.length === 0) return "";
    return entries.map(([k, v]) => `${k}: ${v}`).join("; ");
  };

  if (camps.length > 0) {
    wrapped("Camps / events planned:", 0, true);
    for (const c of camps) {
      wrapped(`- ${c.label}${starTag(c.starred)}`, 12);
      const r = reviewLine(c.review);
      if (r) wrapped(`Review — ${r}`, 24);
    }
    y += 4;
  }

  const validContractors = contractors.filter((c) => (c.name ?? "").trim());
  if (validContractors.length > 0) {
    const grpStar = validContractors.some((c) => c.starred);
    wrapped(`Contractors to be converted${grpStar ? " *" : ""}:`, 0, true);
    for (const c of validContractors) {
      const line = [c.name, c.phone, c.area, c.brandPreference].filter(Boolean).join(" - ");
      wrapped(`- ${line}`, 12);
    }
    const r = reviewLine(groupReview?.contractors);
    if (r) wrapped(`Review — ${r}`, 12);
    y += 4;
  }

  const validRetailers = retailers.filter((c) => (c.name ?? "").trim());
  if (validRetailers.length > 0) {
    const grpStar = validRetailers.some((c) => c.starred);
    wrapped(`Retailers who can connect${grpStar ? " *" : ""}:`, 0, true);
    for (const c of validRetailers) {
      const line = [c.name, c.phone, c.area, c.brandPreference].filter(Boolean).join(" - ");
      wrapped(`- ${line}`, 12);
    }
    const r = reviewLine(groupReview?.retailers);
    if (r) wrapped(`Review — ${r}`, 12);
    y += 4;
  }

  const validStakeholders = stakeholders.filter((c) => (c.name ?? "").trim());
  if (validStakeholders.length > 0) {
    const grpStar = validStakeholders.some((c) => c.starred);
    wrapped(`Stakeholders to reach out directly${grpStar ? " *" : ""}:`, 0, true);
    for (const c of validStakeholders) {
      const line = [c.name, c.phone, c.area, c.brandPreference].filter(Boolean).join(" - ");
      wrapped(`- ${line}`, 12);
    }
    const r = reviewLine(groupReview?.stakeholders);
    if (r) wrapped(`Review — ${r}`, 12);
    y += 4;
  }

  wrapped("* = prioritized for this quarter", 0);

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
