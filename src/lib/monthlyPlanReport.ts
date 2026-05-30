import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getCluster, POTENTIAL_LABEL } from "@/data/clusters";
import type {
  ConnectModel,
  Prospect,
  Stakeholder,
} from "@/store/appStore";
import {
  CONNECT_MODEL_LABEL,
  getRoadmapVariants,
} from "@/lib/roadmapContent";

type Args = {
  focusClusterIds: string[];
  prospectsByCluster: Record<string, Prospect[]>;
  connectModelByCluster: Record<string, ConnectModel>;
  stakeholders: Record<string, Stakeholder[]>;
};

export function generateMonthlyEngagementPlanPdf({
  focusClusterIds,
  prospectsByCluster,
  connectModelByCluster,
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
      y += 16;
      doc.setDrawColor(180);
      doc.setLineWidth(0.75);
      doc.line(margin, y - 6, pageWidth - margin, y - 6);
      y += 18;
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

  const ensureSpace = (h: number) => {
    if (y + h > 780) {
      doc.addPage();
      y = margin;
    }
  };

  const wrapped = (text: string, indent = 0, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    const lines = doc.splitTextToSize(text, pageWidth - margin * 2 - indent);
    ensureSpace(lines.length * 12 + 4);
    doc.text(lines, margin + indent, y);
    y += lines.length * 12;
    doc.setFont("helvetica", "normal");
  };

  // ===== Focus clusters overview
  heading("Focus clusters for this month");
  if (focusClusterIds.length === 0) {
    doc.setTextColor(120);
    doc.text("No clusters selected for this month.", margin, y);
    doc.setTextColor(15, 23, 42);
    y += 20;
  } else {
    autoTable(doc, {
      startY: y,
      head: [["Cluster", "Potential", "Connect model", "Prospects"]],
      body: focusClusterIds.map((id) => {
        const c = getCluster(id);
        const model = connectModelByCluster[id];
        const total = prospectsByCluster[id]?.length ?? 0;
        return [
          c?.name ?? id,
          c ? POTENTIAL_LABEL[c.potential] : "—",
          model ? `${model} · ${CONNECT_MODEL_LABEL[model]}` : "—",
          String(total),
        ];
      }),
      headStyles: { fillColor: [15, 23, 42] },
      margin: { left: margin, right: margin },
      styles: { fontSize: 10, cellPadding: 6 },
    });
    y =
      (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
        .finalY + 12;
  }

  // ===== Per-cluster roadmap (value prop + action plan)
  for (const clusterId of focusClusterIds) {
    const cluster = getCluster(clusterId);
    if (!cluster) continue;
    const model = connectModelByCluster[clusterId];

    heading(cluster.name);

    if (!model) {
      doc.setTextColor(120);
      wrapped("No connect model selected for this cluster.", 0);
      doc.setTextColor(15, 23, 42);
      continue;
    }

    wrapped(
      `Connect model: ${model} — ${CONNECT_MODEL_LABEL[model]}`,
      0,
      true,
    );
    y += 4;

    const variants = getRoadmapVariants(clusterId, model);

    variants.forEach((v, i) => {
      ensureSpace(40);
      const roman = ["i", "ii", "iii", "iv"][i] ?? `${i + 1}`;
      doc.setFontSize(11);
      wrapped(`${roman}) ${v.audience}`, 0, true);
      doc.setFontSize(10);

      wrapped("Value proposition:", 12, true);
      v.valueProps.forEach((vp) => wrapped(`• ${vp}`, 24));

      y += 2;
      wrapped("Action plan:", 12, true);
      v.actions.forEach((a, idx) => wrapped(`${idx + 1}. ${a}`, 24));
      y += 6;
    });

    // Prospect list (if any) — concise table
    const prospects = prospectsByCluster[clusterId] ?? [];
    if (prospects.length > 0) {
      ensureSpace(40);
      wrapped("Prospects identified in this cluster:", 0, true);
      autoTable(doc, {
        startY: y + 2,
        head: [["#", "Name", "Locality"]],
        body: prospects.map((p, i) => [
          String(i + 1),
          p.name,
          p.locality ?? "—",
        ]),
        headStyles: { fillColor: [15, 23, 42] },
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 5 },
        columnStyles: {
          0: { cellWidth: 30, halign: "center" },
        },
      });
      y =
        (doc as unknown as { lastAutoTable: { finalY: number } })
          .lastAutoTable.finalY + 10;
    }
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
