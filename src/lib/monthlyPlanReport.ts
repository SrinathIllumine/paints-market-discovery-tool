import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  getCluster,
  POTENTIAL_LABEL,
  prospectSingular,
  prospectPlural,
} from "@/data/clusters";
import type {
  ConnectApproach,
  Prospect,
  ProspectAnswer,
  Stakeholder,
} from "@/store/appStore";

type Args = {
  focusClusterIds: string[];
  prospectsByCluster: Record<string, Prospect[]>;
  prospectAnswers: Record<string, Record<string, ProspectAnswer>>;
  stakeholders: Record<string, Stakeholder[]>;
};

const APPROACH_HEADLINE: Record<ConnectApproach, string> = {
  L1: "with direct connects — Make a presentation",
  L2: "with partner / contractor connects — Enable the partner to succeed",
  L3: "with cold connects — Build trust before approaching",
  L4: "where you would like to do promotions",
};

type Pitch = {
  L1: { vp: string; action: string; asset?: { title: string; url: string } };
  L2: { vp: string; action: string };
  L3: { vp: string; action: string };
  L4: { vp: string; action: string };
};

const GENERIC_PITCH = (clusterName: string, singular: string): Pitch => ({
  L1: {
    vp: `Why ${clusterName} should choose JK — superior durability, premium finish and strong after-sales backing vs. competitors. Customise the value angle to the decision maker (cost, aesthetics, longevity).`,
    action: `Make a presentation to the ${singular.toLowerCase()} management / purchase decision makers.`,
    asset: { title: "Pre-set sales presentation", url: "#" },
  },
  L2: {
    vp: `Attractive benefits for the contractor / partner — better margins, on-site technical support, and proof points showing why JK is superior to competitors. Build their confidence in the brand.`,
    action: `Run a workshop for contractors / painters serving this cluster in the area.`,
  },
  L3: {
    vp: `Conduct a contribution or sponsored event in the cluster to build trust before commercial conversations.`,
    action: `Plan a focused outreach sprint using the cluster contact database; warm them up via a sponsored / community activity first.`,
  },
  L4: {
    vp: `Visibility-led play — pamphlets, brochures and retailer push to keep JK top-of-mind when need arises.`,
    action: `Propose a quick audit of premises (leakages, quick touch-ups). Share pamphlets via retailers and run a targeted brochure / email campaign.`,
  },
});

const CLUSTER_PITCH: Record<string, Partial<Pitch>> = {
  schools: {
    L1: {
      vp: "How school repainting and a fresh design can become an attractive proposition for new admissions — plus durability and child-safe finish benefits over other brands.",
      action:
        "Make a presentation to the school management / admin / purchase department.",
      asset: { title: "Schools sales presentation", url: "#" },
    },
    L2: {
      vp: "Give attractive benefits to the contractor and pitch to improve his confidence in the brand — show why JK is superior to competitors for school projects.",
      action: "Run a workshop for contractors painting schools in the area.",
    },
    L3: {
      vp: "Conduct a contribution / sponsored event for teachers or students to build trust with the school management.",
      action:
        "Plan a sponsored career-counselling or learning event at the school as a trust-builder.",
    },
    L4: {
      vp: "Visibility-led play with school admins and PTA contacts.",
      action:
        "Propose a quick audit of the school premises — identify leakages, quick touch-ups. Share pamphlets via retailers.",
    },
  },
  "mid-apartments": societyPitch(),
  redevelopment: societyPitch(),
  "gated-community": societyPitch(),
  midc: {
    L1: {
      vp: "Durable industrial coatings, lower repaint frequency and strong technical support for plant managers.",
      action:
        "Present plant-maintenance package to facility heads with TCO comparison vs. competitors.",
      asset: { title: "Industrial coatings deck", url: "#" },
    },
  },
  hospitals: {
    L1: {
      vp: "Hygienic, antimicrobial, washable finishes — directly tied to patient experience and infection-control compliance.",
      action: "Present to facility / infection-control teams in target hospitals.",
      asset: { title: "Healthcare finishes deck", url: "#" },
    },
  },
};

function societyPitch(): Partial<Pitch> {
  return {
    L1: {
      vp: "How a refreshed exterior and waterproofing improves resale value, attracts buyers and reduces society maintenance costs vs. competitors.",
      action:
        "Present to society secretary / managing committee in a scheduled meet.",
      asset: { title: "Residential societies pitch deck", url: "#" },
    },
    L2: {
      vp: "Enable painters and contractors with attractive margins, on-site support and proof of monsoon-readiness vs. competitors.",
      action:
        "Run a contractor / painter meet in the locality with product demo and incentives.",
    },
    L3: {
      vp: "Host a monsoon-readiness contribution event with residents to surface leakage problems and earn trust.",
      action:
        "Schedule a society-committee meet positioned as a free monsoon-readiness audit.",
    },
    L4: {
      vp: "Door-to-door visibility via retailers, painters and site supervisors.",
      action:
        "Distribute waterproofing diagnostic pamphlets via retailers and painters serving the cluster.",
    },
  };
}

