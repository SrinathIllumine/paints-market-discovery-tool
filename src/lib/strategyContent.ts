// Engagement-plan connect strategies, cluster-specific suggestions and the
// dynamic action-plan generator (with intelligent action-item links).

import { prospectSingular, prospectPlural } from "@/data/clusters";
import { getTopics } from "@/data/eventTopics";

export type ConnectStrategy = "BRAND" | "CONTRACTOR" | "OUTREACH" | "D2C";

export const CONNECT_STRATEGY_LABEL: Record<ConnectStrategy, string> = {
  BRAND: "Brand-driven",
  CONTRACTOR: "Contractor-driven",
  OUTREACH: "Outreach-driven",
  D2C: "Direct Sales-driven",
};

export const CONNECT_STRATEGY_OPTIONS: { key: ConnectStrategy; label: string; description: string }[] = [
  { key: "BRAND",      label: "Brand-driven",      description: "Build awareness through local campaigns, hoardings and visibility plays." },
  { key: "CONTRACTOR", label: "Contractor-driven", description: "Activate the contractor network already operating in this cluster." },
  { key: "OUTREACH",   label: "Outreach-driven",   description: "Use community touchpoints and contribution events to build trust." },
  { key: "D2C",        label: "Direct Sales-driven",        description: "Reach end customers directly through retailer, walk-in and digital channels." },
];

export type ContactEntry = {
  id: string;
  name: string;
  phone?: string;
  area?: string;
};

// Kept as alias for back-compat.
export type ContractorContact = ContactEntry;

export type StrategyAnswers = {
  // BRAND
  runLocalCampaigns?: "Y" | "N";
  selectedCampaigns?: string[];
  // CONTRACTOR
  knowsContractors?: "Y" | "N";
  contractors?: ContactEntry[];
  // OUTREACH
  hasCommunityTouchpoint?: "Y" | "N";
  communityContacts?: ContactEntry[];
  consideredContributionEvents?: "Y" | "N";
  selectedEventTopics?: string[];
  // D2C
  wantsDirectReach?: "Y" | "N";
  d2cChannels?: string[];
};

export const D2C_CHANNELS = ["Retailer counter", "WhatsApp", "Walk-in / site visits", "Local digital ads"];

/* ─────────────────────────── cluster-specific local campaign ideas */

const LOCAL_CAMPAIGNS: Record<string, string[]> = {
  schools:           ["Child-safe paint awareness drive", "PTA branding via banners & buntings", "Vacation repaint offer poster at gate", "Sponsored sports-day backdrop"],
  colleges:          ["Hostel-block durable-finish posters", "Campus festival sponsorship banners", "Departmental notice-board branding", "Annual-day stage backdrop sponsorship"],
  "mid-apartments":  ["Society-board waterproofing campaign", "Diwali repaint offer flyers", "Lift-poster brand visibility", "RWA newsletter advertorial"],
  redevelopment:     ["Handover-finish demo board on site", "Builder-office banner placement", "Buyer-meet flyer drop", "Project-hoarding shared branding"],
  "gated-community": ["Clubhouse premium-finish demo wall", "Quarterly newsletter feature", "Lobby brand-poster placement", "Resident festival sponsorship"],
  hospitals:         ["Hygienic-finish awareness poster", "OPD waiting-area branding", "Doctors-day sponsorship banner", "Reception-wall demo panel"],
  restaurants:       ["Themed-wall offer pamphlets", "Festival-makeover banner drive", "Food-festival sponsorship", "Menu-card co-branded inserts"],
  hotels:            ["Lobby premium-finish demo", "Concierge-counter offer leaflet", "Hospitality-magazine ad", "Hotel-association meet sponsorship"],
  midc:              ["Plant-gate weather-proof coating banner", "MIDC association newsletter ad", "Industrial-safety week sponsorship", "Vendor-meet branded backdrop"],
  warehousing:       ["Floor + wall coating combo flyers", "Logistics-park entry banners", "3PL operator newsletter ad", "Warehousing-expo sponsorship"],
  "marriage-halls":  ["Pre-wedding-season repaint flyer", "Banquet-owner association meet sponsorship", "Hall-entry banner placement", "Vendor-tie-up co-branded brochure"],
  "paying-guest":    ["Stain-resistant paint flyer drop", "PG-operator WhatsApp group posters", "Monsoon-ready repaint offer", "College-area pamphlet drop"],
  religious:         ["Festival-repaint offer banner", "Trust-committee meet sponsorship", "Aarti-time poster placement", "Donor-board co-branded plaque"],
  "auto-showrooms":  ["OEM-livery refresh demo board", "Showroom-launch sponsorship banner", "Dealer-meet branded backdrop", "Service-bay branding"],
  "petrol-pumps":    ["Canopy weather-coating banner", "Forecourt-pillar branding", "OMC dealer-meet sponsorship", "Highway-route banner trail"],
  "bus-stand-market":["Shopfront refresh-week flyer drop", "Market-association banner sponsorship", "Festival-makeover offer poster", "WhatsApp campaign for shop owners"],
  "highway-dhabas":  ["Highway-facade weatherproof banner", "Trucker-route flyer distribution", "Dhaba-owner meet sponsorship", "Festival-season banner refresh"],
  "clinics-nursing": ["Antibacterial-paint awareness leaflet", "Doctor-clinic poster placement", "Local-IMA meet sponsorship", "Waiting-area demo wall"],
  jewellery:         ["Luxury-finish demo board", "Festive-collection launch sponsorship", "Jewellers-association meet branding", "Showroom-corner premium-texture demo"],
  "textile-garment": ["Festive-makeover pamphlet drop", "Shop-association banner sponsorship", "Window-display refresh contest", "WhatsApp campaign for shop owners"],
};

