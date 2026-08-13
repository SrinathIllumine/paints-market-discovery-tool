/* Shared engagement content: enablers, review questions,
   customer-group details and cluster-level value propositions. */

export type Question = {
  id: string;
  label: string;
  placeholder?: string;
  type?: "number" | "text" | "textarea";
};

export type EnablerFile = { name: string; size: string };
export type Enabler = { label: string; description: string; files: EnablerFile[] };

/* ────────── ENABLERS ────────── */

export const EVENT_ENABLERS: Enabler[] = [
  {
    label: "Event pamphlets",
    description: "Printable handouts to distribute at the venue.",
    files: [
      { name: "Brand_Event_Pamphlet_A5.pdf", size: "1.2 MB" },
      { name: "Product_Range_Flyer.pdf", size: "820 KB" },
    ],
  },
  {
    label: "Pitch deck",
    description: "Short deck to anchor the stage / booth conversation.",
    files: [
      { name: "Brand_Cluster_Pitch_v3.pptx", size: "4.6 MB" },
      { name: "Customer_Success_Stories.pdf", size: "2.1 MB" },
    ],
  },
  {
    label: "Workshop materials",
    description: "Demo kit checklist and live-demo script.",
    files: [
      { name: "Demo_Kit_Checklist.pdf", size: "210 KB" },
      { name: "Live_Demo_Script.docx", size: "180 KB" },
    ],
  },
];

export const CONTRACTOR_ENABLERS: Enabler[] = [
  {
    label: "Contractor pamphlet",
    description: "Margin, scheme and on-site support — one page.",
    files: [
      { name: "Contractor_Benefits_Pamphlet.pdf", size: "950 KB" },
      { name: "Loyalty_Scheme_Onepager.pdf", size: "420 KB" },
    ],
  },
  {
    label: "Competitor comparison deck",
    description: "Side-by-side on coverage, finish and TCO vs key brands.",
    files: [
      { name: "Brand_vs_Competitors.pptx", size: "3.1 MB" },
      { name: "Coverage_TCO_Calculator.xlsx", size: "260 KB" },
    ],
  },
  {
    label: "Product technical sheets",
    description: "TDS and application guides to share on WhatsApp.",
    files: [
      { name: "TDS_Bundle.pdf", size: "5.4 MB" },
      { name: "Application_Guide.pdf", size: "1.8 MB" },
    ],
  },
];

export const RETAILER_ENABLERS: Enabler[] = [
  {
    label: "Retailer scheme sheet",
    description: "Slab-wise margin and rotation scheme for the quarter.",
    files: [
      { name: "Retailer_Scheme_Q.pdf", size: "640 KB" },
      { name: "Display_Norms.pdf", size: "310 KB" },
    ],
  },
  {
    label: "Catchment demand sheet",
    description: "Contractors / projects in their area asking for us by name.",
    files: [{ name: "Catchment_Demand_Snapshot.pdf", size: "720 KB" }],
  },
  {
    label: "Branding & POSM kit",
    description: "Shop branding, danglers and shelf-talkers.",
    files: [
      { name: "POSM_Kit_Preview.pdf", size: "2.4 MB" },
      { name: "Shop_Branding_Mockup.png", size: "1.1 MB" },
    ],
  },
];

export const STAKEHOLDER_ENABLERS: Enabler[] = [
  {
    label: "Institutional deck",
    description: "Credentials, marquee projects and case studies.",
    files: [
      { name: "Brand_Institutional_Deck.pptx", size: "6.2 MB" },
      { name: "Marquee_Projects_Booklet.pdf", size: "3.7 MB" },
    ],
  },
  {
    label: "Spec / approval kit",
    description: "BOQ-ready specs, test certificates and approvals.",
    files: [
      { name: "BOQ_Spec_Sheet.pdf", size: "540 KB" },
      { name: "Test_Certificates_Bundle.pdf", size: "2.9 MB" },
    ],
  },
  {
    label: "Cost / durability calculator",
    description: "Share lifecycle cost vs incumbent brand.",
    files: [{ name: "Lifecycle_Cost_Calculator.xlsx", size: "320 KB" }],
  },
];

/* ────────── QUESTIONS ────────── */

export const EVENT_QUESTIONS: Question[] = [
  { id: "attended", label: "How many participants attended?", type: "number", placeholder: "e.g. 42" },
  { id: "leads", label: "How many qualified leads did you generate?", type: "number", placeholder: "e.g. 8" },
  { id: "samples", label: "How many product samples / demos given?", type: "number", placeholder: "e.g. 15" },
  { id: "rating", label: "How well did the engagement land (1-10)?", type: "number", placeholder: "e.g. 7" },
];

export const CONTRACTOR_QUESTIONS: Question[] = [
  { id: "metVisited", label: "Contractors met / visited", type: "number", placeholder: "e.g. 12" },
  { id: "interested", label: "Contractors who showed serious interest", type: "number", placeholder: "e.g. 5" },
  { id: "trialOrders", label: "Trial orders booked", type: "number", placeholder: "e.g. 3" },
  { id: "trialVolume", label: "Total trial order volume (bags / units)", type: "number", placeholder: "e.g. 80" },
];

export const RETAILER_QUESTIONS: Question[] = [
  { id: "metVisited", label: "Retailers met / visited", type: "number", placeholder: "e.g. 8" },
  { id: "newOnboard", label: "New retailers willing to stock our brand", type: "number", placeholder: "e.g. 2" },
  { id: "shelfShare", label: "Avg. shelf-share commitment (%)", type: "number", placeholder: "e.g. 25" },
  { id: "orderValue", label: "Indicative order value committed (Rs.)", type: "number", placeholder: "e.g. 75000" },
];

