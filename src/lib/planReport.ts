import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CLUSTERS, getCluster, POTENTIAL_LABEL } from "@/data/clusters";
import type { PlanEvent, Readiness, Stakeholder } from "@/store/appStore";

type Args = {
  targetClusterIds: string[];
  events: PlanEvent[];
  readiness: Readiness;
  stakeholders: Record<string, Stakeholder[]>;
};

const READINESS_LABEL: Record<string, string> = {
  Y: "Yes",
  N: "No",
  P: "Partial",
};

export function generatePlanReportPdf({
  targetClusterIds,
  events,
  readiness,
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
  doc.text("Outreach plan for June 2026", margin, 35);
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
  // Top-right DG name and Area
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("DG: Sunil Kumar", pageWidth - margin, 30, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text("Area: Panvel", pageWidth - margin, 46, { align: "right" });
  doc.setTextColor(15, 23, 42);
  y = 100;

  // Section helper — draws a divider line above each section heading
  let sectionIndex = 0;
  const heading = (text: string) => {
    if (y > 760) {
      doc.addPage();
      y = margin;
    }
    if (sectionIndex > 0) {
      y += 16;
      doc.setDrawColor(180);
      doc.setLineWidth(0.75);
      doc.line(margin, y - 6, pageWidth - margin, y - 6);
      y += 20;
    }
    sectionIndex++;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(text, margin, y);
    y += 8;
    doc.setDrawColor(220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  };

  // Target clusters
  heading("Target clusters selected");
  if (targetClusterIds.length === 0) {
    doc.setTextColor(120);
    doc.text("No target clusters selected.", margin, y);
    doc.setTextColor(15, 23, 42);
    y += 20;
  } else {
    const rows = targetClusterIds.map((id) => {
      const c = getCluster(id);
      return [
        c?.name ?? id,
        c ? POTENTIAL_LABEL[c.potential] : "—",
        String(stakeholders[id]?.length ?? 0),
      ];
    });
    autoTable(doc, {
      startY: y,
      head: [["Cluster", "Potential", "Contacts"]],
      body: rows,
      headStyles: { fillColor: [15, 23, 42] },
      margin: { left: margin, right: margin },
      styles: { fontSize: 10 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;
  }

  // How to connect
  heading("Connect Approaches Finalized");
  if (targetClusterIds.length === 0) {
    doc.setTextColor(120);
    doc.text("Select clusters to see strategies.", margin, y);
    doc.setTextColor(15, 23, 42);
    y += 20;
  } else {
    for (const id of targetClusterIds) {
      const c = getCluster(id);
      if (!c) continue;
      if (y > 740) {
        doc.addPage();
        y = margin;
      }
      doc.setFont("helvetica", "bold");
      doc.text(c.name, margin, y);
      y += 14;
      doc.setFont("helvetica", "normal");
      for (const h of c.howToConnect.slice(0, 3)) {
        const lines = doc.splitTextToSize(`• ${h}`, pageWidth - margin * 2 - 10);
        if (y + lines.length * 12 > 780) {
          doc.addPage();
          y = margin;
        }
        doc.text(lines, margin + 8, y);
        y += lines.length * 12;
      }
      y += 8;
    }
  }

  // Events
  heading("Contribution events planned");
  if (events.length === 0) {
    doc.setTextColor(120);
    doc.text("No events planned.", margin, y);
    doc.setTextColor(15, 23, 42);
    y += 20;
  } else {
    for (const e of events) {
      const clusterName = getCluster(e.clusterId)?.name ?? e.clusterId;
      const topic = e.topic || e.type;
      const topicLines = doc.splitTextToSize(topic, pageWidth - margin * 2);
      const noteLines = e.note ? doc.splitTextToSize(`Note: ${e.note}`, pageWidth - margin * 2 - 10) : [];
      const blockHeight = topicLines.length * 14 + 14 + (noteLines.length ? noteLines.length * 12 + 4 : 0) + 10;
      if (y + blockHeight > 780) {
        doc.addPage();
        y = margin;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(topicLines, margin, y);
      y += topicLines.length * 14;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(90);
      const sub = `${clusterName}  ·  ${e.type}${e.date ? `  ·  ${e.date}` : ""}`;
      doc.text(sub, margin, y);
      y += 12;
      doc.setTextColor(15, 23, 42);
      if (noteLines.length) {
        doc.setFontSize(9);
        doc.text(noteLines, margin + 8, y);
        y += noteLines.length * 12;
      }
      y += 8;
    }
    y += 6;
  }


  // Readiness
  heading("Service delivery readiness status");
  const fmt = (v: string | null | undefined) => (v ? READINESS_LABEL[v] ?? "—" : "—");
  autoTable(doc, {
    startY: y,
    head: [["Question", "Answer"]],
    body: [
      ["Are there enough retailers in this cluster?", fmt(readiness.retailers)],
      ["Do the retailers have enough stock available?", fmt(readiness.stock)],
      ["Are there enough painters / contractors in the area?", fmt(readiness.painters)],
    ],
    headStyles: { fillColor: [15, 23, 42] },
    margin: { left: margin, right: margin },
    styles: { fontSize: 10 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `JK Cement · Outreach Plan · Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 20,
      { align: "center" },
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  doc.save(`JK-Outreach-Plan-${today}.pdf`);
  void CLUSTERS;
}