export function getLocalCampaignSuggestions(clusterId: string): string[] {
  return LOCAL_CAMPAIGNS[clusterId] ?? [
    "Local visibility refresh near high-footfall spots",
    "Cluster-specific WhatsApp offer broadcast",
    "Association / community-meet sponsorship banner",
    "Co-branded pamphlet drop in the cluster",
  ];
}

/* ─────────────────────────── action plan with intelligent links */

export type ActionLinkKind = "popup-list" | "popup-text" | "deck";

export type ActionLink = {
  label: string;
  kind: ActionLinkKind;
  // popup-list: array of bullets; popup-text: single body; deck: filename + summary
  items?: string[];
  body?: string;
  deckTitle?: string;
};

export type ActionStep = {
  text: string;
  link?: ActionLink;
};

function jkProposition(clusterId: string): ActionLink {
  const plural = prospectPlural(clusterId).toLowerCase();
  return {
    label: `Click here to access JK's proposition for ${plural}`,
    kind: "popup-text",
    body:
      `JK Cement Paints proposition for ${plural}:\n\n` +
      `• Low-VOC, washable interiors suited to ${plural} of all sizes\n` +
      `• Long-life exteriors with 7-year warranty on premium range\n` +
      `• On-site demo & shade-consultation support included\n` +
      `• Painter-loyalty scheme to ensure quality execution\n` +
      `• Dedicated DG support for site walkthroughs & estimation`,
  };
}

function pamphletDeck(clusterId: string): ActionLink {
  const plural = prospectPlural(clusterId).toLowerCase();
  return {
    label: "Click here to see pamphlets",
    kind: "deck",
    deckTitle: `JK-${clusterId}-pamphlet-kit.pptx`,
    body: `Co-brandable pamphlet kit tailored for ${plural} — covers shade cards, warranty highlights and contractor offers.`,
  };
}

function contractorList(clusterId: string, names: string[]): ActionLink {
  const plural = prospectPlural(clusterId).toLowerCase();
  return {
    label: "Click to see the list of contractors",
    kind: "popup-list",
    items: names.length > 0
      ? names
      : [
          `Sample contractor 1 — active in ${plural}`,
          `Sample contractor 2 — active in ${plural}`,
          `Sample contractor 3 — active in ${plural}`,
        ],
  };
}

function communityList(clusterId: string, contacts: ContactEntry[]): ActionLink {
  return {
    label: "Click to see community touchpoints",
    kind: "popup-list",
    items: contacts.length > 0
      ? contacts.map((c) => `${c.name || "Contact"}${c.phone ? ` · ${c.phone}` : ""}${c.area ? ` · ${c.area}` : ""}`)
      : [`Identify one community touchpoint in ${clusterId}`],
  };
}

function eventDeck(): ActionLink {
  return {
    label: "Click here for the event playbook",
    kind: "deck",
    deckTitle: "JK-contribution-event-playbook.pptx",
    body: "Step-by-step event playbook: invites, on-day flow, demo stations and follow-up checklist.",
  };
}

function campaignDeck(clusterId: string): ActionLink {
  return {
    label: "Click here for the campaign creative kit",
    kind: "deck",
    deckTitle: `JK-${clusterId}-campaign-kit.pptx`,
    body: "Creative kit: hoarding mockups, WhatsApp creatives, retailer-counter standees and a 4-week rollout plan.",
  };
}

function retailerKit(): ActionLink {
  return {
    label: "Click here for the retailer activation kit",
    kind: "deck",
    deckTitle: "JK-retailer-activation-kit.pptx",
    body: "Retailer counter activation: shade boards, demo cans, customer-pitch script and incentive structure.",
  };
}

function channelMap(channels: string[]): ActionLink {
  return {
    label: "Click to see the channel playbook",
    kind: "popup-list",
    items: (channels.length > 0 ? channels : ["Retailer counter", "WhatsApp"]).map(
      (c) => `${c} — talk-track, collateral and 2-week pilot KPI`,
    ),
  };
}

