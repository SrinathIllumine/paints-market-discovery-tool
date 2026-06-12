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
  role?: string;
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

/* ─────────────────────────── value propositions

   Two-pronged pitch per cluster:
   [0] customer / end-user value-centric pitch — why the repaint itself is a
       business win for the owner, plus how JK Maxx is superior to other brands.
   [1] contractor / product-centric pitch — attractive contractor benefits,
       confidence boosters, and product superiority over competitors.
*/

export type ValuePropositionCard = { title: string; body: string };

const VALUE_PROP_LIBRARY: Record<string, ValuePropositionCard[]> = {
  schools: [
    {
      title:
        "How school repainting and a fresh design can become an attractive proposition for new admissions",
      body:
        "Pitch a vacation-window repaint as an admission-season upgrade: bright, child-safe walls, anti-fungal exteriors that survive monsoon, and corridors that look new in parent walk-throughs. Versus Asian Paints / Berger / Dulux, JK Maxx delivers comparable finish at a sharper trustee budget — with a 7-year warranty trustees can show parents.",
    },
    {
      title:
        "Attractive benefits for the contractor + why JK Maxx improves brand confidence over competitors",
      body:
        "Higher per-litre margin than Asian Paints / Berger on the same school spec, faster site delivery from depot, free painter training and on-site supervision. Coverage matches Dulux Weathershield while costing less per sq.ft — easier to close trustees and protect the contractor's reputation on the next school in the cluster.",
    },
  ],
  hospitals: [
    {
      title:
        "How a hygienic repaint becomes an attractive proposition for patient trust and inspection scores",
      body:
        "Position antimicrobial, washable finishes as a patient-trust upgrade — clean wards, odour-free application during phased work, and exteriors that hold up to disinfectant cleaning. Versus Asian Paints Royale Health Shield / Dulux Promise, JK Maxx hygienic range matches the antimicrobial claim at a better hospital-AMC price.",
    },
    {
      title:
        "Attractive contractor benefits + why JK Maxx wins confidence over competitors in healthcare",
      body:
        "Low-VOC, low-odour systems mean fewer ward-shutdown complaints, faster recoat windows and stronger margins than Berger Silk Breathe. Free technical supervision, hospital-grade case references and a painter loyalty payout per project make JK Maxx the safer pitch for the contractor's reputation.",
    },
  ],
  "mid-apartments": [
    {
      title:
        "How a society repaint becomes an attractive proposition for committee re-election and property value",
      body:
        "Frame the exterior repaint as a visible win for the managing committee — better street appeal, fewer monsoon leaks, higher resale/rent quotes for owners. Versus Asian Paints Apex Ultima / Berger WeatherCoat, JK Maxx exteriors offer the same 7-year warranty at a sharper society-bulk price.",
    },
    {
      title:
        "Attractive contractor benefits + why JK Maxx beats competitors on society jobs",
      body:
        "Better per-litre margin than Asian Paints on bulk society tenders, faster delivery from local depot, painter loyalty rewards and on-site colour-consultation support. Coverage and weathering match Dulux Weathershield Max — the contractor wins the AGM with a stronger spec at a lower BOQ.",
    },
  ],
  midc: [
    {
      title:
        "How an industrial coating refresh becomes an attractive proposition for plant uptime and safety audits",
      body:
        "Pitch shopfloor and tank-farm coatings as an uptime + safety story — clearer zone markings, corrosion control on exterior steel, faster shutdown-window turnaround. Versus Asian Paints Apcolite Industrial / Berger Protecton, JK Maxx industrial systems match chemical-resistance specs at a sharper plant-engineering budget.",
    },
    {
      title:
        "Attractive contractor benefits + why JK Maxx improves credibility with plant engineers",
      body:
        "Higher project margin than Berger Protecton on the same scope, MIDC-cluster references the contractor can show, and free technical assistance from JK's coatings team during shutdown windows. Easier to defend the spec to a plant engineer who otherwise defaults to Asian Paints.",
    },
  ],
  hotels: [
    {
      title:
        "How a refresh repaint becomes an attractive proposition for guest reviews and brand-standard audits",
      body:
        "Position the repaint as a review-score and OTA-ranking upgrade — refreshed lobbies, stain-resistant guest-room finishes, brand-standard exteriors. Versus Asian Paints Royale Luxury Emulsion / Dulux Velvet Touch, JK Maxx premium interiors deliver the same finish at a sharper refurbishment budget.",
    },
    {
      title:
        "Attractive contractor benefits + why JK Maxx wins over competitors on hospitality jobs",
      body:
        "Stronger margin than Berger Silk Breathe on premium interiors, fast colour-consultation support, and a painter loyalty payout that helps the contractor retain crew across resorts. Lets the contractor pitch a brand-standard look without the Asian Paints price tag.",
    },
  ],
  restaurants: [
    {
      title:
        "How a themed repaint becomes an attractive proposition for footfall and Instagrammable interiors",
      body:
        "Sell the repaint as a footfall and social-media play — vibrant accent walls, washable kitchen-back finishes, refreshed exteriors that pull in walk-ins. Versus Asian Paints Royale Play / Dulux Velvet Touch, JK Maxx designer range delivers the same wow at a smaller café budget.",
    },
    {
      title:
        "Attractive contractor benefits + why JK Maxx beats competitors on F&B refits",
      body:
        "Better margin than Berger on designer finishes, fast turnaround during weekday-shutdown windows, and free shade-card / mock-up support. Helps the contractor close the owner without losing the job to a local Birla Opus pitch.",
    },
  ],
};

export function getValuePropositionCards(clusterId: string): ValuePropositionCard[] {
  if (VALUE_PROP_LIBRARY[clusterId]) return VALUE_PROP_LIBRARY[clusterId];
  const ctx = clusterId.replace(/-/g, " ");
  return [
    {
      title: `How a quality repaint becomes an attractive proposition for ${ctx} owners and end-users`,
      body:
        `Pitch the repaint as a visible business upgrade for ${ctx} — better customer perception, longer-lasting finish through monsoon and a sharper exterior. Versus Asian Paints, Berger and Dulux, JK Maxx delivers comparable finish and warranty at a sharper budget the owner can sign off quickly.`,
    },
    {
      title:
        "Attractive contractor benefits + why JK Maxx improves brand confidence over competitors",
      body:
        `Better per-litre margin than Asian Paints / Berger on the same spec, faster delivery from local depot, painter loyalty rewards and free on-site technical support. Lets the contractor defend the brand confidently against Birla Opus or Dulux pitches in the ${ctx} cluster.`,
    },
  ];
}

export function getValuePropositions(clusterId: string): string[] {
  return getValuePropositionCards(clusterId).map((c) => c.title);
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
  BRAND: [], CONTRACTOR: [], OUTREACH: [], D2C: [], RETAILER: [], INFLUENCER: [],
};