export const STAKEHOLDER_QUESTIONS: Question[] = [
  { id: "metVisited", label: "Stakeholders met", type: "number", placeholder: "e.g. 4" },
  { id: "specsInfluenced", label: "Specs / BOQs influenced", type: "number", placeholder: "e.g. 2" },
  { id: "pilotsAgreed", label: "Site visits / pilots agreed", type: "number", placeholder: "e.g. 1" },
  {
    id: "pipelineValue",
    label: "Indicative pipeline value unlocked (Rs.)",
    type: "number",
    placeholder: "e.g. 500000",
  },
];

/* ────────── CUSTOMER-GROUP DETAILS ────────── */

const GROUP_DETAILS: Record<string, Record<string, string[]>> = {
  schools: {
    "large-private": [
      "Contribute ~25% of paint-spend value in this cluster — high ticket size per repaint cycle.",
      "Top names nearby: DPS, Ryan International, Podar International.",
      "Key decision-makers: Trustees + Estate / Facilities Head; principal influences shade choice.",
      "Typical need: 7-year premium exterior + low-VOC interior in vacation window (Apr-May).",
    ],
    "small-private": [
      "Largest group — ~35% of cluster sales value, very price-sensitive but volume-rich.",
      "Top names nearby: St. Mary's, Holy Cross, Vidya Mandir.",
      "Key decision-makers: Trustee / Owner directly; contractor recommendation matters a lot.",
      "Typical need: Mid-budget exterior + interior bundle, comparable finish to Asian Paints / Berger.",
    ],
    international: [
      "Small in count (~10%) but premium ticket size; global facility-audit driven.",
      "Top names nearby: Oberoi International, Aditya Birla World Academy.",
      "Key decision-makers: Regional Facility Manager + appointed architect.",
      "Typical need: IGBC-friendly low-VOC system, designer shade palette, brand-standard finish.",
    ],
    "pre-schools": [
      "~15% of cluster — small ticket per site but high repaint frequency (every 2-3 yrs).",
      "Top chains nearby: Kidzee, EuroKids, Bachpan.",
      "Key decision-makers: Franchise owner; chain HO sets approved-brand list.",
      "Typical need: Anti-microbial washable interiors + bright themed murals.",
    ],
    government: [
      "~15% of cluster — L1 tender driven, slow but predictable repaint cycles.",
      "Top names nearby: ZP schools, BMC-run schools.",
      "Key decision-makers: PWD engineer + School Education Officer.",
      "Typical need: BIS-compliant anti-fungal exteriors at L1 pricing, monsoon-ready.",
    ],
  },
};

export function getCustomerGroupDetails(clusterId: string, groupId: string, fallback: { label: string; pct: number }): string[] {
  const fromLib = GROUP_DETAILS[clusterId]?.[groupId];
  if (fromLib) return fromLib;
  const ctx = clusterId.replace(/-/g, " ");
  return [
    `${fallback.label} contribute ~${fallback.pct}% of paint-spend value in this cluster.`,
    `Several active sites nearby — high warm-lead potential for ${ctx}.`,
    `Key decision-makers: Owner / Facility head + appointed contractor.`,
    `Typical need: Quality finish at competitive cost with on-site supervision.`,
  ];
}

/* ────────── CLUSTER-LEVEL VALUE PROPOSITIONS ────────── */

const CLUSTER_VALUE_PROPS: Record<string, string[]> = {
  schools: [
    "Child-safe, low-VOC, washable interiors backed by a 7-year warranty trustees can show to parents.",
    "Vacation-window repaint package with on-site supervision — finished before the new term begins.",
    "Comparable finish to Asian Paints / Berger at a sharper budget, with contractor margin protected.",
  ],
  hospitals: [
    "Antimicrobial, inspection-ready finish that helps clear hygiene and NABH audits.",
    "Phased ward-wise execution with minimal downtime and odour-free overnight curing.",
    "AMC-friendly SKU mix with technical support for maintenance teams.",
  ],
  "mid-apartments": [
    "Society-grade exteriors with 5-7 yr warranty — a clear win for the committee at AGM.",
    "Coordinated repaint plan that minimises disruption to residents and parking.",
    "Better TCO than incumbent brand once warranty + recoat cycle are factored in.",
  ],
  midc: [
    "Industrial coating system that improves plant uptime and clears safety audits.",
    "Single-window execution: surface prep, application and dry-time managed around shifts.",
    "Lifecycle cost lower than incumbent over a 5-year horizon.",
  ],
  hotels: [
    "Brand-standard finish that clears chain audits and lifts guest review scores.",
    "Phased floor-wise execution — minimal room-night loss during refresh.",
    "Designer shade palette curated for hospitality interiors.",
  ],
  restaurants: [
    "Themed, Instagrammable interiors that lift footfall during launch / relaunch.",
    "Quick-turnaround repaint between service shifts with low odour.",
    "Better durability against grease, steam and frequent cleaning.",
  ],
};

export function getClusterValueProps(clusterId: string): string[] {
  return (
    CLUSTER_VALUE_PROPS[clusterId] ?? [
      "Premium finish + warranty package tailored for this cluster's typical brief.",
      "Competitive contractor commercials with on-site supervision included.",
      "Comparable finish to Asian Paints / Berger at a sharper budget.",
    ]
  );
}