export function generateActionPlan(
  clusterId: string,
  strategy: ConnectStrategy,
  answers: StrategyAnswers,
): ActionStep[] {
  const singular = prospectSingular(clusterId).toLowerCase();
  const plural = prospectPlural(clusterId).toLowerCase();
  const steps: ActionStep[] = [];

  if (strategy === "BRAND") {
    if (answers.runLocalCampaigns === "Y") {
      const picks = answers.selectedCampaigns ?? [];
      steps.push({
        text: picks.length > 0
          ? `Brief the local creative team on these campaigns: ${picks.join("; ")}.`
          : `Brief the local creative team on a campaign for ${plural} in this area.`,
        link: campaignDeck(clusterId),
      });
      steps.push({ text: "Identify high-footfall hoarding sites and retailer counters for visibility." });
      steps.push({ text: "Run a 4-week burst with WhatsApp + on-ground material in the cluster.", link: pamphletDeck(clusterId) });
      steps.push({ text: "Track inbound leads and attribute back to the campaign." });
    } else {
      steps.push({ text: "Audit existing brand visibility (hoardings, retailer signage) in the cluster." });
      steps.push({ text: `Plan a low-cost visibility refresh aimed at ${plural}.`, link: campaignDeck(clusterId) });
      steps.push({ text: "Track recall through quick walk-in conversations with retailers." });
    }
  }

  if (strategy === "CONTRACTOR") {
    if (answers.knowsContractors === "Y" && (answers.contractors ?? []).length > 0) {
      const names = (answers.contractors ?? []).map((c) => c.name).filter(Boolean);
      steps.push({
        text: `Re-engage the contractors you already know${names.length ? ` (${names.slice(0, 3).join(", ")}${names.length > 3 ? "…" : ""})` : ""}.`,
        link: contractorList(clusterId, names),
      });
      steps.push({ text: `Brief them on the JK proposition specifically for ${plural}.`, link: jkProposition(clusterId) });
      steps.push({ text: "Co-design pamphlets they can distribute to their site supervisors.", link: pamphletDeck(clusterId) });
      steps.push({ text: `Schedule joint visits to 3 priority ${plural} this month.` });
      steps.push({ text: "Track which contractor brings in the warmest leads." });
    } else {
      steps.push({ text: `Map active contractors serving ${plural} in this cluster.`, link: contractorList(clusterId, []) });
      steps.push({ text: "Pull a starter list from retailer references and field observation." });
      steps.push({ text: "Set up an introductory contractor meet with a clear margin / loyalty pitch.", link: eventDeck() });
      steps.push({ text: `Co-design pamphlets for ${plural} and distribute through the contractors.`, link: pamphletDeck(clusterId) });
      steps.push({ text: "Track incoming contacts and assist contractors with conversions." });
    }
  }

  if (strategy === "OUTREACH") {
    if (answers.hasCommunityTouchpoint === "Y") {
      steps.push({
        text: `Leverage your existing community touchpoint to host an introduction with ${plural}.`,
        link: communityList(clusterId, answers.communityContacts ?? []),
      });
    } else {
      steps.push({
        text: `Identify one community touchpoint (RWA, association, school admin, dealer council) that can warm-introduce JK to ${plural}.`,
        link: communityList(clusterId, []),
      });
    }
    if (answers.consideredContributionEvents === "Y") {
      const topics = (answers.selectedEventTopics ?? []).slice(0, 3);
      const fallback = getTopics(clusterId, "Awareness").slice(0, 2);
      const chosen = topics.length > 0 ? topics : fallback;
      steps.push({
        text: chosen.length > 0
          ? `Plan a contribution event around: ${chosen.map((t) => `"${t}"`).join("; ")}.`
          : `Plan a region-by-region contribution event tailored to ${plural}.`,
        link: eventDeck(),
      });
      steps.push({ text: "Invite key decision makers and capture warm leads on the day." });
      steps.push({ text: "Follow up within 7 days with a tailored proposal.", link: jkProposition(clusterId) });
    } else {
      steps.push({ text: "Pick one contribution event format you can pilot in the next 30 days.", link: eventDeck() });
      steps.push({ text: `Run it region by region across the ${plural} in this cluster.` });
    }
    steps.push({ text: "Track which touchpoints / events produce the warmest leads." });
  }

  if (strategy === "D2C") {
    if (answers.wantsDirectReach === "Y") {
      const channels = answers.d2cChannels ?? [];
      steps.push({
        text: channels.length > 0
          ? `Activate these direct channels: ${channels.join(", ")}.`
          : "Shortlist 2 direct channels to test (e.g. retailer counter activation + WhatsApp).",
        link: channelMap(channels),
      });
      steps.push({ text: `Equip retailers serving ${plural} with collateral and demo material.`, link: retailerKit() });
      steps.push({ text: "Run a 2-week walk-in / WhatsApp pilot and measure conversion." });
      steps.push({ text: "Capture customer feedback and refine the pitch.", link: jkProposition(clusterId) });
    } else {
      steps.push({ text: `Map the direct purchase journey of a typical ${singular} customer.` });
      steps.push({ text: "Identify the easiest channel to pilot first.", link: channelMap([]) });
    }
  }

  return steps;
}
