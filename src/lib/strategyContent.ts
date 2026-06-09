// Engagement-plan connect strategies, cluster-specific value propositions,
// per-strategy initiatives, contact tables and recommended actions with assets.

import { getTopics } from "@/data/eventTopics";
import { getDominantContractors } from "@/lib/clusterScoring";

export type ConnectStrategy = "BRAND" | "CONTRACTOR" | "OUTREACH" | "D2C" | "RETAILER" | "INFLUENCER";

export const CONNECT_STRATEGY_LABEL: Record<ConnectStrategy, string> = {
  BRAND: "Brand Awareness",
  CONTRACTOR: "Contractor-driven",
  OUTREACH: "Outreach-Driven",
  D2C: "Direct-sales driven",
  RETAILER: "Retailer-driven",
  INFLUENCER: "Influencer-driven",
};

export const CONNECT_STRATEGY_OPTIONS: { key: ConnectStrategy; label: string; description: string }[] = [
  { key: "CONTRACTOR", label: "Contractor-driven",   description: "Activate the contractor network operating in this cluster." },
  { key: "D2C",        label: "Direct-sales driven", description: "Reach end customers directly via walk-ins, demos and digital channels." },
  { key: "RETAILER",   label: "Retailer-driven",     description: "Drive sell-out via local retail counters, shade cards and visibility." },
  { key: "INFLUENCER", label: "Influencer-driven",   description: "Engage site supervisors, interior designers and architects who steer decisions." },
];

export type MarketEngagementCategory = "Knowledge" | "Service" | "Social";
export type MarketEngagementOption = {
  id: string;
  category: MarketEngagementCategory;
  label: string;
  description: string;
};

export const MARKET_ENGAGEMENT_OPTIONS: MarketEngagementOption[] = [
  { id: "tech-workshop", category: "Knowledge", label: "Technical workshop for painters & contractors", description: "Surface-prep, application & finish know-how with live demo." },
  { id: "spec-clinic",   category: "Knowledge", label: "Specification clinic for architects / engineers", description: "Help specifiers pick the right SKU mix for the cluster's brief." },
  { id: "site-advisory", category: "Service",   label: "Free on-site advisory & shade consultation", description: "Walk the site, recommend system, leave a written estimate." },
  { id: "demo-drive",    category: "Service",   label: "Product demo & sampling drive",              description: "Hands-on demo at retailer counters, sites or association meets." },
  { id: "community-csr", category: "Social",    label: "Community contribution event (school / NGO repaint)", description: "Sponsor a visible local cause with branded contribution." },
  { id: "festival-spon", category: "Social",    label: "Festival / association sponsorship",         description: "Partner with a local festival or trade body for visibility." },
];


export type ContactEntry = {
  id: string;
  name: string;
  phone?: string;
  area?: string;
  brandPreference?: string;
};

export type ContractorContact = ContactEntry;

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

export const D2C_CHANNELS = [
  "Retailer counter activation",
  "WhatsApp + walk-in pilot",
  "Local digital ads",
  "Site-visit demo campaign",
];

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

/* ─────────────────────────── brand awareness initiatives */

const BRAND_INITIATIVES: Record<string, string[]> = {
  schools: [
    "Child-safe paint awareness drive at PTA meet",
    "Vacation repaint offer poster at school gates",
    "Painter loyalty meet for school annual maintenance",
    "Branding banners at PTA / annual day events",
  ],
  hospitals: [
    "Hygienic-paint awareness session for admin teams",
    "Branding banners at hospital reception",
    "Painter & contractor meet for healthcare projects",
    "Trust-board awareness mailer + offer",
  ],
  midc: [
    "Industrial coating awareness session at MIDC association",
    "Branding boards at MIDC entry gates",
    "Painter / contractor meet for industrial coatings",
    "Plant-engineer mailer with case studies",
  ],
};

export function getBrandInitiatives(clusterId: string): string[] {
  return (
    BRAND_INITIATIVES[clusterId] ?? [
      "Local visibility refresh near high-footfall spots",
      "Cluster-specific WhatsApp offer broadcast",
      "Association meet sponsorship banner",
      "Painter loyalty drive in this cluster",
    ]
  );
}

/* ─────────────────────────── contribution event suggestions */

export function getContributionEvents(clusterId: string): string[] {
  // Use the awareness topics from eventTopics if present, else generic.
  const awareness = getTopics(clusterId, "Awareness");
  const workshops = getTopics(clusterId, "Workshop");
  const out = [...awareness, ...workshops].slice(0, 4);
  if (out.length >= 3) return out;
  return [
    "Sponsor an association meet in this cluster",
    "Free product session with key influencers",
    "Contribution drive aligned to a local festival",
    "Painter / contractor felicitation event",
  ];
}

/* ─────────────────────────── direct sales initiatives */

