import type { ConnectModel } from "@/store/appStore";
import { prospectSingular, prospectPlural } from "@/data/clusters";

export type RoadmapVariant = {
  /** Audience label, e.g. "Direct / natural connects" */
  audience: string;
  /** One or more value-proposition bullets. */
  valueProps: string[];
  /** Ordered action steps. */
  actions: string[];
};

export const CONNECT_MODEL_OPTIONS: { key: ConnectModel; label: string }[] = [
  {
    key: "L1",
    label:
      "L1: I have natural connects (direct contacts) and partner-led connects (contractors, painters, etc.)",
  },
  { key: "L2", label: "L2: I need to do cold-calling" },
  { key: "L3", label: "L3: I can do promotions and campaigns" },
];

export const CONNECT_MODEL_LABEL: Record<ConnectModel, string> = {
  L1: "Natural + partner-led connects",
  L2: "Cold-calling",
  L3: "Promotions & campaigns",
};

/* ----------------------------------------------------------------
   Cluster-specific overrides. Keyed by clusterId + model.
   Missing entries fall back to the generic templates below.
---------------------------------------------------------------- */
const CLUSTER_OVERRIDES: Partial<
  Record<string, Partial<Record<ConnectModel, RoadmapVariant[]>>>
> = {
  schools: {
    L1: [
      {
        audience: "Direct / natural connects (school management)",
        valueProps: [
          "How school repainting and a fresh design can become an attractive proposition for new admissions.",
          "Benefits of JK finishes over other brands — child-safe, washable, longer life and lower repaint cycle cost.",
        ],
        actions: [
          "Make a presentation to the school management / admin / purchase department.",
          "Share the JK schools reference deck and case studies.",
          "Track conversion and follow up post-meeting.",
        ],
      },
      {
        audience: "Partner-led (contractors / painters serving schools)",
        valueProps: [
          "Give attractive benefits for the contractor and pitch to improve his confidence in the brand.",
          "Show how JK is superior to competitors on school projects — durability, finish and on-site support.",
        ],
        actions: [
          "Identify the list of contractors active on school projects.",
          "Design pamphlets tailored to schools.",
          "Share with contractors so that they can distribute.",
          "Track incoming contacts.",
          "Meet the schools along with the contractor.",
          "Assist contractors who find it difficult to convert.",
        ],
      },
    ],
    L2: [
      {
        audience: "Cold connects (schools without prior relationship)",
        valueProps: [
          "Conduct a contribution or sponsored event for the school's teachers / students to build trust before commercial conversations.",
          "Position JK as a partner in the school's brand image and admissions journey.",
        ],
        actions: [
          "Shortlist schools to approach this month.",
          "Plan a sponsored workshop, contribution or learning event as the first touchpoint.",
          "Follow up with a tailored proposal after the event.",
          "Track conversion of each cold connect.",
        ],
      },
    ],
    L3: [
      {
        audience: "Schools targeted for promotional push",
        valueProps: [
          "Visibility-led play with school admins, PTA contacts and the local retailer network.",
          "Quick audit angle — surface visible leakages and touch-up needs to create immediate demand.",
        ],
        actions: [
          "Propose a quick audit of the school premises — identify leakages, quick touch-ups, etc.",
          "Share pamphlets with retailers near target schools.",
          "Run a targeted brochure / WhatsApp campaign aimed at school decision makers.",
          "Track inbound enquiries and conversion.",
        ],
      },
    ],
  },
};

/* ----------------------------------------------------------------
   Generic templates by model (used when no cluster override exists).
---------------------------------------------------------------- */
function genericVariants(
  clusterId: string,
  model: ConnectModel,
): RoadmapVariant[] {
  const singular = prospectSingular(clusterId).toLowerCase();
  const plural = prospectPlural(clusterId).toLowerCase();

  if (model === "L1") {
    return [
      {
        audience: "Direct / natural connects (decision makers)",
        valueProps: [
          `Pitch JK's superior durability, premium finish and after-sales support — tailored to what each ${singular} decision maker values most (cost, aesthetics, longevity).`,
          `Position JK as a long-term partner for the ${singular}'s repaint and maintenance cycles.`,
        ],
        actions: [
          `Make a presentation to the ${singular} management / purchase decision makers.`,
          "Share the pre-set JK sales presentation.",
          "Track conversion and follow up.",
        ],
      },
      {
        audience: "Partner-led (contractors / painters)",
        valueProps: [
          "Attractive contractor benefits — better margins, on-site technical support and proof points vs. competitors.",
          "Build the contractor's confidence in the JK brand so they actively recommend it.",
        ],
        actions: [
          `Identify the list of contractors active in the ${plural} space.`,
          "Design pamphlets and share with the contractors so they can distribute.",
          "Track incoming contacts.",
          `Meet ${plural} along with the contractor.`,
          "Assist contractors who find it difficult to convert.",
        ],
      },
    ];
  }

  if (model === "L2") {
    return [
      {
        audience: `Cold connects (${plural} without prior relationship)`,
        valueProps: [
          `Run a contribution or sponsored activity that's relevant to the ${singular} — build trust before any commercial pitch.`,
          "Use it to surface latent painting / waterproofing needs.",
        ],
        actions: [
          `Shortlist ${plural} to cold-approach this month.`,
          "Plan a warm-up event / contribution as the first touchpoint.",
          "Follow up with a tailored proposal after the event.",
          "Track conversion of each cold connect.",
        ],
      },
    ];
  }

  // L3 — promotions & campaigns
  return [
    {
      audience: `${singular[0].toUpperCase() + singular.slice(1)}s targeted for promotional push`,
      valueProps: [
        `Visibility-led play — keep JK top-of-mind for ${plural} via retailers, painters and on-ground material.`,
        `Quick audit angle — propose a free walk-through of the ${singular} premises to spot leakages and quick touch-ups.`,
      ],
      actions: [
        `Propose a quick audit of the ${singular} premises — leakages, touch-ups, etc.`,
        "Share pamphlets via retailers serving the cluster.",
        "Run a targeted brochure / WhatsApp / email campaign.",
        "Track inbound enquiries and conversion.",
      ],
    },
  ];
}

export function getRoadmapVariants(
  clusterId: string,
  model: ConnectModel,
): RoadmapVariant[] {
  const override = CLUSTER_OVERRIDES[clusterId]?.[model];
  if (override && override.length > 0) return override;
  return genericVariants(clusterId, model);
}
