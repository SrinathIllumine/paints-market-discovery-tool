import jsPDF from "jspdf";
import { getCluster } from "@/data/clusters";
import {
  CONNECT_STRATEGY_LABEL,
  MARKET_ENGAGEMENT_OPTIONS,
  getRecommendedActions,
  type ConnectStrategy,
  type ContactEntry,
} from "@/lib/strategyContent";

type EventEstimate = { participants?: number; contractors?: number };

type Args = {
  focusClusterId: string;
  valueProposition: string;
  strategies: ConnectStrategy[];
  strategyItems: Partial<Record<ConnectStrategy, string[]>>;
  strategyContacts: Partial<Record<ConnectStrategy, ContactEntry[]>>;
  selectedActions: Partial<Record<ConnectStrategy, string[]>>;
  customActions: Partial<Record<ConnectStrategy, string[]>>;
  marketSelected?: string[];
  eventEstimates?: Record<string, EventEstimate>;
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

export function generateMonthlyEngagementPlanPdf({
  focusClusterId, valueProposition, strategies, strategyItems, strategyContacts,
  selectedActions, customActions, marketSelected = [], eventEstimates = {},
}: Args) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

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
    margin, 54,
  );
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("DG: Sunil Kumar", pageWidth - margin, 30, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text("Area: Panvel", pageWidth - margin, 46, { align: "right" });
  doc.setTextColor(15, 23, 42);
  y = 110;

  const ensureSpace = (h: number) => {
    if (y + h > 780) { doc.addPage(); y = margin; }
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
    const safeText = normalisePdfText(text);
    const lines = doc.splitTextToSize(safeText, pageWidth - margin * 2 - indent);
    ensureSpace(lines.length * 12 + 4);
    doc.text(lines, margin + indent, y);
    y += lines.length * 12;
    doc.setFont("helvetica", "normal");
  };

  const cluster = getCluster(focusClusterId);

  heading("Focus cluster");
  wrapped(cluster?.name ?? focusClusterId, 0, true);
  y += 6;

  // Value proposition — only show if selected
  if (valueProposition && valueProposition.trim()) {
    heading("Value proposition");
    wrapped(valueProposition, 0);
    y += 6;
  }

  // Market engagement events — only if user picked any
  const chosenEvents = MARKET_ENGAGEMENT_OPTIONS.filter((m) => marketSelected.includes(m.id));
  if (chosenEvents.length > 0) {
    heading("Market engagement events");
    for (const ev of chosenEvents) {
      wrapped(`- ${ev.label}  [${ev.category}]`, 0, true);
      const est = eventEstimates[ev.id];
      if (est && (est.participants != null || est.contractors != null)) {
        wrapped(
          `Estimate - Participants: ${est.participants ?? "-"}, Contractors: ${est.contractors ?? "-"}`,
          12,
        );
      }
    }
    y += 6;
  }

  // Customer engagement strategies — only if any selected
  if (strategies.length > 0) {
    heading("Customer engagement strategies");
    for (const s of strategies) {
      const items = strategyItems[s] ?? [];
      const contacts = strategyContacts[s] ?? [];
      if (items.length === 0 && contacts.length === 0) {
        wrapped(CONNECT_STRATEGY_LABEL[s], 0, true);
        wrapped("(no sub-items captured)", 12);
        y += 4;
        continue;
      }
      ensureSpace(40);
      wrapped(CONNECT_STRATEGY_LABEL[s], 0, true);
      for (const it of items) wrapped(`- ${it}`, 12);
      if (contacts.length > 0) {
        wrapped("Contacts:", 12, true);
        for (const c of contacts) {
          const line = [c.name, c.phone, c.area, c.role, c.brandPreference].filter(Boolean).join(" - ");
          if (line) wrapped(`- ${line}`, 18);
        }
      }
      y += 4;
    }
    y += 6;
  }

  // Action plan — only render strategies that have selected/custom actions
  const actionStrategies = strategies.filter((s) => {
    const sel = selectedActions[s] ?? [];
    const cust = customActions[s] ?? [];
    return sel.length > 0 || cust.length > 0;
  });
  if (actionStrategies.length > 0) {
    heading("Action plan");
    for (const s of actionStrategies) {
      const sel = selectedActions[s] ?? [];
      const cust = customActions[s] ?? [];
      const recommended = getRecommendedActions(s, focusClusterId);
      ensureSpace(30);
      wrapped(CONNECT_STRATEGY_LABEL[s], 0, true);
      let idx = 1;
      for (const a of sel) {
        wrapped(`${idx}. ${a}`, 12);
        const assets = recommended.find((r) => r.text === a)?.assets ?? [];
        for (const asset of assets) {
          wrapped(`- Resource: ${asset.label}`, 24);
        }
        idx++;
      }
      for (const a of cust) {
        wrapped(`${idx}. ${a} (added by you)`, 12);
        idx++;
      }
      y += 4;
    }
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `JK Cement - Monthly Cluster Engagement Plan - Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 20,
      { align: "center" },
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  doc.save(`JK-Monthly-Cluster-Engagement-Plan-${today}.pdf`);
}