const D2C_INITIATIVES: Record<string, string[]> = {
  schools: [
    "Repaint scheme tied to summer vacation window",
    "Trustee-direct proposal with bundled exteriors",
    "Painter+supply package for the school's regular crew",
  ],
  hospitals: [
    "Phased ward-wise repaint proposal",
    "AMC tie-up with hospital maintenance",
    "Direct proposal to trust board with hygiene SKU mix",
  ],
};

export function getD2cInitiatives(clusterId: string): string[] {
  return (
    D2C_INITIATIVES[clusterId] ?? [
      "Activate retailer counters with shade cards and demo cans",
      "Run a 2-week WhatsApp + walk-in pilot",
      "Direct proposal to top 5 owners in this cluster",
      "Refresh-offer postcards in the cluster catchment",
    ]
  );
}

/* ─────────────────────────── contractor pool re-export */

export function getContractorSuggestions(clusterId: string): ContactEntry[] {
  return getDominantContractors(clusterId).map((c, i) => ({
    id: `seed-${clusterId}-${i}`,
    name: c.name,
    phone: c.phone,
    area: c.area,
    brandPreference: c.brandPreference,
  }));
}

/* ─────────────────────────── recommended actions per strategy + assets */

export type ActionAssetKind = "list" | "text" | "contacts" | "deck";
export type ActionAsset = {
  label: string;
  kind: ActionAssetKind;
  items?: string[];
  contacts?: ContactEntry[];
  body?: string;
};
export type ActionItem = {
  text: string;
  assets?: ActionAsset[];
};

function pamphletAsset(clusterId: string): ActionAsset {
  return {
    label: "View pamphlets",
    kind: "list",
    items: [
      `Cluster-specific awareness pamphlet for ${clusterId}`,
      "JK Maxx exteriors brochure (English + Marathi)",
      "Warranty & finish guide brochure",
    ],
  };
}

function deckAsset(): ActionAsset {
  return {
    label: "View customized proposal deck",
    kind: "deck",
    body:
      "12-slide deck: site context, recommended SKU mix, timeline, warranty, commercials, and references from similar clusters.",
  };
}

function contactsAsset(clusterId: string): ActionAsset {
  return {
    label: "View contacts list",
    kind: "contacts",
    contacts: getContractorSuggestions(clusterId),
  };
}

export function getRecommendedActions(strategy: ConnectStrategy, clusterId: string): ActionItem[] {
  switch (strategy) {
    case "BRAND":
      return [
        { text: "Install visibility boards at high-footfall spots", assets: [pamphletAsset(clusterId)] },
        { text: "Run a local awareness activity in the cluster", assets: [pamphletAsset(clusterId)] },
        { text: "Conduct a retailer engagement event", assets: [pamphletAsset(clusterId)] },
      ];
    case "CONTRACTOR":
      return [
        { text: "Meet top contractors in this cluster", assets: [contactsAsset(clusterId)] },
        { text: "Conduct a technical product session", assets: [deckAsset()] },
        { text: "Activate the contractor referral network", assets: [contactsAsset(clusterId)] },
      ];
    case "OUTREACH":
      return [
        { text: "Identify a community touchpoint and warm intro", assets: [contactsAsset(clusterId)] },
        { text: "Host a contribution event with key influencers", assets: [deckAsset()] },
        { text: "Follow up within 7 days with a tailored proposal", assets: [deckAsset()] },
      ];
    case "D2C":
      return [
        { text: "Activate retailer counters with shade cards and demo cans", assets: [pamphletAsset(clusterId)] },
        { text: "Run a 2-week WhatsApp + walk-in pilot", assets: [pamphletAsset(clusterId)] },
        { text: "Send a customized proposal to top owners", assets: [deckAsset()] },
      ];
    case "RETAILER":
      return [
        { text: "Activate retailer counters with shade cards and demo cans", assets: [pamphletAsset(clusterId)] },
        { text: "Run a retailer engagement event", assets: [pamphletAsset(clusterId)] },
      ];
    case "INFLUENCER":
      return [
        { text: "Meet site supervisors / interior designers / architects active in this cluster", assets: [contactsAsset(clusterId)] },
        { text: "Share a specification kit and follow up within 7 days", assets: [deckAsset()] },
      ];
  }
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

export function getLocalCampaignSuggestions(clusterId: string): string[] {
  return getBrandInitiatives(clusterId);
}

export function generateActionPlan(
  clusterId: string,
  strategy: ConnectStrategy,
  _answers: StrategyAnswers,
): ActionStep[] {
  return getRecommendedActions(strategy, clusterId).map((a) => ({ text: a.text }));
}

// Commitment fields are no longer rendered, kept for type imports.
export type CommitmentField = { key: string; label: string; type: "number" | "text"; placeholder?: string };
export const COMMITMENT_FIELDS: Record<ConnectStrategy, CommitmentField[]> = {
  BRAND: [], CONTRACTOR: [], OUTREACH: [], D2C: [],
};
