// Engagement-plan connect strategies, cluster-specific value propositions,
// commitments per strategy and recommended actions.

import { prospectPlural } from "@/data/clusters";

export type ConnectStrategy = "BRAND" | "CONTRACTOR" | "OUTREACH" | "D2C";

export const CONNECT_STRATEGY_LABEL: Record<ConnectStrategy, string> = {
  BRAND: "Brand Awareness",
  CONTRACTOR: "Contractor Engagement",
  OUTREACH: "Touchpoint Contact",
  D2C: "Direct Sales",
};

export const CONNECT_STRATEGY_OPTIONS: { key: ConnectStrategy; label: string; description: string }[] = [
  { key: "BRAND",      label: "Brand Awareness",      description: "Build awareness through local campaigns and visibility plays." },
  { key: "CONTRACTOR", label: "Contractor Engagement", description: "Activate the contractor network operating in this cluster." },
  { key: "OUTREACH",   label: "Touchpoint Contact",   description: "Use community touchpoints to build trust and warm leads." },
  { key: "D2C",        label: "Direct Sales",         description: "Reach end customers directly via retailer, walk-in and digital channels." },
];

export type ContactEntry = {
  id: string;
  name: string;
  phone?: string;
  area?: string;
  brandPreference?: string;
};

export type ContractorContact = ContactEntry;

// Legacy answers shape (kept for type-import compatibility)
export type StrategyAnswers = {
  runLocalCampaigns?: "Y" | "N";
  selectedCampaigns?: string[];
  knowsContractors?: "Y" | "N";
  contractors?: ContactEntry[];
  hasCommunityTouchpoint?: "Y" | "N";
  communityContacts?: ContactEntry[];
  consideredContributionEvents?: "Y" | "N";
  selectedEventTopics?: string[];
  wantsDirectReach?: "Y" | "N";
  d2cChannels?: string[];
};

export const D2C_CHANNELS = ["Retailer counter", "WhatsApp", "Walk-in / site visits", "Local digital ads"];

/* ─────────────────────────── value propositions */

const VALUE_PROPS: Record<string, string[]> = {
  schools: [
    "Child-safe, antifungal finishes that hold up through monsoon",
    "Faster vacation-window repaint with minimal disruption",
    "Better long-term durability across high-traffic corridors",
  ],
  hospitals: [
    "Antimicrobial, washable finishes for clinical environments",
    "Faster phased execution with minimal ward downtime",
    "Long-life exteriors that withstand cleaning regimens",
  ],
  midc: [
    "Industrial-grade durable coatings for shopfloors and tank farms",
    "Faster project completion support for shutdown windows",
    "Better corrosion and chemical resistance for plant exteriors",
  ],
  "mid-apartments": [
    "Faster project completion support for society repaints",
    "Higher contractor confidence with painter loyalty backing",
    "Better long-term durability with 7-year exterior warranty",
  ],
};

export function getValuePropositions(clusterId: string): string[] {
  return (
    VALUE_PROPS[clusterId] ?? [
      "Faster project completion support",
      "Higher contractor confidence",
      "Better long-term durability",
    ]
  );
}

/* ─────────────────────────── commitments per strategy */

export type CommitmentField = {
  key: string;
  label: string;
  type: "number" | "text";
  placeholder?: string;
};

export const COMMITMENT_FIELDS: Record<ConnectStrategy, CommitmentField[]> = {
  BRAND: [
    { key: "activities", label: "Number of awareness activities", type: "number", placeholder: "e.g. 4" },
    { key: "reach", label: "Target reach (people)", type: "number", placeholder: "e.g. 2000" },
  ],
  CONTRACTOR: [
    { key: "meetings", label: "Number of contractor meetings", type: "number", placeholder: "e.g. 8" },
    { key: "champions", label: "Contractor champions to activate", type: "number", placeholder: "e.g. 2" },
  ],
  OUTREACH: [
    { key: "visits", label: "Number of visits planned", type: "number", placeholder: "e.g. 6" },
    { key: "influencers", label: "Key influencers to approach", type: "text", placeholder: "e.g. RWA chair, trustee" },
  ],
  D2C: [
    { key: "retailers", label: "Number of retailers to activate", type: "number", placeholder: "e.g. 5" },
    { key: "campaigns", label: "Direct campaigns planned", type: "number", placeholder: "e.g. 2" },
  ],
};

/* ─────────────────────────── recommended actions per strategy */

const ACTIONS: Record<ConnectStrategy, string[]> = {
  BRAND: [
    "Install visibility boards at high-footfall spots",
    "Run a local awareness activity in the cluster",
    "Conduct a retailer engagement event",
  ],
  CONTRACTOR: [
    "Meet top 10 contractors in this cluster",
    "Conduct a technical product session",
    "Activate the contractor referral network",
  ],
  OUTREACH: [
    "Identify a community touchpoint and warm intro",
    "Host a contribution event with key influencers",
    "Follow up within 7 days with a tailored proposal",
  ],
  D2C: [
    "Activate retailer counters with shade cards and demo cans",
    "Run a 2-week WhatsApp + walk-in pilot",
    "Capture customer feedback and refine the pitch",
  ],
};

export function getRecommendedActions(strategy: ConnectStrategy, _clusterId: string): string[] {
  return ACTIONS[strategy];
}

/* ─────────────────────────── legacy stubs (kept for back-compat) */

export type ActionLinkKind = "popup-list" | "popup-text" | "popup-contacts" | "deck";
export type ActionLink = {
  label: string;
  kind: ActionLinkKind;
  items?: string[];
  contacts?: ContactEntry[];
  body?: string;
  deckTitle?: string;
};
export type ActionStep = { text: string; link?: ActionLink };

const LOCAL_CAMPAIGNS: Record<string, string[]> = {
  schools: ["Child-safe paint awareness drive", "PTA branding via banners", "Vacation repaint offer poster"],
};
export function getLocalCampaignSuggestions(clusterId: string): string[] {
  return LOCAL_CAMPAIGNS[clusterId] ?? [
    "Local visibility refresh near high-footfall spots",
    "Cluster-specific WhatsApp offer broadcast",
    "Association meet sponsorship banner",
  ];
}

export function generateActionPlan(
  clusterId: string,
  strategy: ConnectStrategy,
  _answers: StrategyAnswers,
): ActionStep[] {
  void prospectPlural;
  void clusterId;
  return getRecommendedActions(strategy, clusterId).map((text) => ({ text }));
}