function getPitch(clusterId: string, clusterName: string, singular: string): Pitch {
  const base = GENERIC_PITCH(clusterName, singular);
  const override = CLUSTER_PITCH[clusterId] ?? {};
  return {
    L1: override.L1 ?? base.L1,
    L2: override.L2 ?? base.L2,
    L3: override.L3 ?? base.L3,
    L4: override.L4 ?? base.L4,
  };
}

export function generateMonthlyEngagementPlanPdf({
  focusClusterIds,
  prospectsByCluster,
  prospectAnswers,
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

  // ===== Focus clusters table
  heading("Focus clusters for this month");
  if (focusClusterIds.length === 0) {
    doc.setTextColor(120);
    doc.text("No clusters selected for this month.", margin, y);
    doc.setTextColor(15, 23, 42);
    y += 20;
  } else {
    autoTable(doc, {
      startY: y,
      head: [["Cluster", "Potential", "Prospects covered"]],
      body: focusClusterIds.map((id) => {
        const c = getCluster(id);
        const total = prospectsByCluster[id]?.length ?? 0;
        const answered = Object.values(prospectAnswers[id] ?? {}).filter(
          (a) => a.approach,
        ).length;
        return [
          c?.name ?? id,
          c ? POTENTIAL_LABEL[c.potential] : "—",
          `${answered} / ${total} with approach decided`,
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

  // ===== Prioritisation plan per cluster
  for (const clusterId of focusClusterIds) {
    const cluster = getCluster(clusterId);
    if (!cluster) continue;
    const singular = prospectSingular(clusterId);
    const plural = prospectPlural(clusterId);
    const prospects = prospectsByCluster[clusterId] ?? [];
    const answers = prospectAnswers[clusterId] ?? {};
    const pitch = getPitch(clusterId, cluster.name, singular);

    heading(`${cluster.name}`);
    wrapped(
      `Prioritised ${plural.toLowerCase()} list (based on ${plural.toLowerCase()} with immediate needs first):`,
      0,
      true,
    );
    y += 4;

    const approachOrder: ConnectApproach[] = ["L1", "L2", "L3", "L4"];

    let anyPrinted = false;

    for (let i = 0; i < approachOrder.length; i++) {
      const approach = approachOrder[i];
      const list = prospects.filter((p) => answers[p.id]?.approach === approach);
      if (list.length === 0) continue;
      anyPrinted = true;

      // Sort: immediate-need Y first, then DK, then N
      const order: Record<string, number> = { Y: 0, DK: 1, N: 2 };
      list.sort(
        (a, b) =>
          (order[answers[a.id]?.immediateNeed ?? "DK"] ?? 1) -
          (order[answers[b.id]?.immediateNeed ?? "DK"] ?? 1),
      );

      const roman = ["i", "ii", "iii", "iv"][i];
      ensureSpace(40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      wrapped(
        `${roman}) ${approach} ${plural} ${APPROACH_HEADLINE[approach]}`,
        0,
        true,
      );
      doc.setFontSize(10);

      // List of prospects as a table
      wrapped(`a. List of ${plural.toLowerCase()}:`, 12, true);
      const triLabel = (v: string | null | undefined) =>
        v === "Y" ? "Yes" : v === "N" ? "No" : v === "DK" ? "Don't know" : "—";
      autoTable(doc, {
        startY: y + 2,
        head: [[singular, "Immediate need", "Uses JK"]],
        body: list.map((p) => [
          p.name,
          triLabel(answers[p.id]?.immediateNeed),
          triLabel(answers[p.id]?.usingJk),
        ]),
        headStyles: { fillColor: [15, 23, 42] },
        margin: { left: margin + 24, right: margin },
        styles: { fontSize: 9, cellPadding: 5 },
        columnStyles: {
          0: { cellWidth: "auto" },
          1: { cellWidth: 90, halign: "center" },
          2: { cellWidth: 70, halign: "center" },
        },
      });
      y =
        (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
          .finalY + 10;

      // Value proposition
      const block = pitch[approach];
      wrapped(`b. Value Proposition:`, 12, true);
      wrapped(block.vp, 24);

      // Action
      wrapped(`c. Action:`, 12, true);
      wrapped(block.action, 24);
      if ("asset" in block && block.asset) {
        const label = "Use this pre-set presentation";
        ensureSpace(16);
        doc.setTextColor(37, 99, 235);
        doc.setFont("helvetica", "normal");
        doc.textWithLink(label, margin + 24, y, {
          url: "https://example.com/jk-presentation",
        });
        y += 14;
        doc.setTextColor(15, 23, 42);
      }
      y += 6;
    }

    if (!anyPrinted) {
      doc.setTextColor(120);
      wrapped(
        `No approach has been decided for any ${singular.toLowerCase()} in this cluster yet.`,
        0,
      );
      doc.setTextColor(15, 23, 42);
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
